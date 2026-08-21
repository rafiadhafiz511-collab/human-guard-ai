import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class Device(Base):
    __tablename__ = "devices"

    # ============================================================
    # IDENTITY
    # ============================================================

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
    )

    device_type = Column(
        String(50),
        nullable=False,
        default="SMART_DEVICE",
    )

    serial_number = Column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    model = Column(
        String(100),
        nullable=True,
        index=True,
    )

    capabilities = Column(
        JSON,
        nullable=False,
        default=list,
    )

    # ============================================================
    # OWNERSHIP / LIFECYCLE / CONNECTION
    # ============================================================

    claim_status = Column(
        String(20),
        nullable=False,
        default="CLAIMED",
        index=True,
    )

    lifecycle_status = Column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True,
    )

    connection_status = Column(
        String(20),
        nullable=False,
        default="OFFLINE",
        index=True,
    )

    # ============================================================
    # DEVICE STATUS
    # ============================================================

    status = Column(
        String(20),
        nullable=False,
        default="offline",
    )

    state = Column(
        String(20),
        nullable=True,
        default="OFF",
    )

    last_seen = Column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # FIRMWARE / OTA
    # ============================================================

    firmware_version = Column(
    String(50),
    nullable=False,
    default="1.0.0",
    server_default="1.0.0",
)

    ota_target_version = Column(
        String(50),
        nullable=True,
    )

    ota_status = Column(
        String(30),
        nullable=False,
        default="idle",
    )

    ota_firmware_url = Column(
        String(500),
        nullable=True,
    )

    ota_checksum = Column(
        String(128),
        nullable=True,
    )

    ota_requested_at = Column(
        DateTime,
        nullable=True,
    )

    ota_completed_at = Column(
        DateTime,
        nullable=True,
    )

    # ============================================================
    # HOME
    # ============================================================

    home_id = Column(
        String,
        ForeignKey(
            "homes.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    home = relationship(
        "Home",
        back_populates="devices",
    )

    # ============================================================
    # ROOM
    # ============================================================

    room_id = Column(
        String,
        ForeignKey(
            "rooms.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    room = relationship(
        "Room",
        back_populates="devices",
    )

    # ============================================================
    # EXISTING RELATIONSHIPS
    # ============================================================

    detections = relationship(
        "Detection",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    channels = relationship(
        "DeviceChannel",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    commands = relationship(
        "DeviceCommand",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    schedules = relationship(
        "Schedule",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # DEVICE MANAGEMENT RELATIONSHIPS
    # ============================================================

    claims = relationship(
        "DeviceClaim",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    claim_tokens = relationship(
        "DeviceClaimToken",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    events = relationship(
        "DeviceEvent",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    telemetry = relationship(
        "DeviceTelemetry",
        back_populates="device",
        cascade="all, delete-orphan",
    )

    credentials = relationship(
        "DeviceCredential",
        back_populates="device",
        cascade="all, delete-orphan",
    )