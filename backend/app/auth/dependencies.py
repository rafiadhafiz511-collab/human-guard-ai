import os
from types import SimpleNamespace
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.auth.security import ALGORITHM, SECRET_KEY
from app.database.database import get_db
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=True,
)

DEFAULT_SUPABASE_URL = "https://ljgnscuhcxobimuwlrzf.supabase.co"
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or SECRET_KEY

_jwks_client: Optional[PyJWKClient] = None
_cached_jwks_url: Optional[str] = None


def _get_supabase_base_url() -> str:
    raw = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
    if not raw or not (raw.startswith("http://") or raw.startswith("https://")):
        return DEFAULT_SUPABASE_URL
    return raw


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _cached_jwks_url

    jwks_url = f"{_get_supabase_base_url()}/auth/v1/.well-known/jwks.json"

    if _jwks_client is None or _cached_jwks_url != jwks_url:
        _cached_jwks_url = jwks_url
        _jwks_client = PyJWKClient(
            jwks_url,
            headers={"User-Agent": "HumanGuardAI/1.0"},
            timeout=10,
        )

    return _jwks_client


def _decode_token_payload(token: str) -> Dict[str, Any]:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg")
    issuer = f"{_get_supabase_base_url()}/auth/v1"

    # Supabase ECC (P-256) tokens use ES256 via JWKS.
    if alg == "ES256":
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=issuer,
            leeway=30,
        )

    # Fallback for older HS256 tokens.
    if alg == "HS256":
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM] if ALGORITHM else ["HS256"],
            audience="authenticated",
            issuer=issuer,
            leeway=30,
        )

    raise jwt.InvalidTokenError(f"Unsupported JWT algorithm: {alg}")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Any:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = _decode_token_payload(token)
        sub = payload.get("sub")
        email = payload.get("email")

        if not sub and not email:
            print("AUTH ERROR: missing both sub and email in payload", flush=True)
            raise credentials_exception

    except HTTPException:
        raise
    except Exception as exc:
        print("AUTH ERROR:", repr(exc), flush=True)
        raise credentials_exception

    user = None

    if sub:
        user = (
            db.query(User)
            .filter((User.id == str(sub)) | (User.email == str(sub)))
            .first()
        )

    if user is None and email:
        user = db.query(User).filter(User.email == str(email)).first()

    if user is None:
        return SimpleNamespace(
            id=str(sub) if sub else None,
            email=email,
            role=payload.get("role", "authenticated"),
            payload=payload,
        )

    return user