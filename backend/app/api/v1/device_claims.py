from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.permissions import verify_home_access
from app.database.database import get_db
from app.models.device import Device
from app.models.user import User
from app.services.device_claim_service import (
    claim_device,
    create_claim_token,
    unclaim_device,
    validate_claim_token,
)


router = APIRouter(
    prefix="/device-claims",
    tags=["Device Claims"],
)


# ============================================================
# SCHEMAS
# ============================================================


class ValidateTokenSchema(BaseModel):
    token: str


class ClaimDeviceSchema(BaseModel):
    token: str
    home_id: str


# ============================================================
# CREATE CLAIM TOKEN
# ============================================================


@router.post("/devices/{device_id}/token")
def create_device_claim_token(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a secure one-time claim token for a device.

    The raw token is returned only once.
    Only its SHA-256 hash is stored in the database.
    """

    device = (
        db.query(Device)
        .filter(Device.device_id == device_id)
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    if device.claim_status == "CLAIMED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device is already claimed",
        )

    if device.lifecycle_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device is not available for claiming",
        )

    try:
        claim_token, raw_token = create_claim_token(
            db=db,
            device=device,
            created_by=current_user.id,
        )

        db.commit()
        db.refresh(claim_token)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create claim token",
        )

    return {
        "success": True,
        "device_id": device.device_id,
        "token": raw_token,
        "expires_at": claim_token.expires_at,
    }


# ============================================================
# VALIDATE CLAIM TOKEN
# ============================================================


@router.post("/validate")
def validate_device_claim_token(
    payload: ValidateTokenSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate a device claim token.

    This does not consume the token.
    The token becomes unusable only after successful claiming.
    """

    try:
        claim_token = validate_claim_token(
            db=db,
            token=payload.token,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    device = (
        db.query(Device)
        .filter(Device.id == claim_token.device_id)
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    return {
        "valid": True,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "device_type": device.device_type,
        "claim_status": device.claim_status,
        "lifecycle_status": device.lifecycle_status,
        "expires_at": claim_token.expires_at,
    }


# ============================================================
# CLAIM DEVICE
# ============================================================


@router.post("/claim")
def claim_device_endpoint(
    payload: ClaimDeviceSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Claim a device using a valid one-time token
    and attach it to a home.

    Only OWNER and ADMIN users of the target home
    are allowed to claim a device.
    """

    # --------------------------------------------------------
    # VERIFY HOME ACCESS
    # --------------------------------------------------------

    verify_home_access(
        db=db,
        user_id=current_user.id,
        home_id=payload.home_id,
        required_roles=["OWNER", "ADMIN"],
    )

    # --------------------------------------------------------
    # CLAIM DEVICE
    # --------------------------------------------------------

    try:
        claim = claim_device(
            db=db,
            token=payload.token,
            home_id=payload.home_id,
            user_id=current_user.id,
        )

        db.commit()
        db.refresh(claim)

    except ValueError as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to claim device",
        )

    return {
        "success": True,
        "claim_id": claim.id,
        "device_id": claim.device_id,
        "home_id": claim.home_id,
        "claimed_by": claim.claimed_by,
        "claim_method": claim.claim_method,
        "status": claim.status,
        "claimed_at": claim.claimed_at,
    }


# ============================================================
# UNCLAIM DEVICE
# ============================================================


@router.post("/devices/{device_id}/unclaim")
def unclaim_device_endpoint(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Unclaim a device and detach it from its current home.

    Administrators can unclaim any device.
    OWNER and ADMIN members can unclaim devices
    belonging to their home.
    """

    # --------------------------------------------------------
    # GET DEVICE
    # --------------------------------------------------------

    device = (
        db.query(Device)
        .filter(Device.device_id == device_id)
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # --------------------------------------------------------
    # CHECK CURRENT CLAIM
    # --------------------------------------------------------

    if device.claim_status != "CLAIMED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device is not currently claimed",
        )

    # --------------------------------------------------------
    # VERIFY HOME ACCESS
    # --------------------------------------------------------

    if current_user.role != "admin":
        if not device.home_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Device is not assigned to a home",
            )

        verify_home_access(
            db=db,
            user_id=current_user.id,
            home_id=device.home_id,
            required_roles=["OWNER", "ADMIN"],
        )

    # --------------------------------------------------------
    # UNCLAIM DEVICE
    # --------------------------------------------------------

    try:
        device = unclaim_device(
            db=db,
            device_id=device.id,
        )

        db.commit()
        db.refresh(device)

    except ValueError as e:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unclaim device",
        )

    return {
        "success": True,
        "message": "Device unclaimed successfully",
        "device_id": device.device_id,
        "claim_status": device.claim_status,
        "home_id": device.home_id,
    }
