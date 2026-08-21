import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceClaim(Base):
    __tablename__ = "device_claims"

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
        back_populates="claims",
    )

    # ============================================================
    # HOME
    # ============================================================

    home_id = Column(
        String,
        ForeignKey(
            "homes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    home = relationship(
        "Home",
    )

    # ============================================================
    # USER
    # ============================================================

    claimed_by = Column(
        String,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    user = relationship(
        "User",
    )

    # ============================================================
    # CLAIM INFORMATION
    # ============================================================

    claim_method = Column(
        String(30),
        nullable=False,
        default="TOKEN",
    )

    status = Column(
        String(20),
        nullable=False,
        default="SUCCESS",
        index=True,
    )

    claimed_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    revoked_at = Column(
        DateTime,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )