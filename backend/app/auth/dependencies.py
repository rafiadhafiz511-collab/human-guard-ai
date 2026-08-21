from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # JWT Token Decode
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        sub: str = payload.get("sub")

        if sub is None:
            raise credentials_exception

    except JWTError as e:
        print(f"JWT Verification Failed: {e}")
        raise credentials_exception

    # sub থেকে Email বা ID উভয় দিয়ে ইউজার খোঁজা (নিরাপদ ফিল্টার)
    user = (
        db.query(User)
        .filter((User.email == str(sub)) | (User.id == str(sub)))
        .first()
    )

    # যদি Integer ID ব্যবহার করে থাকেন
    if not user and str(sub).isdigit():
        user = db.query(User).filter(User.id == int(sub)).first()

    if user is None:
        print(f"User with sub '{sub}' not found in database.")
        raise credentials_exception

    return user