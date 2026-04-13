from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    languages = models.TextField(blank=True, help_text="Comma-separated list of languages")
    availability = models.TextField(blank=True, help_text="Comma-separated list of available times")
    sessions_taught_count = models.IntegerField(default=0)
    sessions_learned_count = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Hourly rate in NPR")
    rating = models.FloatField(default=0.0, help_text="Average teacher rating from student feedback")
    email_notifications_enabled = models.BooleanField(default=True)
    is_onboarded = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)

    @property
    def is_active_now(self):
        """Considered active if last_activity was within 15 minutes."""
        if not self.last_activity:
            return False
        from django.utils import timezone
        return (timezone.now() - self.last_activity).total_seconds() < 900

    @property
    def can_charge(self):
        return self.sessions_taught_count >= 5

    @property
    def experience_title(self):
        """Analyze user activity and ratings to assign a dynamic title."""
        taught = self.sessions_taught_count
        rating = self.rating or 0.0

        if taught == 0:
            return "Newcomer"
        if taught < 5:
            return "Rising Star" if rating >= 4.0 else "Novice Mentor"
        if taught < 20:
            return "SkillSwap Veteran" if rating >= 4.5 else "Experienced Tutor"
        if taught < 50:
            return "Expert Mentor" if rating >= 4.5 else "Senior Teacher"
        return "Master Teacher"

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class ContactMessage(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} from {self.email}"

class FeedbackMessage(models.Model):
    FEEDBACK_TYPES = (
        ('general', 'General'),
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('love', 'Praise'),
    )
    type = models.CharField(max_length=50, choices=FEEDBACK_TYPES, default='general')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"[{self.get_type_display()}] {self.subject}"
