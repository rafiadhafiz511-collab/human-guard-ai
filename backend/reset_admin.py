from app.database.database import SessionLocal
from app.models.user import User
from app.auth.password import hash_password


EMAIL = "admin@humanguard.ai"
PASSWORD = "12345678"

db = SessionLocal()

try:
    admin = db.query(User).filter(User.email == EMAIL).first()

    if admin:
        admin.name = "Admin"
        admin.email = EMAIL
        admin.password = hash_password(PASSWORD)
        admin.role = "admin"
        admin.is_active = True

        print("Admin account reset successfully.")

    else:
        admin = User(
            name="Admin",
            email=EMAIL,
            password=hash_password(PASSWORD),
            role="admin",
            is_active=True,
        )

        db.add(admin)

        print("Admin account created successfully.")

    db.commit()

    print()
    print("Email:", EMAIL)
    print("Password:", PASSWORD)
    print("Role: admin")

except Exception as e:
    db.rollback()
    print("Error:", e)

finally:
    db.close()