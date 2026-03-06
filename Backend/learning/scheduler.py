from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events
from learning.management.commands.expire_sessions import run_session_expiry
import logging

logger = logging.getLogger(__name__)

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # Schedule the expiry function to run once every 24 hours
    scheduler.add_job(
        run_session_expiry,
        trigger="interval",
        hours=24,
        id="expire_sessions_job",  # Fixed ID to prevent duplicates
        max_instances=1,
        replace_existing=True,
    )
    
    register_events(scheduler)
    scheduler.start()
    logger.info("Scheduler started, session expiry job scheduled for every 24 hours.")
