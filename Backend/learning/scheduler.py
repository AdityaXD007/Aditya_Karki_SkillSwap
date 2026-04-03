from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def send_weekly_summary_task():
    try:
        call_command('send_weekly_summary')
    except Exception as e:
        logger.error(f"Error in weekly summary task: {e}")

def expire_sessions_task():
    try:
        call_command('expire_sessions')
    except Exception as e:
        logger.error(f"Error in session expiry task: {e}")

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # Schedule: Weekly Summary (Mondays at 9:00 AM)
    scheduler.add_job(
        send_weekly_summary_task,
        trigger="cron",
        day_of_week=0,
        hour=9,
        minute=0,
        id="weekly_summary_email",
        replace_existing=True,
        max_instances=1,
    )

    # Schedule: Session Expiry (Every hour)
    scheduler.add_job(
        expire_sessions_task,
        trigger="interval",
        hours=1,
        id="session_expiry",
        replace_existing=True,
        max_instances=1,
    )
    
    register_events(scheduler)
    scheduler.start()
    logger.info("SkillSwap Scheduler started...")
