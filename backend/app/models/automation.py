import enum
from sqlalchemy import Column, String, Boolean, Integer, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.database import Base


class TriggerType(str, enum.Enum):
    TELEMETRY = "telemetry"         # Sensor value: temperature > 30, water_level < 20, humidity > 80%
    DEVICE_STATE = "device_state"   # Motion detected == True, Door == OPEN, Relay == ON
    SCHEDULE = "schedule"           # Everyday at 07:00 AM, or Cron expression
    SUN_TIME = "sun_time"           # Sunset / Sunrise


class ActionType(str, enum.Enum):
    DEVICE_COMMAND = "device_command" # Turn ON/OFF/Toggle, Set Temperature, Set Brightness
    SCENE = "scene"                   # Trigger a preset home scene (e.g., Night Mode, Away Mode)
    NOTIFICATION = "notification"     # Send FCM Push Alert to App


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(String, primary_key=True, index=True)
    home_id = Column(String, ForeignKey("homes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    trigger_type = Column(Enum(TriggerType), nullable=False)
    # Flexible JSON Configs:
    # Telemetry Example: {"device_id": "temp_sensor_1", "key": "temperature", "operator": ">=", "value": 28}
    # Motion Example:    {"device_id": "pir_sensor_hall", "key": "motion", "operator": "==", "value": True}
    # Schedule Example:  {"time": "22:30", "days": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]}
    trigger_config = Column(JSON, nullable=False)

    # Multi-condition evaluation (Optional)
    # Example: {"time_between": ["18:00", "06:00"], "home_state": "ARMED_AWAY"}
    conditions = Column(JSON, nullable=True)

    action_type = Column(Enum(ActionType), nullable=False)
    # Flexible Action Examples:
    # Turn AC ON:     {"device_id": "ac_living_room", "command": "SET_TEMP", "params": {"temp": 24}}
    # Light Switch:   {"device_id": "light_porch", "channel_id": "ch_1", "command": "TURN_ON"}
    # Alert:          {"title": "Water Leakage Detected!", "priority": "HIGH"}
    action_config = Column(JSON, nullable=False)

    # Cooldown to avoid continuous execution (in seconds)
    cooldown_seconds = Column(Integer, default=5)

    home = relationship("Home", back_populates="automations")
