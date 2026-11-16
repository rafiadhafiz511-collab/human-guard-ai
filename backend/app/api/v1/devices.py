
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_admin
from app.core.security import authenticate_device
from app.database.database import get_db
from app.models.device import Device
from app.models.device_command import DeviceCommand as DeviceCommandModel
from app.models.user import User
from app.schemas.device import (
    CommandAckRequest,
    DeviceCommandRequest,
    DeviceRegister,
    DeviceUpdate,
    HeartbeatRequest,
)


router = APIRouter(
    prefix="/devices",
    tags=["Devices"],
)


ALLOWED_PUMP_COMMANDS = {
    "PUMP_ON",
    "PUMP_OFF",
    "AUTO_MODE",
    "MANUAL_MODE",
}


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
        "secret_key": device.secret_key,
        "status": device.status,
    }


# ============================================================
# GET ALL DEVICES
# ============================================================

@router.get("/")
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

    return devices


# ============================================================
# GET SINGLE DEVICE
# ============================================================

@router.get("/{device_id}")
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

        pending
           ↓
        sent
           ↓
      completed / failed

    The device receives pending commands
    during its next heartbeat.
    """

    device = get_device_or_404(device_id, db)
    command_name = data.command.strip().upper()

    if command_name not in ALLOWED_PUMP_COMMANDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid pump command",
                "allowed_commands": sorted(ALLOWED_PUMP_COMMANDS),
            },
        )

    command = DeviceCommandModel(
        device_id=device.id,
        command=command_name,
        status="pending",
    )

    try:
        db.add(command)
        db.commit()
        db.refresh(command)

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
    Device heartbeat.

    Updates:

    - last_seen
    - online status
    - firmware version

    If a pending command exists, the oldest one is returned
    and its status changes from pending -> sent.
    """

    # --------------------------------------------------------
    # Update device heartbeat information
    # --------------------------------------------------------

    device.last_seen = datetime.now(timezone.utc)
    device.status = "online"

    if data.firmware_version:
        device.firmware_version = data.firmware_version

    # --------------------------------------------------------
    # Find oldest pending command
    # --------------------------------------------------------

    command = (
        db.query(DeviceCommandModel)
        .filter(
            DeviceCommandModel.device_id == device.id,
            DeviceCommandModel.status == "pending",
        )
        .order_by(DeviceCommandModel.created_at.asc())
        .first()
    )

    response_command = None

    if command:
        command.status = "sent"
        command.sent_at = datetime.now(timezone.utc)

        response_command = {
            "command_id": command.id,
            "command": command.command,
        }

    # --------------------------------------------------------
    # Save changes
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(device)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process heartbeat",
        )

    return {
        "success": True,
        "status": device.status,
        "last_seen": device.last_seen,
        "firmware_version": device.firmware_version,
        "command": response_command,
    }


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

    Allowed final statuses:

    - completed
    - failed
    """

    # --------------------------------------------------------
    # Security check
    # --------------------------------------------------------

    if device.device_id != device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Device authentication mismatch",
        )

    # --------------------------------------------------------
    # Validate ACK status
    # --------------------------------------------------------

    if data.status not in {"completed", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid command status",
        )

    # --------------------------------------------------------
    # Find command
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Prevent duplicate ACK / invalid state transition
    # --------------------------------------------------------

    if command.status in {"completed", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Command has already been completed",
        )

    if command.status != "sent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Command cannot be acknowledged from status '{command.status}'",
        )

    # --------------------------------------------------------
    # Update command
    # --------------------------------------------------------

    command.status = data.status
    command.completed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(command)

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

    Commands are returned from newest to oldest.
    """

    device = get_device_or_404(device_id, db)

    commands = (
        db.query(DeviceCommandModel)
        .filter(
            DeviceCommandModel.device_id == device.id,
        )
        .order_by(DeviceCommandModel.created_at.desc())
        .all()
    )

    return commands
