import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth

from app.database.database import get_db
from app.models.user import User
from app.auth.password import verify_password
from app.auth.security import create_access_token
from app.auth.dependencies import get_current_user
from app.core.firebase import init_firebase
from app.auth.schemas import (
    FCMTokenRequest,
    FirebaseLoginRequest,
    TokenResponse,
)

# Firebase initialize on startup
init_firebase()

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=TokenResponse, deprecated=True)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        form_data.password,
        user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/google-firebase", response_model=TokenResponse)
def google_firebase_login(
    payload: FirebaseLoginRequest,
    db: Session = Depends(get_db)
):
    try:
        # 1. Firebase Token Verification
        decoded_token = firebase_auth.verify_id_token(payload.id_token)
        email = decoded_token.get("email")
        name = decoded_token.get("name", email.split("@")[0] if email else "User")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Firebase token",
            )

        # 2. Check or Create User in local database
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name=name,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 3. Create Custom Backend Access Token using User ID
        access_token = create_access_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
            },
        }

    except Exception as e:
        print("\n========== FIREBASE LOGIN ERROR ==========")
        print(f"ERROR TYPE: {type(e).__name__}")
        print(f"ERROR: {e}")
        traceback.print_exc()
        print("==========================================\n")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


@router.put("/fcm-token")
def update_fcm_token(
    payload: FCMTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.fcm_token = payload.fcm_token
    db.commit()
    return {"message": "FCM Token updated successfully"}