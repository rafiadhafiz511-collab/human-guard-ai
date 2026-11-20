import datetime as dt
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BASE
# ============================================================


class ScheduleBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    action: str = Field(
        ...,
        pattern="^(ON|OFF)$",
        description="Schedule action: ON or OFF",
    )

    time: dt.time

    repeat: str = Field(
        default="DAILY",
        pattern="^(ONCE|DAILY|WEEKDAYS|WEEKENDS)$",
    )

    active: bool = True


# ============================================================
# CREATE
# ============================================================


class ScheduleCreate(ScheduleBase):
    device_id: str = Field(
        ...,
        description="Public device ID, e.g. CAM001",
    )


# ============================================================
# UPDATE
# ============================================================


class ScheduleUpdate(BaseModel):
    device_id: Optional[str] = Field(
        default=None,
        description="Public device ID, e.g. CAM001",
    )

    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    action: Optional[str] = Field(
        default=None,
        pattern="^(ON|OFF)$",
    )

    time: Optional[dt.time] = None

    repeat: Optional[str] = Field(
        default=None,
        pattern="^(ONCE|DAILY|WEEKDAYS|WEEKENDS)$",
    )

    active: Optional[bool] = None


# ============================================================
# RESPONSE
# ============================================================


class ScheduleResponse(ScheduleBase):
    id: str

    # IMPORTANT:
    # API response contains PUBLIC device ID.
    #
    # Example:
    # CAM001
    #
    # NOT:
    # 6bb1762eae5b4aa3a0ac68cc231b0f94

    device_id: str

    last_run_at: Optional[dt.datetime] = None

    next_run_at: Optional[dt.datetime] = None

    created_at: dt.datetime

    updated_at: dt.datetime

    model_config = ConfigDict(
        from_attributes=True,
    )