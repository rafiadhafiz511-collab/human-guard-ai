from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ============================================================
# DEVICE REGISTER
# ============================================================

class DeviceRegister(BaseModel):
    device_id: str
    device_name: str
    device_type: str = "SMART_DEVICE"


# ============================================================
# DEVICE RESPONSE
# ============================================================

class DeviceResponse(BaseModel):
    id: str
    device_id: str
    device_name: str
    status: str
    device_type: str
    state: str

    last_seen: datetime | None = None
    firmware_version: str

    home_id: str | None = None
    room_id: str | None = None

    model_config = {
        "from_attributes": True
    }


# ============================================================
# DEVICE UPDATE
# ============================================================

class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    status: Optional[str] = None
    device_type: Optional[str] = None


# ============================================================
# HEARTBEAT
# ============================================================

class HeartbeatRequest(BaseModel):
    firmware_version: str | None = None


# ============================================================
# OTA
# ============================================================

class OTAStatusRequest(BaseModel):
    status: str
    firmware_version: str | None = None


# ============================================================
# DEVICE COMMAND
# ============================================================

class DeviceCommandRequest(BaseModel):
    command: str


# ============================================================
# COMMAND ACK
# ============================================================

class CommandAckRequest(BaseModel):
    status: str


# ============================================================
# DEVICE CHANNEL CREATE
# ============================================================

class DeviceChannelCreate(BaseModel):
    channel_number: int
    name: str
    type: str


# ============================================================
# DEVICE CHANNEL RESPONSE
# ============================================================

class DeviceChannelResponse(BaseModel):
    id: str
    device_id: str
    channel_number: int
    name: str
    type: str
    state: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }