from typing import Optional

from pydantic import BaseModel


class DeviceRegister(BaseModel):
    device_id: str
    device_name: str


class DeviceResponse(BaseModel):
    id: str
    device_id: str
    device_name: str
    status: str


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    status: Optional[str] = None


class HeartbeatRequest(BaseModel):
    firmware_version: str | None = None


class DeviceCommandRequest(BaseModel):
    command: str


class CommandAckRequest(BaseModel):
    status: str