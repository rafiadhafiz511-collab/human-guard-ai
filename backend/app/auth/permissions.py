from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.models.home import Home
from app.models.home_member import HomeMember
from app.models.user import User


def require_admin(
    current_user: User = Depends(get_current_user),
):
    """
    গ্লোবাল সিস্টেম অ্যাডমিন রোল যাচাই করে।
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def get_user_home_role(db: Session, user_id: str, home_id: str) -> Optional[str]:
    """
    ব্যবহারকারীর হোম অ্যাক্সেস লেভেলের ওপর ভিত্তি করে 'OWNER', 'ADMIN', 'MEMBER', অথবা None রিটার্ন করে।
    """
    home = db.query(Home).filter(Home.id == home_id).first()
    if not home:
        return None

    if home.owner_id == user_id:
        return "OWNER"

    member = (
        db.query(HomeMember)
        .filter(
            HomeMember.home_id == home_id,
            HomeMember.user_id == user_id,
        )
        .first()
    )

    if member:
        return member.role.upper()

    return None


def verify_home_access(
    db: Session,
    user_id: str,
    home_id: str,
    required_roles: Optional[list[str]] = None,
) -> str:
    """
    ব্যবহারকারীর নির্দিষ্ট হোমে অ্যাক্সেস এবং প্রয়োজনীয় রোল আছে কি না তা যাচাই করে।
    হোম পাওয়া না গেলে 404 এবং অনুমতি না থাকলে 403 এরর থ্রো করে।
    """
    role = get_user_home_role(db=db, user_id=user_id, home_id=home_id)

    if role is None:
        # হোমটি আদৌ বিদ্যমান কি না তা পরীক্ষা করা
        home_exists = db.query(Home).filter(Home.id == home_id).first()
        if not home_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Home not found",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this home",
        )

    if required_roles and role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Requires one of the following roles: {', '.join(required_roles)}",
        )

    return role