from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from learning.models import LearningSession, SessionRequest
from utils.email_sender import send_skillswap_email
from django.db.models import Q

class Command(BaseCommand):
    help = 'Sends weekly summary emails to users'

    def handle(self, *args, **options):
        now = timezone.now()
        next_week = now + timedelta(days=7)
        
        users = User.objects.filter(profile__email_notifications_enabled=True)
        count = 0

        for user in users:
            # 1. Upcoming sessions this week
            upcoming = LearningSession.objects.filter(
                (Q(student=user) | Q(teacher=user)),
                scheduled_time__range=[now, next_week],
                status='SCHEDULED'
            )
            
            # 2. Pending swap requests awaiting response (Received)
            pending_requests = SessionRequest.objects.filter(
                partner=user,
                status='PENDING'
            )

            # Skip if no activity
            if not upcoming.exists() and not pending_requests.exists():
                continue

            # Add partner info to upcoming sessions for the template
            processed_upcoming = []
            for s in upcoming:
                partner = s.teacher if s.student == user else s.student
                processed_upcoming.append({
                    'skill': s.skill,
                    'partner': partner,
                    'scheduled_time': s.scheduled_time
                })

            success = send_skillswap_email(
                user=user,
                subject="Your SkillSwap Weekly Summary",
                template_name="weekly_summary.html",
                context={
                    'upcoming_sessions': processed_upcoming,
                    'pending_requests': pending_requests
                }
            )
            
            if success:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully sent {count} weekly summary emails'))
