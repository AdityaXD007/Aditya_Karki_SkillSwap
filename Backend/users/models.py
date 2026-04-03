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
    email_notifications_enabled = models.BooleanField(default=True)
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
