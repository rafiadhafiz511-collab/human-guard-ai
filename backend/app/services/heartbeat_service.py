from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.mqtt import publish_device_command
from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.services.command_service import (
    handle_command_timeout,
    mark_command_sent,
)


# ============================================================
# GET PENDING COMMAND
# ============================================================

def get_pending_command(
    db: Session,
    device_id: str,
) -> Optional[DeviceCommand]:
    """
    Get the next pending command for a device.

    Command lifecycle:

        pending
           ↓
         sent
           ↓
     completed / failed

    Before selecting a new pending command, existing sent
    commands are checked for timeout.

    If a sent command times out:
        - retry is allowed -> pending
        - maximum attempts reached -> failed
    """

    # --------------------------------------------------------
    # 1. CHECK SENT COMMANDS FOR TIMEOUT
    # --------------------------------------------------------

    sent_commands = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "sent",
        )
        .all()
    )

    for sent_command in sent_commands:
        handle_command_timeout(sent_command)

    # --------------------------------------------------------
    # 2. GET NEXT PENDING COMMAND
    # --------------------------------------------------------

    pending_command = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "pending",
        )
        .order_by(
            DeviceCommand.created_at.asc()
        )
        .first()
    )

    return pending_command


# ============================================================
# DELIVER PENDING COMMAND
# ============================================================

def deliver_pending_command(
    db: Session,
    device: Device,
    command: DeviceCommand,
) -> bool:
    """
    Publish a pending command to the physical device through MQTT.

    Returns:
        True  -> MQTT publish successful
        False -> MQTT publish failed
    """

    payload = {
        "id": command.id,
        "command": command.command,
        "attempt": command.attempt_count + 1,
    }

    published = publish_device_command(
        device_id=device.device_id,
        command_payload=payload,
    )

    if not published:
        return False

    mark_command_sent(command)

    return True


# ============================================================
# PROCESS DEVICE HEARTBEAT
# ============================================================

def process_heartbeat(
    db: Session,
    device: Device,
    telemetry: dict[str, Any],
) -> dict[str, Any]:
    """
    Process device heartbeat and prepare the response.

    Handles:

    - device online status
    - last seen timestamp
    - firmware version
    - command delivery lifecycle
    - command retry state
    - OTA information
    """

    # ========================================================
    # DEVICE STATUS
    # ========================================================

    device.last_seen = datetime.now(timezone.utc)
    device.status = "online"

    # ========================================================
    # FIRMWARE VERSION
    # ========================================================

    reported_firmware_version = telemetry.get(
        "firmware_version"
    )

    # Never overwrite an existing firmware version with None.
    if reported_firmware_version:
        device.firmware_version = (
            reported_firmware_version
        )

    # ========================================================
    # COMMAND DELIVERY
    # ========================================================

    command = get_pending_command(
        db=db,
        device_id=device.id,
    )

    response_command = None

    if command:
        delivered = deliver_pending_command(
            db=db,
            device=device,
            command=command,
        )

        if delivered:
            response_command = {
                "id": command.id,
                "command": command.command,
                "attempt": command.attempt_count,
            }

    # ========================================================
    # OTA INFORMATION
    # ========================================================

    response_ota = None

    if device.ota_status == "pending":
        response_ota = {
            "available": True,
            "version": device.ota_target_version,
            "download_url": device.ota_firmware_url,
            "sha256": device.ota_checksum,
        }

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "success": True,
        "status": device.status,
        "last_seen": device.last_seen,
        "firmware_version": device.firmware_version,
        "command": response_command,
        "ota": response_ota,
    }