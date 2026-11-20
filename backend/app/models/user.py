from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.database.database import Base

import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    # Password is optional because users can authenticate
    # through Firebase/Google.
    password = Column(
        String,
        nullable=True,
    )

    role = Column(
        String,
        default="customer",
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    fcm_token = Column(
        String,
        nullable=True,
    )

    # ==========================================
    # RELATIONSHIPS
    # ==========================================

    homes = relationship(
        "Home",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    home_memberships = relationship(
        "HomeMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )