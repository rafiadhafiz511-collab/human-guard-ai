import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer


class DeviceCommand(Base):
    __tablename__ = "device_commands"

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: uuid.uuid4().hex,
    )

    device_id = Column(
        String,
        ForeignKey("devices.id"),
        nullable=False,
        index=True,
    )

    command = Column(
        String(100),
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    sent_at = Column(
        DateTime,
        nullable=True,
    )

    last_attempt_at = Column(
    DateTime,
    nullable=True,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    attempt_count = Column(
    Integer,
    nullable=False,
    default=0,
    )

    device = relationship(
        "Device",
        back_populates="commands",
    )