from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.home import Home
from app.models.home_member import HomeMember
from app.models.user import User

router = APIRouter(
    prefix="/homes",
    tags=["Homes"],
)


# ============================================================
# SCHEMAS
# ============================================================

class AddMemberSchema(BaseModel):
    email: EmailStr
    role: str = "MEMBER"


class UpdateMemberRoleSchema(BaseModel):
    role: str

class CreateHomeSchema(BaseModel):
    name: str


# ============================================================
# CREATE HOME
# ============================================================

@router.post("/")
def create_home(
    payload: CreateHomeSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new home and automatically add the owner as ADMIN
    in home_members.
    """

    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Home name is required",
        )

    home = Home(
        name=name,
        owner_id=current_user.id,
    )

    try:
        db.add(home)
        db.flush()

        owner_membership = HomeMember(
            home_id=home.id,
            user_id=current_user.id,
            role="ADMIN",
        )

        db.add(owner_membership)

        db.commit()
        db.refresh(home)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create home",
        )

    return {
        "success": True,
        "id": home.id,
        "name": home.name,
        "owner_id": home.owner_id,
        "created_at": home.created_at,
    }


# ============================================================
# GET MY HOMES (Owned + Member Homes)
# ============================================================

@router.get("/")
def get_my_homes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all homes where current user is Owner OR a Member.
    """
    owned_homes = db.query(Home).filter(Home.owner_id == current_user.id).all()

    member_home_ids = (
        db.query(HomeMember.home_id)
        .filter(HomeMember.user_id == current_user.id)
    )
    membership_homes = (
        db.query(Home)
        .filter(Home.id.in_(member_home_ids))
        .all()
    )

    all_homes_dict = {home.id: home for home in (owned_homes + membership_homes)}
    all_homes = list(all_homes_dict.values())

    return all_homes


# ============================================================
# GET SINGLE HOME
# ============================================================

@router.get("/{home_id}")
def get_home(
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get single home details if user is Owner or Member.
    """
    home = db.query(Home).filter(Home.id == home_id).first()

    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found",
        )

    if home.owner_id != current_user.id:
        is_member = (
            db.query(HomeMember)
            .filter(
                HomeMember.home_id == home_id,
                HomeMember.user_id == current_user.id,
            )
            .first()
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return home


# ============================================================
# UPDATE HOME
# ============================================================

@router.patch("/{home_id}")
def update_home(
    home_id: str,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update home name (Owner only).
    """
    home = (
        db.query(Home)
        .filter(
            Home.id == home_id,
            Home.owner_id == current_user.id,
        )
        .first()
    )

    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found or access denied",
        )

    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Home name is required",
        )

    home.name = name

    try:
        db.commit()
        db.refresh(home)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update home",
        )

    return {
        "success": True,
        "id": home.id,
        "name": home.name,
        "owner_id": home.owner_id,
        "created_at": home.created_at,
    }


# ============================================================
# DELETE HOME
# ============================================================

@router.delete("/{home_id}")
def delete_home(
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a home (Owner only).
    """
    home = (
        db.query(Home)
        .filter(
            Home.id == home_id,
            Home.owner_id == current_user.id,
        )
        .first()
    )

    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found or access denied",
        )

    try:
        db.delete(home)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete home",
        )

    return {
        "success": True,
        "message": "Home deleted successfully",
        "home_id": home_id,
    }


# ============================================================
# ASSIGN / REMOVE / GET DEVICES
# ============================================================

@router.post("/{home_id}/devices/{device_id}")
def assign_device_to_home(
    home_id: str,
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id, Home.owner_id == current_user.id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    from app.models.device import Device
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    if device.home_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Device is already assigned to a home")

    device.home_id = home.id

    try:
        db.commit()
        db.refresh(device)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign device")

    return {
        "success": True,
        "message": "Device assigned to home successfully",
        "home_id": home.id,
        "device_id": device.device_id,
    }


@router.delete("/{home_id}/devices/{device_id}")
def remove_device_from_home(
    home_id: str,
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id, Home.owner_id == current_user.id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    from app.models.device import Device
    device = db.query(Device).filter(Device.device_id == device_id, Device.home_id == home.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device is not assigned to this home")

    device.home_id = None

    try:
        db.commit()
        db.refresh(device)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove device")

    return {
        "success": True,
        "message": "Device removed from home successfully",
        "home_id": home.id,
        "device_id": device.device_id,
    }


@router.get("/{home_id}/devices")
def get_home_devices(
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    if home.owner_id != current_user.id:
        is_member = db.query(HomeMember).filter(HomeMember.home_id == home_id, HomeMember.user_id == current_user.id).first()
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    from app.models.device import Device
    devices = db.query(Device).filter(Device.home_id == home.id).order_by(Device.device_name.asc()).all()

    return {
        "success": True,
        "home_id": home.id,
        "home_name": home.name,
        "device_count": len(devices),
        "devices": devices,
    }


# ============================================================
# HOME MEMBERS MANAGEMENT
# ============================================================

@router.post("/{home_id}/members")
def add_member_to_home(
    home_id: str,
    payload: AddMemberSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    if home.owner_id != current_user.id:
        requester_member = (
            db.query(HomeMember)
            .filter(
                HomeMember.home_id == home_id,
                HomeMember.user_id == current_user.id,
                HomeMember.role == "ADMIN",
            )
            .first()
        )
        if not requester_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Home Owner or ADMIN can add members",
            )

    target_user = db.query(User).filter(User.email == payload.email).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found")

    if target_user.id == home.owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Home owner is already an admin")

    existing_member = (
        db.query(HomeMember)
        .filter(HomeMember.home_id == home_id, HomeMember.user_id == target_user.id)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member of this home")

    new_member = HomeMember(
        home_id=home_id,
        user_id=target_user.id,
        role=payload.role.upper(),
    )

    try:
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add member")

    return {
        "success": True,
        "message": "Member added successfully",
        "member": {
            "id": new_member.id,
            "home_id": new_member.home_id,
            "user_id": new_member.user_id,
            "name": target_user.name,
            "email": target_user.email,
            "role": new_member.role,
            "created_at": new_member.created_at,
        },
    }


@router.get("/{home_id}/members")
def get_home_members(
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    # Permission Check
    if home.owner_id != current_user.id:
        is_member = (
            db.query(HomeMember)
            .filter(HomeMember.home_id == home_id, HomeMember.user_id == current_user.id)
            .first()
        )
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Fetch DB Members
    members = (
        db.query(HomeMember, User)
        .join(User, HomeMember.user_id == User.id)
        .filter(HomeMember.home_id == home_id)
        .all()
    )

    members_list = []
    has_owner_in_members = False

    for member, user in members:
        if user.id == home.owner_id:
            has_owner_in_members = True

        members_list.append(
            {
                "id": member.id,
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "role": "OWNER" if user.id == home.owner_id else member.role,
                "created_at": member.created_at,
            }
        )

    # Fallback: DB তে Owner না থাকলে ম্যানুয়ালি সংযুক্ত করা
    if not has_owner_in_members:
        owner_user = db.query(User).filter(User.id == home.owner_id).first()
        if owner_user:
            members_list.insert(
                0,
                {
                    "id": f"owner-{owner_user.id}",
                    "user_id": owner_user.id,
                    "name": owner_user.name,
                    "email": owner_user.email,
                    "role": "OWNER",
                    "created_at": home.created_at,
                },
            )

    return {
        "success": True,
        "home_id": home_id,
        "member_count": len(members_list),
        "members": members_list,
    }


@router.patch("/{home_id}/members/{user_id}")
def update_member_role(
    home_id: str,
    user_id: str,
    payload: UpdateMemberRoleSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    if home.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Home Owner can modify roles")

    member = (
        db.query(HomeMember)
        .filter(HomeMember.home_id == home_id, HomeMember.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member.role = payload.role.upper()

    try:
        db.commit()
        db.refresh(member)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update role")

    return {
        "success": True,
        "message": "Member role updated successfully",
        "user_id": user_id,
        "new_role": member.role,
    }


@router.delete("/{home_id}/members/{user_id}")
def remove_member_from_home(
    home_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home not found")

    if home.owner_id != current_user.id and current_user.id != user_id:
        requester_member = (
            db.query(HomeMember)
            .filter(
                HomeMember.home_id == home_id,
                HomeMember.user_id == current_user.id,
                HomeMember.role == "ADMIN",
            )
            .first()
        )
        if not requester_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    member = (
        db.query(HomeMember)
        .filter(HomeMember.home_id == home_id, HomeMember.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    try:
        db.delete(member)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove member")

    return {
        "success": True,
        "message": "Member removed successfully",
        "home_id": home_id,
        "user_id": user_id,
    }