from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.device import Device
from app.models.home import Home
from app.models.home_member import HomeMember
from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse, RoomUpdate


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/homes",
    tags=["Rooms"],
)


# ============================================================
# HELPER — HOME ACCESS
# ============================================================

def verify_home_access(
    home_id: str,
    current_user: User,
    db: Session,
) -> Home:
    """
    হোমে ইউজারের এক্সেস আছে কিনা তা যাচাই করে।
    অনুমোদিত: Home owner অথবা Home member।
    """
    home = (
        db.query(Home)
        .filter(Home.id == home_id)
        .first()
    )

    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found",
        )

    # --------------------------------------------------------
    # HOME OWNER CHECK
    # --------------------------------------------------------
    if home.owner_id == current_user.id:
        return home

    # --------------------------------------------------------
    # HOME MEMBER CHECK
    # --------------------------------------------------------
    member = (
        db.query(HomeMember)
        .filter(
            HomeMember.home_id == home_id,
            HomeMember.user_id == current_user.id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return home


# ============================================================
# CREATE ROOM
# ============================================================

@router.post(
    "/{home_id}/rooms",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    home_id: str,
    payload: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    হোমের ভেতরে নতুন রুম তৈরি করে।
    """
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room name is required",
        )

    # --------------------------------------------------------
    # DUPLICATE ROOM CHECK
    # --------------------------------------------------------
    existing_room = (
        db.query(Room)
        .filter(
            Room.home_id == home.id,
            Room.name == name,
        )
        .first()
    )

    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A room with this name already exists",
        )

    # --------------------------------------------------------
    # CREATE ROOM
    # --------------------------------------------------------
    room = Room(
        home_id=home.id,
        name=name,
    )

    try:
        db.add(room)
        db.commit()
        db.refresh(room)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create room",
        )

    return room


# ============================================================
# GET HOME ROOMS
# ============================================================

@router.get(
    "/{home_id}/rooms",
    response_model=list[RoomResponse],
)
def get_home_rooms(
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    নির্দিষ্ট হোমের সকল রুমের তালিকা নিয়ে আসে।
    """
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    rooms = (
        db.query(Room)
        .filter(Room.home_id == home.id)
        .order_by(Room.name.asc())
        .all()
    )

    return rooms


# ============================================================
# GET SINGLE ROOM
# ============================================================

@router.get(
    "/{home_id}/rooms/{room_id}",
    response_model=RoomResponse,
)
def get_room(
    home_id: str,
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    একটি নির্দিষ্ট রুমের ডিটেইলস নিয়ে আসে।
    """
    verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    return room


# ============================================================
# UPDATE ROOM
# ============================================================

@router.patch(
    "/{home_id}/rooms/{room_id}",
    response_model=RoomResponse,
)
def update_room(
    home_id: str,
    room_id: str,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    বিদ্যমান রুমের নাম আপডেট করে।
    """
    verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room name is required",
        )

    # --------------------------------------------------------
    # DUPLICATE NAME CHECK
    # --------------------------------------------------------
    duplicate_room = (
        db.query(Room)
        .filter(
            Room.home_id == home_id,
            Room.name == name,
            Room.id != room_id,
        )
        .first()
    )

    if duplicate_room:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A room with this name already exists",
        )

    # --------------------------------------------------------
    # UPDATE ROOM
    # --------------------------------------------------------
    room.name = name

    try:
        db.commit()
        db.refresh(room)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update room",
        )

    return room


# ============================================================
# ASSIGN DEVICE TO ROOM
# ============================================================

@router.post(
    "/{home_id}/rooms/{room_id}/devices/{device_id}",
)
def assign_device_to_room(
    home_id: str,
    room_id: str,
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ডিভাইসকে নির্দিষ্ট রুমে অ্যাসাইন করে।
    """
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # FIND ROOM
    # --------------------------------------------------------
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home.id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # --------------------------------------------------------
    # FIND DEVICE
    # --------------------------------------------------------
    device = (
        db.query(Device)
        .filter(
            Device.device_id == device_id,
            Device.home_id == home.id,
        )
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found in this home",
        )

    previous_room_id = device.room_id

    # --------------------------------------------------------
    # ASSIGN DEVICE
    # --------------------------------------------------------
    device.room_id = room.id

    try:
        db.commit()
        db.refresh(device)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign device to room",
        )

    return {
        "success": True,
        "message": "Device assigned to room successfully",
        "home_id": home.id,
        "room_id": room.id,
        "device_id": device.device_id,
        "previous_room_id": previous_room_id,
    }


# ============================================================
# GET ROOM DEVICES
# ============================================================

@router.get(
    "/{home_id}/rooms/{room_id}/devices",
)
def get_room_devices(
    home_id: str,
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    নির্দিষ্ট রুমে অ্যাসাইন থাকা সকল ডিভাইসের তালিকা নিয়ে আসে।

    নিয়মাবলী:
    - ইউজারকে অবশ্যই হোমের এক্সেস থাকতে হবে।
    - রুমটি অবশ্যই উক্ত হোমের অন্তর্ভুক্ত হতে হবে।
    - শুধুমাত্র এই রুমে অ্যাসাইন করা ডিভাইসগুলো রিটার্ন করবে।
    """
    # --------------------------------------------------------
    # HOME ACCESS
    # --------------------------------------------------------
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # ROOM CHECK
    # --------------------------------------------------------
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home.id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # --------------------------------------------------------
    # GET DEVICES
    # --------------------------------------------------------
    devices = (
        db.query(Device)
        .filter(
            Device.home_id == home.id,
            Device.room_id == room.id,
        )
        .order_by(Device.device_name.asc())
        .all()
    )

    return {
        "success": True,
        "home_id": home.id,
        "room_id": room.id,
        "room_name": room.name,
        "device_count": len(devices),
        "devices": [
            {
                "id": device.id,
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_type": device.device_type,
                "status": device.status,
                "state": device.state,
                "firmware_version": device.firmware_version,
                "last_seen": device.last_seen,
                "home_id": device.home_id,
                "room_id": device.room_id,
            }
            for device in devices
        ],
    }


# ============================================================
# REMOVE DEVICE FROM ROOM
# ============================================================

@router.delete(
    "/{home_id}/rooms/{room_id}/devices/{device_id}",
)
def remove_device_from_room(
    home_id: str,
    room_id: str,
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    রুম থেকে ডিভাইস আন-অ্যাসাইন (Unassign) করে।
    এটি ডিভাইস রিমুভ করে কিন্তু ডিলিট করে না (room_id = None করে দেয়)।
    """
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # ROOM CHECK
    # --------------------------------------------------------
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home.id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # --------------------------------------------------------
    # DEVICE CHECK
    # --------------------------------------------------------
    device = (
        db.query(Device)
        .filter(
            Device.device_id == device_id,
            Device.home_id == home.id,
        )
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found in this home",
        )

    # --------------------------------------------------------
    # ROOM ASSIGNMENT CHECK
    # --------------------------------------------------------
    if device.room_id != room.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device is not assigned to this room",
        )

    # --------------------------------------------------------
    # REMOVE ROOM ASSIGNMENT
    # --------------------------------------------------------
    device.room_id = None

    try:
        db.commit()
        db.refresh(device)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove device from room",
        )

    return {
        "success": True,
        "message": "Device removed from room successfully",
        "home_id": home.id,
        "room_id": room.id,
        "device_id": device.device_id,
    }


# ============================================================
# DELETE ROOM
# ============================================================

@router.delete(
    "/{home_id}/rooms/{room_id}",
)
def delete_room(
    home_id: str,
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    রুম ডিলিট করে। 
    শর্ত: রুমে কোনো ডিভাইস থাকা যাবে না।
    """
    home = verify_home_access(
        home_id=home_id,
        current_user=current_user,
        db=db,
    )

    # --------------------------------------------------------
    # FIND ROOM
    # --------------------------------------------------------
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.home_id == home.id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    # --------------------------------------------------------
    # DEVICE SAFETY CHECK
    # --------------------------------------------------------
    device_count = (
        db.query(Device)
        .filter(
            Device.room_id == room.id,
        )
        .count()
    )

    if device_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Room contains {device_count} device(s). "
                "Move or unassign the devices before deleting the room."
            ),
        )

    # --------------------------------------------------------
    # DELETE ROOM
    # --------------------------------------------------------
    try:
        db.delete(room)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete room",
        )

    return {
        "success": True,
        "message": "Room deleted successfully",
        "home_id": home.id,
        "room_id": room_id,
    }