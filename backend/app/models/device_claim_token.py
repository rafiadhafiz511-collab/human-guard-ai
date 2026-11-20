import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceClaimToken(Base):
    __tablename__ = "device_claim_tokens"

    # ============================================================
    # IDENTITY
    # ============================================================

    id = Column(
        String,
        primary_key=True,
        default=lambda: uuid.uuid4().hex,
    )

    # ============================================================
    # DEVICE
    # ============================================================

    device_id = Column(
        String,
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    device = relationship(
        "Device",
        back_populates="claim_tokens",
    )

    # ============================================================
    # TOKEN
    # ============================================================

    token_hash = Column(
        String(128),
        nullable=False,
        unique=True,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    used_at = Column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # AUDIT
    # ============================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    created_by = Column(
        String,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    creator = relationship(
        "User",
    )