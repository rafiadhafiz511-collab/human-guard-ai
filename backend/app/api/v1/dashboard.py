from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.device import Device
from app.models.device_command import DeviceCommand as DeviceCommandModel


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/")
def dashboard_stats(
    db: Session = Depends(get_db),
):
    """
    Return Smart Pump dashboard statistics.
    """

    # ============================================================
    # TIME
    # ============================================================

    now = datetime.now(timezone.utc)

    # Device is considered offline if no heartbeat
    # was received within the last 60 seconds.
    offline_time = now - timedelta(seconds=60)

    # ============================================================
    # DEVICE STATISTICS
    # ============================================================

    total_devices = (
        db.query(func.count(Device.id))
        .scalar()
        or 0
    )

    online_devices = (
        db.query(func.count(Device.id))
        .filter(Device.last_seen >= offline_time)
        .scalar()
        or 0
    )

    offline_devices = total_devices - online_devices

    # ============================================================
    # COMMAND STATISTICS
    # ============================================================

    total_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .scalar()
        or 0
    )

    pending_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .filter(
            DeviceCommandModel.status == "pending"
        )
        .scalar()
        or 0
    )

    sent_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .filter(
            DeviceCommandModel.status == "sent"
        )
        .scalar()
        or 0
    )

    completed_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .filter(
            DeviceCommandModel.status == "completed"
        )
        .scalar()
        or 0
    )

    failed_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .filter(
            DeviceCommandModel.status == "failed"
        )
        .scalar()
        or 0
    )

    cancelled_commands = (
        db.query(func.count(DeviceCommandModel.id))
        .filter(
            DeviceCommandModel.status == "cancelled"
        )
        .scalar()
        or 0
    )

    # ============================================================
    # LATEST COMMAND
    # ============================================================

    latest_command = (
        db.query(DeviceCommandModel)
        .order_by(
            DeviceCommandModel.created_at.desc()
        )
        .first()
    )

    latest_command_device = None


    if latest_command:
        latest_command_device = (
            db.query(Device)
            .filter(Device.id == latest_command.device_id)
            .first()
        )

    # ============================================================
    # RESPONSE
    # ============================================================

    return {
        "devices": {
            "total": total_devices,
            "online": online_devices,
            "offline": offline_devices,
        },

        "commands": {
            "total": total_commands,
            "pending": pending_commands,
            "sent": sent_commands,
            "completed": completed_commands,
            "failed": failed_commands,
            "cancelled": cancelled_commands,
        },

        "latest_command": (
            {
                "id": latest_command.id,
                "device_id": (
                    latest_command_device.device_id
                    if latest_command_device
                    else latest_command.device_id
                ),
                "command": latest_command.command,
                "status": latest_command.status,
                "created_at": (
                    latest_command.created_at.isoformat()
                    if latest_command.created_at
                    else None
                ),
                "sent_at": (
                    latest_command.sent_at.isoformat()
                    if latest_command.sent_at
                    else None
                ),
                "completed_at": (
                    latest_command.completed_at.isoformat()
                    if latest_command.completed_at
                    else None
                ),
            }
            if latest_command
            else None
        ),

        "server_time": now.isoformat(),

        "offline_after_seconds": 60,
    }