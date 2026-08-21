from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, index=True)
    image_path = Column(String, nullable=True)
    person = Column(Boolean, default=False)
    confidence = Column(Float, default=0.0)
    alarm = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    device_id = Column(String, ForeignKey("devices.id"))

    device = relationship("Device", back_populates="detections")