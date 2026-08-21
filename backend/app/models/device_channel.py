import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceChannel(Base):
    __tablename__ = "device_channels"

    id = Column(
        String,
        primary_key=True,
        default=lambda: uuid.uuid4().hex,
    )

    device_id = Column(
        String,
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    channel_number = Column(
        Integer,
        nullable=False,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    type = Column(
        String(50),
        nullable=False,
    )

    state = Column(
        String(20),
        nullable=False,
        default="OFF",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    device = relationship(
        "Device",
        back_populates="channels",
    )

    __table_args__ = (
        UniqueConstraint(
            "device_id",
            "channel_number",
            name="uq_device_channel_number",
        ),
    )