import uuid

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.detector import decode_image, detect_person
from app.core.security import authenticate_device
from app.database.database import get_db
from app.models.device import Device
from app.models.detection import Detection
from app.services.image_service import save_image

router = APIRouter(
    prefix="/detect",
    tags=["AI Detection"]
)


@router.post("/")
async def detect(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    device: Device = Depends(authenticate_device),
):
    try:
        # Read image
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Image is empty."
            )

        # Save original image
        image_path = save_image(image_bytes)

        # Decode image
        image = decode_image(image_bytes)

        # AI Detection
        result = detect_person(image)

        # Save detection to database
        detection = Detection(
            id=uuid.uuid4().hex,
            device_id=device.id,
            person=result["person"],
            confidence=result["confidence"],
            alarm=result["alarm"],
            image_path=image_path,
        )

        db.add(detection)
        db.commit()
        db.refresh(detection)

        return {
            "success": True,
            "detection_id": detection.id,
            "device_id": device.device_id,
            "person": detection.person,
            "confidence": detection.confidence,
            "alarm": detection.alarm,
            "image_path": detection.image_path,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )