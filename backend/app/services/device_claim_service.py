import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.device_claim import DeviceClaim
from app.models.device_claim_token import DeviceClaimToken


CLAIM_TOKEN_EXPIRE_MINUTES = 15


def generate_claim_token() -> str:
    """
    Generate a secure one-time device claim token.

    The raw token is returned only to the caller.
    Only its SHA-256 hash should be stored in the database.
    """

    return secrets.token_urlsafe(32)


def hash_claim_token(token: str) -> str:
    """
    Hash a claim token before storing/comparing it.
    """

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_claim_token(
    db: Session,
    device: Device,
    created_by: str | None = None,
    expires_minutes: int = CLAIM_TOKEN_EXPIRE_MINUTES,
) -> tuple[DeviceClaimToken, str]:
    """
    Create a one-time claim token for a device.

    Returns:
        (claim_token_record, raw_token)

    The raw token must never be stored in the database.
    """

    raw_token = generate_claim_token()
    token_hash = hash_claim_token(raw_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
    )

    claim_token = DeviceClaimToken(
        device_id=device.id,
        token_hash=token_hash,
        expires_at=expires_at.replace(tzinfo=None),
        created_by=created_by,
    )

    db.add(claim_token)

    return claim_token, raw_token


def validate_claim_token(
    db: Session,
    token: str,
) -> DeviceClaimToken:
    """
    Validate a device claim token.

    Rules:
    - Token must exist.
    - Token must not be used.
    - Token must not be expired.

    Raises:
        ValueError: if the token is invalid.
    """

    token_hash = hash_claim_token(token)

    claim_token = (
        db.query(DeviceClaimToken)
        .filter(
            DeviceClaimToken.token_hash == token_hash,
        )
        .first()
    )

    if not claim_token:
        raise ValueError("Invalid claim token")

    if claim_token.used_at is not None:
        raise ValueError("Claim token has already been used")

    now = datetime.now(timezone.utc)

    expires_at = claim_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        raise ValueError("Claim token has expired")

    return claim_token


def claim_device(
    db: Session,
    token: str,
    home_id: str,
    user_id: str,
) -> DeviceClaim:
    """
    Claim a device and attach it to a home.

    The claim token becomes permanently unusable after
    successful claiming.
    """

    claim_token = validate_claim_token(
        db=db,
        token=token,
    )

    device = (
        db.query(Device)
        .filter(Device.id == claim_token.device_id)
        .first()
    )

    if not device:
        raise ValueError("Device not found")

    if device.claim_status == "CLAIMED":
        raise ValueError("Device is already claimed")

    if device.lifecycle_status != "ACTIVE":
        raise ValueError("Device is not available for claiming")

    device.home_id = home_id
    device.claim_status = "CLAIMED"

    claim = DeviceClaim(
        device_id=device.id,
        home_id=home_id,
        claimed_by=user_id,
        claim_method="TOKEN",
        status="SUCCESS",
        claimed_at=datetime.utcnow(),
    )

    claim_token.used_at = datetime.utcnow()

    db.add(claim)

    return claim


def unclaim_device(
    db: Session,
    device_id: str,
) -> Device:
    """
    Unclaim a device and detach it from its current home.

    The current successful claim is marked as revoked.
    The device becomes available for claiming again.
    """

    device = (
        db.query(Device)
        .filter(Device.id == device_id)
        .first()
    )

    if not device:
        raise ValueError("Device not found")

    if device.claim_status != "CLAIMED":
        raise ValueError("Device is not currently claimed")

    active_claim = (
        db.query(DeviceClaim)
        .filter(
            DeviceClaim.device_id == device.id,
            DeviceClaim.status == "SUCCESS",
            DeviceClaim.revoked_at.is_(None),
        )
        .order_by(DeviceClaim.claimed_at.desc())
        .first()
    )

    if active_claim:
        active_claim.status = "REVOKED"
        active_claim.revoked_at = datetime.utcnow()

    device.home_id = None
    device.claim_status = "UNCLAIMED"

    return device
