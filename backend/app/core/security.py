from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.device import Device

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")


def authenticate_device(
    api_key: str = Depends(API_KEY_HEADER), db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.secret_key == api_key).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return device