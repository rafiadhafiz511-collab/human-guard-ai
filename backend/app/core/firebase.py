import os

import firebase_admin
from firebase_admin import credentials

from app.core.config.settings import settings


def init_firebase() -> None:
    if firebase_admin._apps:
        return

    credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS

    if not credentials_path:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS environment variable is required"
        )

    credentials_path = os.path.abspath(credentials_path)

    if not os.path.exists(credentials_path):
        raise FileNotFoundError(
            f"Firebase credentials file not found at: {credentials_path}"
        )

    cred = credentials.Certificate(credentials_path)

    firebase_admin.initialize_app(cred)