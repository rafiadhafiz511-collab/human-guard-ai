import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.database import Base


class HomeMember(Base):
    __tablename__ = "home_members"

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

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(
        String(20),
        nullable=False,
        default="MEMBER",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    home = relationship(
        "Home",
        back_populates="members",
    )

    user = relationship(
        "User",
        back_populates="home_memberships",
    )

    __table_args__ = (
        UniqueConstraint(
            "home_id",
            "user_id",
            name="uq_home_member",
        ),
    )