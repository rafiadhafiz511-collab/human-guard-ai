from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE ROOM
# ============================================================

class RoomCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )


# ============================================================
# UPDATE ROOM
# ============================================================

class RoomUpdate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )


# ============================================================
# ROOM RESPONSE
# ============================================================

class RoomResponse(BaseModel):
    id: str
    home_id: str
    name: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )