import asyncio
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.device import Device
from app.core.websocket_manager import manager


logger = logging.getLogger(__name__)


# ============================================================
# GLOBAL EVENT LOOP REFERENCE FOR THREAD-SAFE WS BROADCAST
# ============================================================

main_loop: asyncio.AbstractEventLoop | None = None


def set_main_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """
    FastAPI startup (main.py) এ মূল Event Loop সেট করার জন্য।
    """
    global main_loop
    main_loop = loop


# ============================================================
# MQTT CONFIGURATION
# ============================================================

MQTT_BROKER_HOST = "broker.hivemq.com"
MQTT_BROKER_PORT = 1883
MQTT_KEEPALIVE = 60

MQTT_TOPIC_TELEMETRY = "humantech/devices/+/telemetry"
MQTT_TOPIC_COMMAND = "humantech/devices/{device_id}/command"


# ============================================================
# MQTT CLIENT SETUP
# ============================================================

mqtt_client = mqtt.Client()
_mqtt_started = False
_mqtt_lock = threading.Lock()


# ============================================================
# TOPIC & JSON HELPERS
# ============================================================

def get_device_id_from_topic(topic: str) -> str | None:
    """
    Extract hardware device_id from:
    humantech/devices/{device_id}/telemetry
    """
    parts = topic.split("/")
    if len(parts) == 4 and parts[0] == "humantech" and parts[1] == "devices" and parts[3] == "telemetry":
        return parts[2]
    return None


def decode_json_payload(payload: bytes) -> dict[str, Any] | None:
    """
    Decode MQTT payload as a JSON dictionary.
    """
    try:
        decoded = payload.decode("utf-8")
        data = json.loads(decoded)
        if isinstance(data, dict):
            return data
        logger.warning("MQTT payload must be a JSON object")
    except UnicodeDecodeError:
        logger.warning("MQTT payload is not valid UTF-8")
    except json.JSONDecodeError:
        logger.warning("MQTT payload is not valid JSON")
    return None


# ============================================================
# MQTT CALLBACKS
# ============================================================

def on_connect(client, userdata, flags, rc):
    """
    MQTT broker connection callback.
    """
    if rc == 0:
        logger.info("MQTT connected successfully: %s:%s", MQTT_BROKER_HOST, MQTT_BROKER_PORT)
        result, _ = client.subscribe(MQTT_TOPIC_TELEMETRY, qos=1)
        if result == mqtt.MQTT_ERR_SUCCESS:
            logger.info("MQTT subscribed: %s", MQTT_TOPIC_TELEMETRY)
        else:
            logger.error("MQTT subscription failed: %s", result)
    else:
        logger.error("MQTT connection failed. rc=%s", rc)


def on_disconnect(client, userdata, rc):
    """
    MQTT disconnect callback.
    """
    if rc == 0:
        logger.info("MQTT disconnected normally.")
    else:
        logger.warning("MQTT disconnected unexpectedly. rc=%s", rc)


# ============================================================
# WEBSOCKET BROADCAST (THREAD-SAFE)
# ============================================================

def broadcast_to_home(home_id: str | None, payload: dict[str, Any]) -> None:
    """
    Safely delegate WebSocket broadcast from MQTT background thread
    to FastAPI main async event loop.
    """
    if not home_id:
        return

    global main_loop

    # Fallback attempt if main_loop wasn't explicitly set
    if main_loop is None:
        try:
            main_loop = asyncio.get_event_loop()
        except RuntimeError:
            pass

    if main_loop and main_loop.is_running():
        asyncio.run_coroutine_threadsafe(
            manager.broadcast_to_home(str(home_id), payload),
            main_loop,
        )
    else:
        logger.warning(
            "Main event loop is not available/running. WS broadcast skipped for home=%s",
            home_id,
        )


# ============================================================
# TELEMETRY PROCESSING
# ============================================================

def process_telemetry_message(device_id: str, telemetry_data: dict[str, Any]) -> None:
    """
    Process telemetry, update DB, trigger automation, and broadcast via WS.
    """
    db: Session = SessionLocal()

    try:
        # 1. Find device
        device = db.query(Device).filter(Device.device_id == device_id).first()

        if not device:
            logger.warning("Telemetry received from unknown device_id=%s", device_id)
            return

        # 2. Update status and timestamp
        device.last_seen = datetime.now(timezone.utc)
        device.status = "online"

        reported_state = telemetry_data.get("state")
        if reported_state is not None:
            device.state = str(reported_state)

        db.add(device)
        db.commit()
        db.refresh(device)

        logger.info("[MQTT TELEMETRY] device=%s data=%s", device.device_id, telemetry_data)

        # 3. Automation Engine
        if device.home_id:
            from app.services.automation_engine import process_device_telemetry_or_state

            process_device_telemetry_or_state(
                db=db,
                home_id=str(device.home_id),
                device_id=device.device_id,
                incoming_data=telemetry_data,
            )

        # 4. Broadcast live update to mobile app via WebSocket
        ws_payload = {
            "event": "device_telemetry_update",
            "device_id": device.device_id,
            "device_name": device.device_name,
            "device_type": device.device_type,
            "status": device.status,
            "state": device.state,
            "data": telemetry_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        broadcast_to_home(home_id=device.home_id, payload=ws_payload)

    except Exception:
        db.rollback()
        logger.exception("Failed to process telemetry for device=%s", device_id)
    finally:
        db.close()


def on_message(client, userdata, msg):
    """
    MQTT incoming message callback.
    """
    try:
        device_id = get_device_id_from_topic(msg.topic)
        if not device_id:
            logger.warning("Invalid MQTT telemetry topic: %s", msg.topic)
            return

        telemetry_data = decode_json_payload(msg.payload)
        if telemetry_data is None:
            return

        process_telemetry_message(device_id=device_id, telemetry_data=telemetry_data)

    except Exception:
        logger.exception("Unhandled MQTT message error on topic=%s", msg.topic)


# ============================================================
# START / STOP MQTT CLIENT
# ============================================================

def start_mqtt() -> None:
    """
    Start MQTT client in background thread loop.
    """
    global _mqtt_started

    with _mqtt_lock:
        if _mqtt_started:
            logger.info("MQTT client already started.")
            return

        mqtt_client.on_connect = on_connect
        mqtt_client.on_disconnect = on_disconnect
        mqtt_client.on_message = on_message

        try:
            mqtt_client.connect_async(
                MQTT_BROKER_HOST,
                MQTT_BROKER_PORT,
                MQTT_KEEPALIVE,
            )
            mqtt_client.loop_start()
            _mqtt_started = True
            logger.info("MQTT background loop started.")
        except Exception:
            logger.exception("Failed to start MQTT client.")


def stop_mqtt() -> None:
    """
    Stop MQTT client safely.
    """
    global _mqtt_started

    with _mqtt_lock:
        if not _mqtt_started:
            return

        try:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
        except Exception:
            logger.exception("Error while stopping MQTT client.")
        finally:
            _mqtt_started = False
            logger.info("MQTT client stopped.")


# ============================================================
# PUBLISH DEVICE COMMAND
# ============================================================

def publish_device_command(device_id: str, command_payload: dict[str, Any]) -> bool:
    """
    Publish command payload to hardware device.
    Topic: humantech/devices/{device_id}/command
    """
    if not device_id:
        logger.error("Cannot publish command: device_id is empty.")
        return False

    if not isinstance(command_payload, dict):
        logger.error("Command payload must be a dictionary.")
        return False

    if not mqtt_client.is_connected():
        logger.warning("MQTT is not connected. Command not sent. device=%s", device_id)
        return False

    topic = MQTT_TOPIC_COMMAND.format(device_id=device_id)

    try:
        payload = json.dumps(command_payload, separators=(",", ":"))
    except (TypeError, ValueError):
        logger.exception("Failed to serialize MQTT command.")
        return False

    try:
        info = mqtt_client.publish(topic, payload, qos=1)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            logger.error("MQTT publish failed. device=%s rc=%s", device_id, info.rc)
            return False

        logger.info("[MQTT COMMAND SENT] device=%s topic=%s payload=%s", device_id, topic, payload)
        return True
    except Exception:
        logger.exception("MQTT command publish exception. device=%s", device_id)
        return False