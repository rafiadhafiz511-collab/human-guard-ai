from app.core.config.settings import settings
from app.database.database import Base, engine

# Import all models
from app.models.user import User
from app.models.device import Device
from app.models.detection import Detection
from app.models.device_channel import DeviceChannel
from app.models.device_command import DeviceCommand
from app.models.firmware import Firmware
from app.models.home import Home
from app.models.home_member import HomeMember
from app.models.room import Room
from app.models.schedule import Schedule
from app.models.automation import AutomationRule


def init_db():
    if settings.ENVIRONMENT != "production":
        Base.metadata.create_all(bind=engine)
