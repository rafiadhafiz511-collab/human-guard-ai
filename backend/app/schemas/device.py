from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DeviceRegister(BaseModel):
    device_id: str
    device_name: str
    device_type: str = "SMART_DEVICE"


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


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    status: Optional[str] = None
    device_type: Optional[str] = None


class HeartbeatRequest(BaseModel):
    firmware_version: str | None = None


class OTAStatusRequest(BaseModel):
    status: str
    firmware_version: str | None = None


class DeviceCommandRequest(BaseModel):
    command: str


class CommandAckRequest(BaseModel):
    status: str


class DeviceChannelCreate(BaseModel):
    channel_number: int
    name: str
    type: str


class DeviceChannelResponse(BaseModel):
    id: str
    device_id: str
    channel_number: int
    name: str
    type: str
    state: str
    created_at: datetime