import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.models.home_member import HomeMember


class Home(Base):
    __tablename__ = "homes"

    id = Column(
        String,
        primary_key=True,
        default=lambda: uuid.uuid4().hex,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    owner_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    owner = relationship(
        "User",
        back_populates="homes",
    )

    devices = relationship(
        "Device",
        back_populates="home",
    )

    rooms = relationship(
        "Room",
        back_populates="home",
        cascade="all, delete-orphan",
    )

    members = relationship(
        "HomeMember",
        back_populates="home",
        cascade="all, delete-orphan",
    )

    automations = relationship(
        "AutomationRule",
        back_populates="home",
        cascade="all, delete-orphan",
    )
