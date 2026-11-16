from app.database.database import Base, engine

# Import ALL models
from app.models.user import User
from app.models.device import Device
from app.models.detection import Detection


def init_db():
    Base.metadata.create_all(bind=engine)