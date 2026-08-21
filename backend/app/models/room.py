import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.database import Base


class Room(Base):
    """A named location inside a home that can contain multiple devices."""

    __tablename__ = "rooms"

    id = Column(
    String,
    primary_key=True,
    default=lambda: uuid.uuid4().hex,
)

    home_id = Column(
        String,
        ForeignKey("homes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    home = relationship("Home", back_populates="rooms")

    devices = relationship("Device", back_populates="room")

    __table_args__ = (
        UniqueConstraint("home_id", "name", name="uq_room_home_name"),
    )
