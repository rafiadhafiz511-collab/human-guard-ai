from app.core.config.settings import settings


def _build_database_url() -> str:
    # Explicit DATABASE_URL always takes priority.
    if settings.DATABASE_URL:
        return settings.DATABASE_URL

    # Production must use an explicit DATABASE_URL.
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "DATABASE_URL environment variable is required in production"
        )

    return (
        "postgresql+psycopg://"
        f"{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD}@"
        f"{settings.POSTGRES_HOST}:"
        f"{settings.POSTGRES_PORT}/"
        f"{settings.POSTGRES_DB}"
    )


DATABASE_URL = _build_database_url()