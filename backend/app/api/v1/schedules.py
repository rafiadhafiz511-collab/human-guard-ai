from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.device import Device
from app.models.schedule import Schedule
from app.models.user import User
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleResponse,
    ScheduleUpdate,
)


router = APIRouter(
    prefix="/schedules",
    tags=["Schedules"],
)


# ============================================================
# HELPERS
# ============================================================


def get_schedule_or_404(
    schedule_id: str,
    db: Session,
) -> Schedule:

    schedule = (
        db.query(Schedule)
        .filter(
            Schedule.id == schedule_id
        )
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    return schedule


def get_device_or_404(
    device_id: str,
    db: Session,
) -> Device:
    """
    Find device using PUBLIC device_id.

    Example:

        CAM001

    Database:

        Device.device_id = CAM001
        Device.id        = 6bb1762e...
    """

    device = (
        db.query(Device)
        .filter(
            Device.device_id == device_id
        )
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found",
        )

    return device


# ============================================================
# RESPONSE BUILDER
# ============================================================


def schedule_to_response(
    schedule: Schedule,
) -> ScheduleResponse:
    """
    Convert SQLAlchemy Schedule object into API response.

    Database:
        schedule.device_id
            ↓
        Device.id

    API:
        device.device_id
            ↓
        CAM001
    """

    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        action=schedule.action,
        time=schedule.time,
        repeat=schedule.repeat,
        active=schedule.active,

        # IMPORTANT
        # Return PUBLIC device ID.
        device_id=schedule.device.device_id,

        last_run_at=schedule.last_run_at,
        next_run_at=schedule.next_run_at,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at,
    )


# ============================================================
# GET ALL SCHEDULES
# ============================================================


@router.get(
    "/",
    response_model=List[ScheduleResponse],
    status_code=status.HTTP_200_OK,
)
def get_schedules(
    device_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all schedules.

    Optional query:

        ?device_id=CAM001
    """

    query = db.query(Schedule)

    # --------------------------------------------------------
    # FILTER BY PUBLIC DEVICE ID
    # --------------------------------------------------------

    if device_id:

        device = get_device_or_404(
            device_id,
            db,
        )

        query = query.filter(
            Schedule.device_id == device.id
        )

    schedules = (
        query
        .order_by(
            Schedule.time.asc()
        )
        .all()
    )

    return [
        schedule_to_response(schedule)
        for schedule in schedules
    ]


# ============================================================
# GET SINGLE SCHEDULE
# ============================================================


@router.get(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    status_code=status.HTTP_200_OK,
)
def get_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = get_schedule_or_404(
        schedule_id,
        db,
    )

    return schedule_to_response(
        schedule
    )


# ============================================================
# CREATE SCHEDULE
# ============================================================


@router.post(
    "/",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new schedule.

    Frontend sends:

        {
            "name": "Morning Pump",
            "action": "ON",
            "time": "06:00:00",
            "repeat": "DAILY",
            "active": true,
            "device_id": "CAM001"
        }

    Backend converts:

        CAM001
          ↓
        Device.id
          ↓
        Schedule.device_id
    """

    # --------------------------------------------------------
    # FIND DEVICE USING PUBLIC ID
    # --------------------------------------------------------

    device = get_device_or_404(
        data.device_id,
        db,
    )

    # --------------------------------------------------------
    # CREATE SCHEDULE
    # --------------------------------------------------------

    schedule = Schedule(
        name=data.name,

        # IMPORTANT
        # Save internal DB ID.
        device_id=device.id,

        action=data.action,
        time=data.time,
        repeat=data.repeat,
        active=data.active,
    )

    try:

        db.add(schedule)

        db.commit()

        db.refresh(schedule)

    except Exception as exc:

        db.rollback()

        print(
            f"[Schedules] Create error: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create schedule",
        )

    # --------------------------------------------------------
    # RETURN PUBLIC DEVICE ID
    # --------------------------------------------------------

    return schedule_to_response(
        schedule
    )


# ============================================================
# UPDATE SCHEDULE
# ============================================================


@router.patch(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    status_code=status.HTTP_200_OK,
)
def update_schedule(
    schedule_id: str,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing schedule.
    """

    schedule = get_schedule_or_404(
        schedule_id,
        db,
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # NOTHING TO UPDATE
    # --------------------------------------------------------

    if not update_data:
        return schedule_to_response(
            schedule
        )

    # --------------------------------------------------------
    # DEVICE UPDATE
    # --------------------------------------------------------

    if "device_id" in update_data:

        public_device_id = update_data[
            "device_id"
        ]

        device = get_device_or_404(
            public_device_id,
            db,
        )

        # Save INTERNAL Device.id
        schedule.device_id = device.id

        del update_data[
            "device_id"
        ]

    # --------------------------------------------------------
    # OTHER FIELDS
    # --------------------------------------------------------

    for field, value in update_data.items():

        setattr(
            schedule,
            field,
            value,
        )

    try:

        db.commit()

        db.refresh(schedule)

    except Exception as exc:

        db.rollback()

        print(
            f"[Schedules] Update error: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update schedule",
        )

    return schedule_to_response(
        schedule
    )


# ============================================================
# TOGGLE SCHEDULE
# ============================================================


@router.patch(
    "/{schedule_id}/toggle",
    response_model=ScheduleResponse,
)
def toggle_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle schedule active status.
    """

    schedule = get_schedule_or_404(
        schedule_id,
        db,
    )

    schedule.active = not schedule.active

    try:

        db.commit()

        db.refresh(schedule)

    except Exception as exc:

        db.rollback()

        print(
            f"[Schedules] Toggle error: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle schedule",
        )

    return schedule_to_response(
        schedule
    )


# ============================================================
# DELETE SCHEDULE
# ============================================================


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_200_OK,
)
def delete_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a schedule.
    """

    schedule = get_schedule_or_404(
        schedule_id,
        db,
    )

    try:

        db.delete(schedule)

        db.commit()

    except Exception as exc:

        db.rollback()

        print(
            f"[Schedules] Delete error: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete schedule",
        )

    return {
        "success": True,
        "message": "Schedule deleted successfully",
        "schedule_id": schedule_id,
    }