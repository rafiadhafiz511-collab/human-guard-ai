from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.permissions import verify_home_access
from app.database.database import get_db
from app.models.user import User
from app.services.device_claim_service import (
    create_claim_token,
    claim_device,
    validate_claim_token,
)
from app.models.device import Device


router = APIRouter(
    prefix="/device-claims",
    tags=["Device Claims"],
)


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
    Generate a one-time claim token for a device.

    The token is returned only once and its hash is stored
    in the database.
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
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check whether a device claim token is valid.
    """

    try:
        claim_token = validate_claim_token(
            db=db,
            token=token,
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
        "expires_at": claim_token.expires_at,
    }


# ============================================================
# CLAIM DEVICE
# ============================================================

@router.post("/claim")
def claim_device_endpoint(
    token: str,
    home_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Claim a device and attach it to a home.
    """

    # --------------------------------------------------------
    # VERIFY HOME ACCESS
    # --------------------------------------------------------

    verify_home_access(
        db=db,
        user_id=current_user.id,
        home_id=home_id,
        required_roles=["OWNER", "ADMIN"],
    )

    # --------------------------------------------------------
    # CLAIM DEVICE
    # --------------------------------------------------------

    try:
        claim = claim_device(
            db=db,
            token=token,
            home_id=home_id,
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