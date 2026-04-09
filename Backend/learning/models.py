from django.db import models
from django.contrib.auth.models import User
from skills.models import Skill

# 5. SessionRequest
class SessionRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('WITHDRAWN', 'Withdrawn'),
        ('EXPIRED', 'Expired'),
        ('COMPLETED', 'Completed'),
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    partner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    
    # Optional: If it's a direct skill exchange (User A teaches X, User B teaches Y)
    skill_to_learn = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, related_name='requests_to_learn')
    skill_to_teach = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_to_teach')
    
    session_length = models.IntegerField(help_text="Duration in minutes", default=60)
    proposed_time = models.DateTimeField(null=True, blank=True, help_text="Optional proposed meeting time by the requester")
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.requester.username} to {self.partner.username}"

# 6. LearningSession
class LearningSession(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('WITHDRAWN', 'Withdrawn'),
        ('EXPIRED', 'Expired'),
    )

    request = models.OneToOneField(SessionRequest, on_delete=models.SET_NULL, null=True, related_name='session')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_sessions_as_student')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_sessions_as_teacher')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    scheduled_time = models.DateTimeField()
    duration = models.IntegerField(help_text="Duration in minutes")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    meeting_link = models.URLField(blank=True, max_length=500)
    notes = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Total price for the session including platform fee")

    # Actual Session Tracking
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Pause Functionality
    is_paused = models.BooleanField(default=False)
    paused_at = models.DateTimeField(null=True, blank=True)
    remaining_duration_seconds = models.IntegerField(null=True, blank=True, help_text="Remaining seconds when paused")
    
    # Payment and Verification
    is_paid = models.BooleanField(default=False, help_text="Has the student paid the session fee?")
    is_free = models.BooleanField(default=False, help_text="Is this a free session?")
    admin_confirmed = models.BooleanField(default=False, help_text="Has the admin confirmed session completion?")
    payout_completed = models.BooleanField(default=False, help_text="Has the teacher received the payment?")

    # Ratings/Feedback
    rating_by_student = models.IntegerField(null=True, blank=True)
    rating_by_teacher = models.IntegerField(null=True, blank=True)
    feedback_by_student = models.TextField(blank=True)
    feedback_by_teacher = models.TextField(blank=True)

    # Reschedule Request Fields
    reschedule_requested_time = models.DateTimeField(null=True, blank=True)
    reschedule_reason = models.TextField(blank=True)
    reschedule_requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reschedule_requests_sent')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session: {self.skill.name} ({self.scheduled_time})"
