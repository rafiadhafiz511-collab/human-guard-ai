from app.database.database import SessionLocal
# প্রজেক্টের সব মডেল যেন মেমরিতে রেজিস্টার্ড হয়
import app.models  # অথবা আপনার models ফোল্ডারের সব মডেল একসাথে
from app.models.user import User
from app.auth.password import hash_password

db = SessionLocal()

user = (
    db.query(User)
    .filter(User.email == "admin@humanguard.ai")
    .first()
)

if user:
    user.password = hash_password("12345678")
    db.commit()
    print("Password updated successfully")
else:
    print("User not found")

db.close()