import os
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[4]
ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=ENV_FILE)


class Settings:
    APP_NAME: str = os.getenv(
        "APP_NAME",
        "Human Guard AI",
    )

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development",
    ).lower()

    DEBUG: bool = os.getenv(
        "DEBUG",
        "true",
    ).lower() == "true"

    # =========================
    # Database
    # =========================

    DATABASE_URL: str | None = os.getenv(
        "DATABASE_URL"
    )

    POSTGRES_USER: str = os.getenv(
        "POSTGRES_USER",
        "postgres",
    )

    POSTGRES_PASSWORD: str = os.getenv(
        "POSTGRES_PASSWORD",
        "postgres123",
    )

    POSTGRES_HOST: str = os.getenv(
        "POSTGRES_HOST",
        "localhost",
    )

    POSTGRES_PORT: str = os.getenv(
        "POSTGRES_PORT",
        "5433",
    )

    POSTGRES_DB: str = os.getenv(
        "POSTGRES_DB",
        "human_guard_ai",
    )

    # =========================
    # JWT
    # =========================

    JWT_SECRET_KEY: str | None = os.getenv(
        "JWT_SECRET_KEY"
    )

    JWT_ALGORITHM: str = os.getenv(
        "JWT_ALGORITHM",
        "HS256",
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "30",
        )
    )

    # =========================
    # Firebase
    # =========================

    GOOGLE_APPLICATION_CREDENTIALS: str | None = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS"
    )

    # =========================
    # MQTT
    # =========================

    MQTT_BROKER_HOST: str = os.getenv(
        "MQTT_BROKER_HOST",
        "broker.hivemq.com",
    )

    MQTT_BROKER_PORT: int = int(
        os.getenv(
            "MQTT_BROKER_PORT",
            "1883",
        )
    )

    MQTT_KEEPALIVE: int = int(
        os.getenv(
            "MQTT_KEEPALIVE",
            "60",
        )
    )

    MQTT_TOPIC_TELEMETRY: str = os.getenv(
        "MQTT_TOPIC_TELEMETRY",
        "humantech/devices/+/telemetry",
    )

    MQTT_TOPIC_COMMAND: str = os.getenv(
        "MQTT_TOPIC_COMMAND",
        "humantech/devices/{device_id}/command",
    )

    # =========================
    # Application URLs / CORS
    # =========================

    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "",
    )

    SERVER_BASE_URL: str | None = os.getenv(
        "SERVER_BASE_URL"
    )


settings = Settings()
