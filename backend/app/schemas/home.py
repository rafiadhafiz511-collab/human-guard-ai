from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class HomeMemberRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class HomeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class HomeUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class HomeResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)