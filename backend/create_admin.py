from app.database.database import SessionLocal

from app.models.user import User

from app.auth.password import hash_password


db = SessionLocal()

admin = User(
    name="Admin",
    email="admin@humanguard.ai",
    password=hash_password("12345678"),
)

db.add(admin)
db.commit()

print("Admin Created")