import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class DeviceCredential(Base):
    __tablename__ = "device_credentials"

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
        back_populates="credentials",
    )

    # ============================================================
    # CREDENTIAL
    # ============================================================

    credential_type = Column(
        String(30),
        nullable=False,
        default="MQTT",
    )

    credential_hash = Column(
        String(255),
        nullable=False,
    )

    version = Column(
        String(50),
        nullable=False,
        default="1",
    )

    # ============================================================
    # LIFECYCLE
    # ============================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    rotated_at = Column(
        DateTime,
        nullable=True,
    )

    revoked_at = Column(
        DateTime,
        nullable=True,
    )

    last_used_at = Column(
        DateTime,
        nullable=True,
    )