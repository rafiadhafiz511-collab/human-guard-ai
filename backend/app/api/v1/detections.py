from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.detection import Detection

router = APIRouter(
    prefix="/detections",
    tags=["Detections"]
)


@router.get("/")
def get_detections(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    device_id: str = Query(None),
    person_only: bool = Query(False),
):
    """
    Get detections with pagination and filtering.
    
    - skip: Number of records to skip
    - limit: Number of records to return (max 100)
    - device_id: Filter by device ID
    - person_only: Filter to show only human detections
    """
    query = db.query(Detection)
    
    # Apply filters
    if device_id:
        query = query.filter(Detection.device_id == device_id)
    
    if person_only:
        query = query.filter(Detection.person == True)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and sorting
    detections = (
        query
        .order_by(Detection.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": detections
    }