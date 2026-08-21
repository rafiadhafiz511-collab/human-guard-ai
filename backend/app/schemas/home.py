from datetime import datetime

from pydantic import BaseModel


class HomeCreate(BaseModel):
    name: str


class HomeUpdate(BaseModel):
    name: str


class HomeResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime