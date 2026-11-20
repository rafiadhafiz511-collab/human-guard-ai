import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================
# Environment Configuration
# ============================================================

# Backend root: human-guard-ai/backend/
# parents[2] -> human-guard-ai/backend/
BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_ROOT / ".env"

load_dotenv(dotenv_path=ENV_FILE)


ENVIRONMENT = os.getenv(
    "ENVIRONMENT",
    "development",
).lower()

DEBUG = os.getenv(
    "DEBUG",
    "true",
).lower() == "true"


# ============================================================
# Database Configuration
# ============================================================

def _build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")

    # Explicit DATABASE_URL always takes priority.
    if database_url:
        return database_url

    # Production must use an explicit DATABASE_URL.
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "DATABASE_URL environment variable is required in production"
        )

    user = os.getenv(
        "POSTGRES_USER",
        "postgres",
    )

    password = os.getenv(
        "POSTGRES_PASSWORD",
        "postgres123",
    )

    host = os.getenv(
        "POSTGRES_HOST",
        "localhost",
    )

    port = os.getenv(
        "POSTGRES_PORT",
        "5432",  # ডিফল্ট পোস্টগ্রেস পোর্ট 5432 রাখা হয়েছে (প্রয়োজনে .env অনুযায়ী বদলাতে পারো)
    )

    database = os.getenv(
        "POSTGRES_DB",
        "human_guard_ai",
    )

    return (
        "postgresql+psycopg://"
        f"{user}:{password}@{host}:{port}/{database}"
    )


DATABASE_URL = _build_database_url()