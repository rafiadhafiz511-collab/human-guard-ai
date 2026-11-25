import json
import logging
import os
import firebase_admin
from firebase_admin import credentials

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "firebase-credentials.json")


def init_firebase():
    if firebase_admin._apps:
        return

    raw_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if raw_json:
        try:
            cred_dict = json.loads(raw_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized from FIREBASE_CREDENTIALS_JSON.")
            return
        except Exception as exc:
            logger.warning(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {exc}")

    if os.path.exists(CREDENTIALS_PATH):
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        logger.info(f"Firebase initialized from {CREDENTIALS_PATH}.")
        return

    logger.warning(
        f"Firebase credentials not found at {CREDENTIALS_PATH} or FIREBASE_CREDENTIALS_JSON; "
        "skipping Firebase initialization."
    )