import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.websocket_manager import manager

router = APIRouter()
logger = logging.getLogger(__name__)

# WebSocket heartbeat interval (seconds)
HEARTBEAT_INTERVAL = 30


async def _send_periodic_ping(websocket: WebSocket, label: str) -> None:
    """সংযোগ সচল রাখতে নির্দিষ্ট বিরতিতে ping পাঠায়।"""
    while True:
        try:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            await websocket.send_json({
                "type": "ping",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            logger.debug("[WS HEARTBEAT] Sent ping (%s)", label)
        except Exception as e:
            logger.debug("[WS HEARTBEAT STOPPED] (%s) | Error: %s", label, e)
            break


@router.websocket("/ws/homes/{home_id}")
async def websocket_endpoint(websocket: WebSocket, home_id: str) -> None:
    """নির্দিষ্ট হোমের রিয়েল-টাইম ডিভাইস ও টেলিমেট্রি আপডেটের WebSocket এন্ডপয়েন্ট।"""
    home_key = str(home_id)
    await manager.connect(websocket, home_key)
    heartbeat_task = asyncio.create_task(
        _send_periodic_ping(websocket, f"home:{home_key}")
    )

    try:
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL + 10,
                )
                try:
                    message = json.loads(data)
                    logger.debug("[WS RECEIVED] Home: %s | Data: %s", home_key, message)
                    if isinstance(message, dict) and message.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                except json.JSONDecodeError:
                    logger.warning("[WS] Invalid JSON from home %s", home_key)
            except asyncio.TimeoutError:
                continue

    except WebSocketDisconnect:
        logger.info("[WS DISCONNECTED] Home: %s", home_key)
    except Exception as e:
        logger.error("[WS EXCEPTION] Home: %s | Error: %s", home_key, e)
    finally:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass
        manager.disconnect(websocket, home_key)
        try:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        except Exception:
            pass


@router.websocket("/ws/devices")
async def websocket_devices_endpoint(websocket: WebSocket) -> None:
    """গ্লোবাল ডিভাইস আপডেট ও keep-alive ping/pong হ্যান্ডলার।"""
    await websocket.accept()
    logger.info("[WS DEVICES] Client connected")
    heartbeat_task = asyncio.create_task(
        _send_periodic_ping(websocket, "global:devices")
    )

    try:
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL + 10,
                )
                try:
                    message = json.loads(data)
                    logger.debug("[WS DEVICES RECEIVED] Data: %s", message)
                    if isinstance(message, dict) and message.get("type") == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                except json.JSONDecodeError:
                    logger.warning("[WS DEVICES] Invalid JSON received")
            except asyncio.TimeoutError:
                continue

    except WebSocketDisconnect:
        logger.info("[WS DEVICES] Client disconnected")
    except Exception as e:
        logger.error("[WS DEVICES EXCEPTION] Error: %s", e)
    finally:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass
        try:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        except Exception:
            pass