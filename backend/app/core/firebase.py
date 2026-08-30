import os

import firebase_admin
from firebase_admin import credentials


def init_firebase():
    if firebase_admin._apps:
        return

    credentials_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    if not credentials_path:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS environment variable "
            "is required"
        )

    if not os.path.exists(credentials_path):
        raise FileNotFoundError(
            "Firebase credentials file not found: "
            f"{credentials_path}"
        )

    cred = credentials.Certificate(credentials_path)

    firebase_admin.initialize_app(cred)