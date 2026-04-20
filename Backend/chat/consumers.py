import json
import time
from django.core.cache import cache
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation, Message
from django.contrib.auth import get_user_model
import base64
from django.core.files.base import ContentFile
import uuid

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        # Check authentication
        if self.scope['user'].is_anonymous:
            await self.close()
            return

        # Check if user is a participant
        is_participant = await self.is_participant(self.room_name, self.scope['user'])
        if not is_participant:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Join personal user group for cross-conversation notifications
        self.user_group_name = f"user_{self.scope['user'].id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Leave personal group
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            message_content = text_data_json.get('message')
            reply_to_id = text_data_json.get('reply_to_id')
            image_data = text_data_json.get('image') # Base64
            audio_data = text_data_json.get('audio') # Base64
            
            if message_content or image_data or audio_data:
                user = self.scope['user']
                # Save to DB
                saved_message, reply_to_data = await self.save_message(
                    self.room_name, user, message_content, reply_to_id, image_data, audio_data
                )
                
                # Send message to participants' personal groups
                participant_ids = await self.get_participant_ids(self.room_name)
                for pid in participant_ids:
                    await self.channel_layer.group_send(
                        f"user_{pid}",
                        {
                            'type': 'chat_message',
                            'room_id': int(self.room_name),
                            'id': saved_message.id,
                            'message': message_content,
                            'image': saved_message.image.url if saved_message.image else None,
                            'audio': saved_message.audio.url if saved_message.audio else None,
                            'sender': user.username,
                            'sender_id': user.id,
                            'timestamp': saved_message.timestamp.isoformat(),
                            'reply_to_data': reply_to_data
                        }
                    )
                    
                    # Trigger 5: NEW MESSAGE RECEIVED (Delayed/Away) - Disabled as requested
                    # if pid != user.id: # Only for the recipient
                    #     await self.handle_message_email_notification(pid, user.username, message_content or "Sent an attachment", self.room_name)
        elif message_type == 'add_reaction':
            message_id = text_data_json.get('message_id')
            reaction = text_data_json.get('reaction')
            
            if message_id and reaction:
                user = self.scope['user']
                # Update reactions in DB
                updated_reactions = await self.update_reactions(message_id, user, reaction)
                
                # Broad cast to group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'reaction_update',
                        'message_id': message_id,
                        'reactions': updated_reactions
                    }
                )
        elif message_type == 'unsend_message':
            message_id = text_data_json.get('message_id')
            if message_id:
                user = self.scope['user']
                success = await self.unsend_message_db(message_id, user)
                if success:
                    # Broadcast to participants' personal groups
                    participant_ids = await self.get_participant_ids(self.room_name)
                    for pid in participant_ids:
                        await self.channel_layer.group_send(
                            f"user_{pid}",
                            {
                                'type': 'message_unsent',
                                'room_id': int(self.room_name),
                                'message_id': message_id
                            }
                        )
        elif message_type == 'remove_message':
            message_id = text_data_json.get('message_id')
            if message_id:
                user = self.scope['user']
                await self.remove_message_db(message_id, user)
                # No need to broadcast as it is only for this user
                await self.send(text_data=json.dumps({
                    'type': 'message_removed_for_me',
                    'message_id': message_id
                }))
        elif message_type == 'mark_read':
            user = self.scope['user']
            # Mark all messages in this conversation as read for this user
            await self.mark_messages_as_read(self.room_name, user)
            
            # Optionally broadcast that messages were read (to update counters for other users if needed, 
            # but usually unread count is per-user based on sender)
            # Actually, we should tell the sender that their message was read.
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'messages_read',
                    'reader_id': user.id
                }
            )
        elif message_type in ['video_offer', 'video_answer', 'new_ice_candidate', 'end_call']:
            # Forward signaling messages to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_message',
                    'signal_type': message_type,
                    'data': text_data_json.get('data'),
                    'sender_id': self.scope['user'].id
                }
            )
            
            # Start timer if call is answered (Save start time to DB)
            if message_type == 'video_answer':
                await self.mark_call_as_started()

            # End timer and update message if call is ended
            if message_type == 'end_call':
                # Update the last call message in DB
                update_data = await self.update_last_call_message()
                # Broadcast final results in async context
                if update_data:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'call_log_update',
                            **update_data
                        }
                    )
            
            # Special case: Record call history on offer (Start of call)
            if message_type == 'video_offer':
                user = self.scope['user']
                # Save as a system-like message in DB
                saved_message, _ = await self.save_message(
                    self.room_name, user, "Video Call Started", message_type='video_call'
                )
                
                # Broad cast as a chat message so it appears immediately in history
                participant_ids = await self.get_participant_ids(self.room_name)
                for pid in participant_ids:
                    await self.channel_layer.group_send(
                        f"user_{pid}",
                        {
                            'type': 'chat_message',
                            'room_id': int(self.room_name),
                            'id': saved_message.id,
                            'message': "Video Call Started",
                            'message_type': 'video_call',
                            'sender': user.username,
                            'sender_id': user.id,
                            'timestamp': saved_message.timestamp.isoformat()
                        }
                    )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'room_id': event.get('room_id'),
            'id': event.get('id'),
            'message': event['message'],
            'message_type': event.get('message_type', 'text'),
            'call_duration': event.get('call_duration'),
            'image': event.get('image'),
            'audio': event.get('audio'),
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp'],
            'reply_to_data': event.get('reply_to_data')
        }))

    async def signal_message(self, event):
        # Send signaling message to WebSocket
        await self.send(text_data=json.dumps({
            'type': event['signal_type'],
            'data': event['data'],
            'sender_id': event['sender_id']
        }))

    async def reaction_update(self, event):
        # Send reaction update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'reaction_update',
            'message_id': event['message_id'],
            'reactions': event['reactions']
        }))

    async def message_unsent(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_unsent',
            'message_id': event['message_id']
        }))

    async def messages_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'reader_id': event['reader_id']
        }))

    async def handle_message_email_notification(self, recipient_id, sender_username, content, room_id):
        """Helper to check if email notification should be sent."""
        should_notify = await self.check_should_notify_away_user(recipient_id, room_id)
        if should_notify:
            await self.send_away_email(recipient_id, sender_username, content)

    @database_sync_to_async
    def check_should_notify_away_user(self, recipient_id, room_id):
        from users.models import UserProfile
        from django.utils import timezone
        
        try:
            recipient = User.objects.get(id=recipient_id)
            profile = recipient.profile
            
            # 1. Check if email notifications are enabled
            if not profile.email_notifications_enabled:
                return False
                
            # 2. Check if user has been active in the last 15 minutes
            is_active = profile.is_active_now
            if is_active:
                return False
                
            # 3. Check if this is the only unread message (first of the thread)
            unread_count = Message.objects.filter(
                conversation_id=room_id,
                is_read=False
            ).exclude(sender=recipient).count()
            
            # If count is 1, it means this was the first message in this thread while they were away
            return unread_count == 1
            
        except Exception:
            return False

    @database_sync_to_async
    def send_away_email(self, recipient_id, sender_username, content):
        from utils.email_sender import send_skillswap_email
        recipient = User.objects.get(id=recipient_id)
        preview = (content[:100] + '...') if len(content) > 100 else content
        send_skillswap_email(
            user=recipient,
            subject=f"New Message from @{sender_username}",
            template_name="new_message.html",
            context={
                'sender_username': sender_username,
                'message_preview': preview
            }
        )

    @database_sync_to_async
    def is_participant(self, room_id, user):
        try:
            conversation = Conversation.objects.get(id=room_id)
            return conversation.participants.filter(id=user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, room_id, user, content, reply_to_id=None, image_data=None, audio_data=None, message_type='text', call_duration=None):
        conversation = Conversation.objects.get(id=room_id)
        reply_to_msg = None
        reply_to_data = None
        
        if reply_to_id:
            reply_to_msg = Message.objects.filter(id=reply_to_id).first()
            if reply_to_msg:
                if not reply_to_msg.is_deleted:
                    reply_to_data = {
                        "id": reply_to_msg.id,
                        "text": reply_to_msg.content,
                        "sender": reply_to_msg.sender.username
                    }

        msg = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=content,
            reply_to=reply_to_msg,
            message_type=message_type,
            call_duration=call_duration
        )

        # Handle Image
        if image_data and ';base64,' in image_data:
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"{uuid.uuid4()}.{ext}"
            msg.image.save(file_name, ContentFile(base64.b64decode(imgstr)), save=False)

        # Handle Audio
        if audio_data and ';base64,' in audio_data:
            format, audstr = audio_data.split(';base64,')
            ext = format.split('/')[-1].split(';')[0] # handle mime types like audio/webm;codecs=opus
            if ext == 'octet-stream': ext = 'webm'
            file_name = f"{uuid.uuid4()}.{ext}"
            msg.audio.save(file_name, ContentFile(base64.b64decode(audstr)), save=False)

        msg.save()
        return msg, reply_to_data

    @database_sync_to_async
    def update_reactions(self, message_id, user, reaction):
        try:
            msg = Message.objects.get(id=message_id)
            if msg.is_deleted:
                return msg.reactions

            if not isinstance(msg.reactions, dict):
                msg.reactions = {}
            
            # If the same user reacts with the same emoji, remove it (toggle)
            if msg.reactions.get(user.username) == reaction:
                del msg.reactions[user.username]
            else:
                # Otherwise, set/replace their reaction
                msg.reactions[user.username] = reaction
                
            msg.save()
            return msg.reactions
        except Message.DoesNotExist:
            return {}

    @database_sync_to_async
    def unsend_message_db(self, message_id, user):
        try:
            msg = Message.objects.get(id=message_id, sender=user)
            msg.is_deleted = True
            msg.reactions = {} # Clear reactions
            msg.save()
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def remove_message_db(self, message_id, user):
        try:
            msg = Message.objects.get(id=message_id)
            msg.removed_by.add(user)
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_messages_as_read(self, room_id, user):
        Message.objects.filter(
            conversation_id=room_id,
            is_read=False
        ).exclude(sender=user).update(is_read=True)

    @database_sync_to_async
    def get_participant_ids(self, room_id):
        try:
            conversation = Conversation.objects.get(id=room_id)
            return list(conversation.participants.values_list('id', flat=True))
        except Conversation.DoesNotExist:
            return []

    @database_sync_to_async
    def mark_call_as_started(self):
        last_call_msg = Message.objects.filter(
            conversation_id=self.room_name, 
            message_type='video_call'
        ).order_by('-timestamp').first()
        
        if last_call_msg:
            last_call_msg.call_started_at = timezone.now()
            last_call_msg.save()

    @database_sync_to_async
    def update_last_call_message(self):
        last_call_msg = Message.objects.filter(
            conversation_id=self.room_name, 
            message_type='video_call'
        ).order_by('-timestamp').first()
        
        if last_call_msg:
            duration = 0
            if last_call_msg.call_started_at:
                now = timezone.now()
                duration = int((now - last_call_msg.call_started_at).total_seconds())
                last_call_msg.call_started_at = None # Reset
            
            last_call_msg.call_duration = duration
            if duration > 0:
                mins = duration // 60
                secs = duration % 60
                last_call_msg.content = f"Video Call - {mins:02d}:{secs:02d}"
            else:
                last_call_msg.content = "Missed Call"
            last_call_msg.save()

            return {
                'message_id': last_call_msg.id,
                'call_duration': duration,
                'status_text': last_call_msg.content
            }
        return None

    async def call_log_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_log_update',
            'message_id': event['message_id'],
            'call_duration': event['call_duration'],
            'status_text': event['status_text']
        }))
