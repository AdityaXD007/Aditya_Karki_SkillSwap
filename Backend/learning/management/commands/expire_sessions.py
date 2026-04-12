from django.core.management.base import BaseCommand
from django.utils import timezone
from learning.models import SessionRequest, LearningSession

def run_session_expiry():
    now = timezone.now()
    three_days_ago = now - timezone.timedelta(days=3)

    # 1. Paid sessions that passed their time -> Mark as COMPLETED
    completed_sessions_count = LearningSession.objects.filter(
        status='SCHEDULED',
        scheduled_time__lt=now,
        is_paid=True
    ).update(status='COMPLETED')

    # 2. Unpaid sessions that passed their time -> Mark as EXPIRED
    # (These were scheduled but the student never paid)
    expired_sessions_count = LearningSession.objects.filter(
        status='SCHEDULED',
        scheduled_time__lt=now,
        is_paid=False
    ).update(status='EXPIRED')

    # 3. Update the associated SessionRequest if it exists
    # (Matches COMPLETED sessions)
    completed_requests_count = SessionRequest.objects.filter(
        status='ACCEPTED',
        session__status='COMPLETED'
    ).update(status='COMPLETED')

    # 4. Also update requests for EXPIRED sessions
    SessionRequest.objects.filter(
        status='ACCEPTED',
        session__status='EXPIRED'
    ).update(status='EXPIRED')

    # 5. Auto-expire pending requests after 3 days
    expired_requests_count = SessionRequest.objects.filter(
        status='PENDING',
        created_at__lt=three_days_ago
    ).update(status='EXPIRED')

    return completed_sessions_count, expired_sessions_count, expired_requests_count

class Command(BaseCommand):
    help = "Auto-expire pending requests and complete accepted sessions whose dates have passed."

    def handle(self, *args, **options):
        completed_sessions_count, expired_sessions_count, expired_requests_count = run_session_expiry()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully updated sessions: {completed_sessions_count} completed, "
                f"{expired_sessions_count} sessions expired (unpaid), "
                f"{expired_requests_count} requests expired."
            )
        )

# Run daily at midnight: 0 0 * * * python manage.py expire_sessions
