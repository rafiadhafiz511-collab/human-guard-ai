import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceTelemetry(Base):
    __tablename__ = "device_telemetry"

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
        back_populates="telemetry",
    )

    # ============================================================
    # TELEMETRY DATA
    # ============================================================

    payload = Column(
        JSON,
        nullable=False,
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    received_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )