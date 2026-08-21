from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_and_run_time_automations():
    """প্রতি ১ মিনিট পর পর Time-based অটোমেশন রুলগুলো চেক করার লজিক"""
    from app.database.database import SessionLocal
    from app.models.automation import AutomationRule, TriggerType
    from app.services.automation_engine import execute_automation_action

    db = SessionLocal()
    try:
        now = datetime.now()
        current_time = now.strftime("%H:%M")  # e.g. "22:30"
        current_day = now.strftime("%a").upper()  # e.g. "MON", "TUE"

        # সময়ভিত্তিক সক্রিয় রুলগুলো খোঁজা
        rules = db.query(AutomationRule).filter(
            AutomationRule.trigger_type == TriggerType.SCHEDULE,
            AutomationRule.is_active == True
        ).all()

        for rule in rules:
            config = rule.trigger_config or {}
            scheduled_time = config.get("time")  # e.g., "07:00"
            allowed_days = config.get("days", [])  # e.g., ["MON", "TUE", ...]

            # সময় ও বার মিললে রুল রান করা
            if scheduled_time == current_time:
                if not allowed_days or current_day in allowed_days:
                    logger.info(f"[TIME AUTOMATION TRIGGERED] Rule: {rule.name}")
                    execute_automation_action(db, rule)

    except Exception as e:
        logger.error(f"Error in scheduler task: {str(e)}")
    finally:
        db.close()


def cleanup_old_activity_logs():
    """প্রতিদিন রাত ১২:০০ টায় ৩০ দিনের পুরানো লগ ডাটাবেস থেকে মুছে ফেলার লজিক"""
    from app.services.cleanup import delete_old_command_logs
    try:
        delete_old_command_logs()
    except Exception as e:
        logger.error(f"Error running 30-day log cleanup task: {str(e)}")


def start_scheduler():
    """FastAPI ব্যাকএন্ড চালুর সময় Scheduler স্টার্ট হবে"""
    if not scheduler.running:
        # ১. প্রতি ১ মিনিট পর পর Time Automation জবটি চলবে
        scheduler.add_job(
            check_and_run_time_automations,
            'cron',
            minute='*',
            id='time_automation_job',
            replace_existing=True
        )

        # ২. প্রতিদিন রাত ১২:০০ টায় (Midnight) ৩০ দিনের পুরানো লগ ক্লিনআপ চলবে
        scheduler.add_job(
            cleanup_old_activity_logs,
            'cron',
            hour=0,
            minute=0,
            id='daily_log_cleanup_job',
            replace_existing=True
        )

        scheduler.start()
        logger.info("APScheduler Background Engine Started (Automations & 30-Day Cleanup Active).")


def shutdown_scheduler():
    """FastAPI সার্ভার বন্ধের সময় Scheduler থামবে"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler Shutdown.")