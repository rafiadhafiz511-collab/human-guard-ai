import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_admin
from app.core.security import authenticate_device
from app.database.database import get_db
from app.models.device import Device
from app.models.device_channel import DeviceChannel
from app.models.device_command import DeviceCommand as DeviceCommandModel
from app.models.firmware import Firmware
from app.models.user import User
from app.schemas.device import (
    CommandAckRequest,
    DeviceCommandRequest,
    DeviceRegister,
    DeviceResponse,
    DeviceUpdate,
    HeartbeatRequest,
)
from app.services.device_command_service import create_device_command
from app.services.heartbeat_service import process_heartbeat
from app.services.ota_service import request_ota_update

router = APIRouter(
    prefix="/devices",
    tags=["Devices"],
)


# ============================================================
# HELPER
# ============================================================

def get_device_or_404(
    device_id: str,
    db: Session,
) -> Device:
    """Return a device or raise 404."""

    device = (
        db.query(Device)
        .filter(Device.device_id == device_id)
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    return device


# ============================================================
# REQUEST OTA UPDATE
# ============================================================

@router.post("/{device_id}/ota")
def request_device_ota(
    device_id: str,
    firmware_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Request an OTA firmware update for a device.

    Only administrators can request firmware updates.
    """

    # --------------------------------------------------------
    # GET DEVICE
    # --------------------------------------------------------

    device = get_device_or_404(
        device_id,
        db,
    )

    # --------------------------------------------------------
    # GET FIRMWARE
    # --------------------------------------------------------

    firmware = (
        db.query(Firmware)
        .filter(
            Firmware.id == firmware_id,
            Firmware.is_active.is_(True),
        )
        .first()
    )

    if not firmware:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Firmware not found",
        )

    # --------------------------------------------------------
    # REQUEST OTA
    # --------------------------------------------------------

    try:
        request_ota_update(
            db=db,
            device=device,
            firmware=firmware,
        )

        db.commit()
        db.refresh(device)

    except ValueError as e:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to request OTA update",
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "success": True,
        "device_id": device.device_id,
        "ota_status": device.ota_status,
        "target_version": device.ota_target_version,
        "firmware_url": device.ota_firmware_url,
        "checksum": device.ota_checksum,
        "requested_at": device.ota_requested_at,
    }


# ============================================================
# REGISTER DEVICE
# ============================================================

@router.post("/register")
def register_device(
    data: DeviceRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Register a new device.

    If the device already exists, return its existing information.
    Only administrators can register devices.
    """

    existing_device = (
        db.query(Device)
        .filter(Device.device_id == data.device_id)
        .first()
    )

    if existing_device:
        return {
            "message": "Device already registered",
            "device_id": existing_device.device_id,
            "secret_key": existing_device.secret_key,
            "status": existing_device.status,
        }

    secret_key = secrets.token_hex(32)

    device = Device(
        device_id=data.device_id,
        device_name=data.device_name,
        device_type=data.device_type.upper(),
        secret_key=secret_key,
        status="offline",
    )

    try:
        db.add(device)
        db.commit()
        db.refresh(device)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register device",
        )

    return {
        "success": True,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "device_type": device.device_type,
        "secret_key": device.secret_key,
        "status": device.status,
    }


# ============================================================
# GET ALL DEVICES
# ============================================================

@router.get("/", response_model=list[DeviceResponse])
def get_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all registered devices.
    """

    devices = (
        db.query(Device)
        .order_by(Device.device_id.asc())
        .all()
    )

    now = datetime.now(timezone.utc)
    offline_time = now - timedelta(seconds=60)

    for device in devices:
        if device.last_seen:
            last_seen = device.last_seen

            # PostgreSQL may return a naive datetime
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=timezone.utc)

            if last_seen >= offline_time:
                device.status = "online"
            else:
                device.status = "offline"
        else:
            device.status = "offline"

    return devices


# ============================================================
# GET SINGLE DEVICE
# ============================================================

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific device by device_id.
    """

    return get_device_or_404(device_id, db)


# ============================================================
# UPDATE DEVICE
# ============================================================

@router.patch("/{device_id}")
def update_device(
    device_id: str,
    data: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update device information.
    """

    device = get_device_or_404(device_id, db)

    if data.device_name is not None:
        device.device_name = data.device_name

    if data.status is not None:
        device.status = data.status

    if data.device_type is not None:
        device.device_type = data.device_type.strip().upper()

    try:
        db.commit()
        db.refresh(device)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update device",
        )

    return device


# ============================================================
# DELETE DEVICE
# ============================================================

@router.delete("/{device_id}")
def delete_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a registered device.

    Only administrators can delete devices.
    """

    device = get_device_or_404(device_id, db)

    try:
        db.delete(device)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete device",
        )

    return {
        "success": True,
        "message": "Device deleted successfully",
        "device_id": device_id,
    }


# ============================================================
# SEND COMMAND TO DEVICE
# ============================================================

@router.post("/{device_id}/command")
def send_command(
    device_id: str,
    data: DeviceCommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a command for a device.

    Command lifecycle:
        pending -> sent -> completed / failed
    """

    device = get_device_or_404(device_id, db)

    try:
        command = create_device_command(
            db=db,
            device=device,
            command=data.command,
        )

        db.commit()
        db.refresh(command)

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create command",
        )

    return {
        "success": True,
        "device_id": device.device_id,
        "command_id": command.id,
        "command": command.command,
        "status": command.status,
        "created_at": command.created_at,
    }


# ============================================================
# DEVICE HEARTBEAT
# ============================================================

@router.post("/heartbeat")
def heartbeat(
    data: HeartbeatRequest,
    device: Device = Depends(authenticate_device),
    db: Session = Depends(get_db),
):
    """
    Device heartbeat processing.

    Delegates heartbeat logic to heartbeat_service.

    Handles:
    - device online status
    - last seen timestamp
    - firmware version
    - pending commands
    - OTA information
    """

    try:
        result = process_heartbeat(
            db=db,
            device=device,
            telemetry=data.model_dump(),
        )

        db.commit()

        return result

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process heartbeat",
        )


# ============================================================
# ACKNOWLEDGE COMMAND
# ============================================================

@router.post("/{device_id}/command/{command_id}/ack")
def acknowledge_command(
    device_id: str,
    command_id: str,
    data: CommandAckRequest,
    device: Device = Depends(authenticate_device),
    db: Session = Depends(get_db),
):
    """
    Device reports the result of a command.
    """

    if device.device_id != device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Device authentication mismatch",
        )

    if data.status not in {"completed", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid command status",
        )

    command = (
        db.query(DeviceCommandModel)
        .filter(
            DeviceCommandModel.id == command_id,
            DeviceCommandModel.device_id == device.id,
        )
        .first()
    )

    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found",
        )

    if command.status in {"completed", "failed", "cancelled"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Command has already been completed",
        )

    if command.status != "sent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Command cannot be acknowledged from status '{command.status}'",
        )

    command.status = data.status
    command.completed_at = datetime.now(timezone.utc)

    # General device state update logic
    if data.status == "completed":
        if command.command.endswith("_ON"):
            device.state = "ON"
        elif command.command.endswith("_OFF"):
            device.state = "OFF"
        elif hasattr(device, "mode") and command.command in {"AUTO_MODE", "MANUAL_MODE"}:
            device.mode = command.command

    try:
        db.commit()
        db.refresh(command)
        db.refresh(device)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to acknowledge command",
        )

    return {
        "success": True,
        "command_id": command.id,
        "command": command.command,
        "status": command.status,
        "completed_at": command.completed_at,
    }


# ============================================================
# GET COMMAND HISTORY
# ============================================================

@router.get("/{device_id}/commands")
def get_device_commands(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get command history for a device.
    """

    device = get_device_or_404(device_id, db)

    commands = (
        db.query(DeviceCommandModel)
        .filter(DeviceCommandModel.device_id == device.id)
        .order_by(DeviceCommandModel.created_at.desc())
        .all()
    )

    return commands