
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    String,
    Text,
)

from app.database.database import Base


class Firmware(Base):
    __tablename__ = "firmwares"

    # ============================================================
    # ID
    # ============================================================

    id = Column(
        String,
        primary_key=True,
        index=True,
        default=lambda: uuid.uuid4().hex,
    )

    # ============================================================
    # FIRMWARE INFORMATION
    # ============================================================

    version = Column(
        String(50),
        nullable=False,
        index=True,
    )

    device_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    filename = Column(
        String(255),
        nullable=False,
    )

    download_url = Column(
        String(500),
        nullable=False,
    )

    # ============================================================
    # INTEGRITY
    # ============================================================

    sha256 = Column(
        String(64),
        nullable=False,
    )

    file_size = Column(
        BigInteger,
        nullable=True,
    )

    # ============================================================
    # RELEASE INFORMATION
    # ============================================================

    release_notes = Column(
        Text,
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ============================================================
    # TIMESTAMP
    # ============================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

