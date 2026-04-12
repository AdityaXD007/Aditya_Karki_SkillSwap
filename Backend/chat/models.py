from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} ({', '.join([u.username for u in self.participants.all()])})"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    audio = models.FileField(upload_to='chat_audio/', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    reactions = models.JSONField(default=dict, blank=True)
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('video_call', 'Video Call'),
    ]
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    call_duration = models.IntegerField(null=True, blank=True) # in seconds
    call_started_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    removed_by = models.ManyToManyField(User, related_name='removed_messages', blank=True)


    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender} at {self.timestamp}"

# Signals to update conversation timestamp
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Message)
def update_conversation_timestamp(sender, instance, **kwargs):
    # Use update_fields to only update updated_at and avoid triggering other signals if any
    # This also helps efficiency. Conversation auto_now updated_at will handle the rest.
    instance.conversation.save(update_fields=['updated_at'])
