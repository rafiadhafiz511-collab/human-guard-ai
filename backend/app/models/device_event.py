import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceEvent(Base):
    __tablename__ = "device_events"

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
        back_populates="events",
    )

    # ============================================================
    # EVENT
    # ============================================================

    event_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    actor_id = Column(
        String,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    actor = relationship(
        "User",
    )

    description = Column(
        Text,
        nullable=True,
    )

    event_data = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )