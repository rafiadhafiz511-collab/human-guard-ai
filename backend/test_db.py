from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg://postgres:postgres123@127.0.0.1:5433/human_guard_ai"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("✅ Database Connected Successfully!")
except Exception as e:
    print(e)