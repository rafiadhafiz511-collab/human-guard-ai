import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.models.home import Home
from app.models.home_member import HomeMember
from app.models.user import User


def _is_global_admin(current_user: object) -> bool:
    """রোল, মেটাডেটা অথবা নির্ধারিত অ্যাডমিন ইমেইল দিয়ে গ্লোবাল অ্যাডমিন যাচাই করে।"""
    role = (getattr(current_user, "role", None) or "").strip().lower()
    if role == "admin":
        return True

    email = (getattr(current_user, "email", None) or "").strip().lower()
    payload = getattr(current_user, "payload", None)
    if not email and isinstance(payload, dict):
        email = (payload.get("email") or "").strip().lower()

    admin_emails = {
        e.strip().lower()
        for e in (os.getenv("ADMIN_EMAILS") or "rafiadhafiz511@gmail.com").split(",")
        if e.strip()
    }
    if email and email in admin_emails:
        return True

    if isinstance(payload, dict):
        app_role = ((payload.get("app_metadata") or {}).get("role") or "").strip().lower()
        user_role = ((payload.get("user_metadata") or {}).get("role") or "").strip().lower()
        if app_role == "admin" or user_role == "admin":
            return True

    return False


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    গ্লোবাল সিস্টেম অ্যাডমিন রোল যাচাই করে।
    """
    if not _is_global_admin(current_user):
        role = (getattr(current_user, "role", None) or "").strip().lower()
        email = (getattr(current_user, "email", None) or "").strip().lower()
        print(
            f"ADMIN CHECK FAILED: type={type(current_user).__name__}, id={getattr(current_user, 'id', None)}, email={email}, role={role}",
            flush=True,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def get_user_home_role(db: Session, user_id: str, home_id: str) -> Optional[str]:
    """
    ব্যবহারকারীর হোম অ্যাক্সেস লেভেলের ওপর ভিত্তি করে
    'OWNER', 'ADMIN', 'MEMBER', অথবা None রিটার্ন করে।
    """
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        return None

    if str(home.owner_id) == str(user_id):
        return "OWNER"

    member = (
        db.query(HomeMember)
        .filter(
            HomeMember.home_id == home_id,
            HomeMember.user_id == user_id,
        )
        .first()
    )

    if member and member.role:
        return member.role.strip().upper()

    return None


def verify_home_access(
    db: Session,
    user_id: str,
    home_id: str,
    required_roles: Optional[list[str]] = None,
) -> str:
    """
    ব্যবহারকারীর নির্দিষ্ট হোমে অ্যাক্সেস এবং প্রয়োজনীয় রোল আছে কি না তা যাচাই করে।
    হোম না থাকলে 404, অ্যাক্সেস না থাকলে বা রোল না মিললে 403 এরর থ্রো করে।
    """
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Home not found",
        )

    role = get_user_home_role(db=db, user_id=user_id, home_id=home_id)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this home",
        )

    normalized_required = (
        [r.strip().upper() for r in required_roles] if required_roles else None
    )
    if normalized_required and role not in normalized_required:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires one of the following roles: {', '.join(normalized_required)}",
        )

    return role