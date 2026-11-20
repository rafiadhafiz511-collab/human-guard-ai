from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal  # আপনার প্রজেক্টের DB Session ইম্পোর্ট করুন
from app.models.device import CommandLog  # আপনার Command/Activity Log Model ইম্পোর্ট করুন

def delete_old_command_logs():
    """৩০ দিনের পুরানো কমান্ড বা অ্যাক্টিভিটি লগ অটো-ডিলিট করবে"""
    db: Session = SessionLocal()
    try:
        # ৩০ দিন আগের সময়সীমা হিসাব
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
        
        # ডিলিট অপারেশন
        deleted_count = db.query(CommandLog).filter(
            CommandLog.created_at < cutoff_date
        ).delete(synchronize_session=False)
        
        db.commit()
        print(f"  [Cleanup Success] Deleted {deleted_count} logs older than 30 days.")
    except Exception as e:
        db.rollback()
        print(f"❌ [Cleanup Error] {str(e)}")
    finally:
        db.close()