from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.device import Device
from app.models.device_channel import DeviceChannel
from app.services.device_command_service import create_device_command
from app.core.mqtt import publish_device_command
from app.models.user import User
from app.schemas.device import DeviceChannelCreate, DeviceChannelResponse

router = APIRouter(
    prefix="/devices",
    tags=["Device Channels"],
)

@router.post("/{device_id}/channels", response_model=DeviceChannelResponse)
def create_channel(
    device_id: str,
    data: DeviceChannelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Device.device_id (Hardware ID) দিয়ে ফিল্টার করা হচ্ছে
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    existing_channel = (
        db.query(DeviceChannel)
        .filter(
            DeviceChannel.device_id == device.id,
            DeviceChannel.channel_number == data.channel_number,
        )
        .first()
    )
    if existing_channel:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Channel number already exists")

    if data.channel_number < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Channel number must be greater than 0")

    channel = DeviceChannel(
        device_id=device.id,
        channel_number=data.channel_number,
        name=data.name.strip(),
        type=data.type.strip().upper(),
        state="OFF",
    )

    try:
        db.add(channel)
        db.commit()
        db.refresh(channel)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create channel")

    return channel


@router.get("/{device_id}/channels", response_model=list[DeviceChannelResponse])
def get_device_channels(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    return (
        db.query(DeviceChannel)
        .filter(DeviceChannel.device_id == device.id)
        .order_by(DeviceChannel.channel_number.asc())
        .all()
    )


@router.post("/{device_id}/channels/{channel_id}/command")
def send_channel_command(
    device_id: str,
    channel_id: str,
    command: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    channel = (
        db.query(DeviceChannel)
        .filter(DeviceChannel.id == channel_id, DeviceChannel.device_id == device.id)
        .first()
    )
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    command_name = command.strip().upper()
    if command_name not in {"ON", "OFF"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Command must be ON or OFF")

    channel.state = command_name
    command_str = f"CHANNEL:{channel.channel_number}:{command_name}"

    try:
        # ১. ডেটাবেসে কমান্ড লগ তৈরি
        device_command = create_device_command(
            db=db,
            device=device,
            command=command_str,
        )
        db.commit()
        db.refresh(channel)
        db.refresh(device_command)

        # ২. MQTT-র মাধ্যমে হার্ডওয়্যারে (ESP32) সরাসরি কমান্ড পাঠানো
        publish_device_command(
            device_id=device.device_id,
            command_payload={
                "command": command_str,
                "channel": channel.channel_number,
                "state": command_name,
                "triggered_by": f"user:{current_user.id}"
            }
        )

    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process channel command")

    return {
        "success": True,
        "device_id": device.device_id,
        "channel_id": channel.id,
        "channel_number": channel.channel_number,
        "command": command_name,
        "state": channel.state,
        "command_id": device_command.id,
        "command_status": device_command.status,
    }