from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.profile.profile_image', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_username', 'sender_avatar', 
            'notification_type', 'title', 'content', 'link', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']
