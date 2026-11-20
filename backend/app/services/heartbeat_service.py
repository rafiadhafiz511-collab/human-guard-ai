from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.services.command_service import handle_command_timeout, mark_command_sent


def get_pending_command(
    db: Session,
    device_id: str,
) -> Optional[DeviceCommand]:
    """
    Get the next pending command for a device.
    """

    # --------------------------------------------------------
    # 1. CHECK FOR TIMED OUT COMMANDS
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
        .order_by(DeviceCommand.created_at.asc())
        .first()
    )

    if pending_command:
        mark_command_sent(pending_command)

    return pending_command


def process_heartbeat(
    db: Session,
    device: Device,
    telemetry: dict[str, Any],
) -> dict[str, Any]:
    """
    Process device heartbeat and return response.

    Handles:
    - device online status
    - last seen timestamp
    - firmware version
    - pending commands
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

    # Do not overwrite the database value with None.
    if reported_firmware_version:
        device.firmware_version = (
            reported_firmware_version
        )

    # ========================================================
    # COMMAND
    # ========================================================

    command = get_pending_command(db, device.id)

    response_command = None
    if command:
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