from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.automation import ActionType, TriggerType


class AutomationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

    is_active: bool = True

    trigger_type: TriggerType
    trigger_config: dict[str, Any]

    conditions: Optional[dict[str, Any]] = None

    action_type: ActionType
    action_config: dict[str, Any]

    cooldown_seconds: int = Field(
        default=5,
        ge=0,
    )


class AutomationCreate(AutomationBase):
    home_id: str


class AutomationUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: Optional[str] = None

    is_active: Optional[bool] = None

    trigger_type: Optional[TriggerType] = None
    trigger_config: Optional[dict[str, Any]] = None

    conditions: Optional[dict[str, Any]] = None

    action_type: Optional[ActionType] = None
    action_config: Optional[dict[str, Any]] = None

    cooldown_seconds: Optional[int] = Field(
        default=None,
        ge=0,
    )


class AutomationResponse(AutomationBase):
    id: str
    home_id: str

    model_config = ConfigDict(
        from_attributes=True,
    )