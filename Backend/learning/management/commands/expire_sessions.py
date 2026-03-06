from django.core.management.base import BaseCommand
from django.utils import timezone
from learning.models import SessionRequest, LearningSession

def run_session_expiry():
    now = timezone.now()
    three_days_ago = now - timezone.timedelta(days=3)

    # Feature 2: Auto-move to Past when date passes
    completed_sessions_count = LearningSession.objects.filter(
        status='SCHEDULED',
        scheduled_time__lt=now
    ).update(status='COMPLETED')

    # Also update the associated SessionRequest if it exists
    completed_requests_count = SessionRequest.objects.filter(
        status='ACCEPTED',
        session__status='COMPLETED'
    ).update(status='COMPLETED')

    # Feature 3: Auto-expire pending requests after 3 days
    expired_requests_count = SessionRequest.objects.filter(
        status='PENDING',
        created_at__lt=three_days_ago
    ).update(status='EXPIRED')

    return completed_sessions_count, expired_requests_count

class Command(BaseCommand):
    help = "Auto-expire pending requests and complete accepted sessions whose dates have passed."

    def handle(self, *args, **options):
        completed_sessions_count, expired_requests_count = run_session_expiry()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully updated sessions: {completed_sessions_count} completed, "
                f"{expired_requests_count} requests expired."
            )
        )

# Run daily at midnight: 0 0 * * * python manage.py expire_sessions
