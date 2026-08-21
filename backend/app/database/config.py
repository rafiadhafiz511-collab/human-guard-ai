from dotenv import load_dotenv
import os

load_dotenv()

# Use DATABASE_URL from environment, or construct it from components
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    (
        f"postgresql+psycopg://"
        f"{os.getenv('POSTGRES_USER', 'postgres')}:"
        f"{os.getenv('POSTGRES_PASSWORD', 'postgres123')}@"
        f"localhost:"
        f"{os.getenv('POSTGRES_PORT', '5433')}/"
        f"{os.getenv('POSTGRES_DB', 'human_guard_ai')}"
    )
)

# Get environment
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'