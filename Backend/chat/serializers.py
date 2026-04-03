from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    
    reply_to = serializers.PrimaryKeyRelatedField(queryset=Message.objects.all(), required=False, allow_null=True)
    reply_to_data = serializers.SerializerMethodField()
    reactions = serializers.JSONField(read_only=True)
    is_removed_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_avatar', 'content', 'image', 'audio', 'message_type', 'call_duration', 'timestamp', 'is_read', 'reply_to', 'reply_to_data', 'reactions', 'is_deleted', 'is_removed_by_me']
        read_only_fields = ['sender', 'timestamp', 'is_read', 'reactions', 'is_deleted']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_deleted:
            data['content'] = "Message unsent"
        elif instance.message_type == 'video_call':
            data['content'] = f"Video Call ({instance.call_duration}s)" if instance.call_duration else "Video Call"
        return data

    def get_is_removed_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.removed_by.filter(id=request.user.id).exists()
        return False

    def get_reply_to_data(self, obj):
        if obj.reply_to:
            text = obj.reply_to.content
            if obj.reply_to.is_deleted:
                text = "Message unsent"
            return {
                "id": obj.reply_to.id,
                "text": text,
                "sender": obj.reply_to.sender.username
            }
        return None

    def get_sender_avatar(self, obj):
        if hasattr(obj.sender, 'profile') and obj.sender.profile.profile_image:
             request = self.context.get('request')
             if request:
                 return request.build_absolute_uri(obj.sender.profile.profile_image.url)
             return obj.sender.profile.profile_image.url
        return None

class ConversationSerializer(serializers.ModelSerializer):
    partner_id = serializers.SerializerMethodField()
    partner_name = serializers.SerializerMethodField()
    partner_avatar = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'partner_id', 'partner_name', 'partner_avatar', 'last_message', 'unread_count', 'updated_at']

    def get_partner_id(self, obj):
        partner = self.get_partner(obj)
        return partner.id if partner else None

    def get_partner(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        return obj.participants.exclude(id=request.user.id).first()

    def get_partner_name(self, obj):
        partner = self.get_partner(obj)
        return partner.username if partner else "Unknown"

    def get_partner_avatar(self, obj):
        partner = self.get_partner(obj)
        if partner and hasattr(partner, 'profile') and partner.profile.profile_image:
             # Build absolute URL if needed, or just return .url
             request = self.context.get('request')
             if request:
                 return request.build_absolute_uri(partner.profile.profile_image.url)
             return partner.profile.profile_image.url
        return None

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-timestamp').last() # Actually order by -timestamp and first() is latest
        # Wait, the previous code had .first() which is correct for latest if ordered by -timestamp
        # But wait, looking at the code I see:
        # msg = obj.messages.order_by('-timestamp').first()
        # That is correct.
        
        msg = obj.messages.all().order_by('-timestamp').first()
        if msg:
            if msg.is_deleted:
                return "Message unsent"
            if msg.message_type == 'video_call':
                if msg.call_duration:
                    mins = msg.call_duration // 60
                    secs = msg.call_duration % 60
                    return f"Video Call ({mins}:{secs:02d})"
                return "Missed Video Call"
            if msg.content:
                return msg.content
            if msg.image:
                return "Sent a photo"
            if msg.audio:
                return "Sent a voice message"
        return ""

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
