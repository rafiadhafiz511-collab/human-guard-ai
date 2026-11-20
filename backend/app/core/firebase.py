import os
import firebase_admin
from firebase_admin import credentials

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "firebase-credentials.json")

def init_firebase():
    if not firebase_admin._apps:
        if not os.path.exists(CREDENTIALS_PATH):
            raise FileNotFoundError(
                f"Firebase credentials file not found at: {CREDENTIALS_PATH}"
            )
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)