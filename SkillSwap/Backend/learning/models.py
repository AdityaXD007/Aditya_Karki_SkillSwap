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
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    partner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    
    # Optional: If it's a direct skill exchange (User A teaches X, User B teaches Y)
    skill_to_learn = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, related_name='requests_to_learn')
    skill_to_teach = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_to_teach')
    
    session_length = models.IntegerField(help_text="Duration in minutes", default=60)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.requester.username} to {self.partner.username}"

# 6. LearningSession
class LearningSession(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
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
    
    # Ratings/Feedback
    rating_by_student = models.IntegerField(null=True, blank=True)
    rating_by_teacher = models.IntegerField(null=True, blank=True)
    feedback_by_student = models.TextField(blank=True)
    feedback_by_teacher = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session: {self.skill.name} ({self.scheduled_time})"
