
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.automation import AutomationRule
from app.models.home import Home
from app.models.user import User
from app.schemas.automation import (
    AutomationCreate,
    AutomationResponse,
    AutomationUpdate,
)


router = APIRouter(
    prefix="/automations",
    tags=["Automations"],
)


# ============================================================
# HELPER
# ============================================================

def get_automation_or_404(
    automation_id: str,
    db: Session,
) -> AutomationRule:
    automation = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.id == automation_id
        )
        .first()
    )

    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation not found",
        )

    return automation


def get_home_or_404(
    home_id: str,
    db: Session,
) -> Home:
    home = (
        db.query(Home)
        .filter(Home.id == home_id)
        .first()
    )

    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found",
        )

    return home


# ============================================================
# CREATE AUTOMATION
# ============================================================

@router.post(
    "/",
    response_model=AutomationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_automation(
    data: AutomationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new automation rule.
    """

    # Make sure the target home exists
    get_home_or_404(
        data.home_id,
        db,
    )

    automation = AutomationRule(
        id=uuid4().hex,
        home_id=data.home_id,
        name=data.name,
        description=data.description,
        is_active=data.is_active,
        trigger_type=data.trigger_type,
        trigger_config=data.trigger_config,
        conditions=data.conditions,
        action_type=data.action_type,
        action_config=data.action_config,
        cooldown_seconds=data.cooldown_seconds,
    )

    try:
        db.add(automation)
        db.commit()
        db.refresh(automation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create automation",
        )

    return automation


# ============================================================
# LIST AUTOMATIONS
# ============================================================

@router.get(
    "/",
    response_model=list[AutomationResponse],
)
def get_automations(
    home_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get automation rules.

    Optional:
        home_id = filter automations by home
    """

    query = db.query(AutomationRule)

    if home_id:
        query = query.filter(
            AutomationRule.home_id == home_id
        )

    return (
        query
        .order_by(
            AutomationRule.name.asc()
        )
        .all()
    )


# ============================================================
# GET SINGLE AUTOMATION
# ============================================================

@router.get(
    "/{automation_id}",
    response_model=AutomationResponse,
)
def get_automation(
    automation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get one automation rule.
    """

    return get_automation_or_404(
        automation_id,
        db,
    )


# ============================================================
# UPDATE AUTOMATION
# ============================================================

@router.patch(
    "/{automation_id}",
    response_model=AutomationResponse,
)
def update_automation(
    automation_id: str,
    data: AutomationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing automation rule.

    Only fields supplied by the client are updated.
    """

    automation = get_automation_or_404(
        automation_id,
        db,
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # Nothing to update
    if not update_data:
        return automation

    for field, value in update_data.items():
        setattr(
            automation,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(automation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update automation",
        )

    return automation


# ============================================================
# TOGGLE AUTOMATION
# ============================================================

@router.patch(
    "/{automation_id}/toggle",
    response_model=AutomationResponse,
)
def toggle_automation(
    automation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle automation ON/OFF.
    """

    automation = get_automation_or_404(
        automation_id,
        db,
    )

    automation.is_active = not automation.is_active

    try:
        db.commit()
        db.refresh(automation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle automation",
        )

    return automation


# ============================================================
# DELETE AUTOMATION
# ============================================================

@router.delete(
    "/{automation_id}",
)
def delete_automation(
    automation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an automation rule.
    """

    automation = get_automation_or_404(
        automation_id,
        db,
    )

    try:
        db.delete(automation)
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete automation",
        )

    return {
        "success": True,
        "message": "Automation deleted successfully",
        "automation_id": automation_id,
    }

