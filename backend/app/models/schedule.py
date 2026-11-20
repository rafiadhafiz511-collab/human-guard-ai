import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    # ============================================================
    # IDENTITY
    # ============================================================

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: uuid.uuid4().hex,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    # ============================================================
    # DEVICE
    # ============================================================

    # IMPORTANT:
    # This stores Device.id (internal database ID),
    # NOT Device.device_id (public ID such as CAM001).
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
        back_populates="schedules",
    )

    # ============================================================
    # ACTION
    # ============================================================

    action = Column(
        String(20),
        nullable=False,
    )

    # ============================================================
    # TIME
    # ============================================================

    time = Column(
        Time,
        nullable=False,
    )

    # ============================================================
    # REPEAT
    # ============================================================

    repeat = Column(
        String(20),
        nullable=False,
        default="DAILY",
    )

    # ============================================================
    # STATUS
    # ============================================================

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ============================================================
    # EXECUTION TRACKING
    # ============================================================

    last_run_at = Column(
        DateTime,
        nullable=True,
    )

    next_run_at = Column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # TIMESTAMPS
    # ============================================================

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )