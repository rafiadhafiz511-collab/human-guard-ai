import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship

from app.database.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: uuid.uuid4().hex,
    )

    device_id = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    device_name = Column(
        String(100),
        nullable=False,
    )

    secret_key = Column(
        String(255),
        nullable=False,
        index=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="offline",
    )

    last_seen = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    firmware_version = Column(
        String(20),
        default="1.0.0",
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    commands = relationship(
        "DeviceCommand",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    detections = relationship(
        "Detection",
        back_populates="device",
    )