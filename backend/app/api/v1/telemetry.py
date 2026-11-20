from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from app.database.database import get_db
from app.services.automation_engine import process_device_telemetry_or_state
from app.models.device import Device
from app.core.security import authenticate_device

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Hardware"])

class TelemetryIngestRequest(BaseModel):
    device_id: str
    telemetry: Dict[str, Any]

@router.post("/ingest")
def ingest_device_telemetry(
    payload: TelemetryIngestRequest,
    device: Device = Depends(authenticate_device),
    db: Session = Depends(get_db),
):
    # Device.device_id (Hardware ID) দিয়ে কুয়েরি করা হচ্ছে
    if device.device_id != payload.device_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Device authentication mismatch")

    if not device.home_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Device must be assigned to a home before automation can run")

    process_device_telemetry_or_state(
        db=db,
        home_id=str(device.home_id),
        device_id=device.device_id,
        incoming_data=payload.telemetry
    )

    return {
        "status": "success",
        "message": "Telemetry processed and automations evaluated"
    }
