import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message
from django.contrib.auth import get_user_model

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
            
            if message_content:
                user = self.scope['user']
                # Save to DB
                saved_message, reply_to_data = await self.save_message(self.room_name, user, message_content, reply_to_id)
                
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
                            'sender': user.username,
                            'sender_id': user.id,
                            'timestamp': str(saved_message.timestamp),
                            'reply_to_data': reply_to_data
                        }
                    )
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
        elif message_type in ['video_offer', 'video_answer', 'new_ice_candidate']:
            # Forward signaling messages to the group
            # We add sender_id to avoid sending back to self in frontend
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_message',
                    'signal_type': message_type,
                    'data': text_data_json.get('data'),
                    'sender_id': self.scope['user'].id
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'room_id': event.get('room_id'),
            'id': event.get('id'),
            'message': event['message'],
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

    @database_sync_to_async
    def is_participant(self, room_id, user):
        try:
            conversation = Conversation.objects.get(id=room_id)
            return conversation.participants.filter(id=user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, room_id, user, content, reply_to_id=None):
        conversation = Conversation.objects.get(id=room_id)
        reply_to_msg = None
        reply_to_data = None
        
        if reply_to_id:
            reply_to_msg = Message.objects.filter(id=reply_to_id).first()
            if reply_to_msg:
                # Prevent replying to an unsent message
                if reply_to_msg.is_deleted:
                    reply_to_msg = None
                    reply_to_data = None
                else:
                    reply_to_data = {
                        "id": reply_to_msg.id,
                        "text": reply_to_msg.content,
                        "sender": reply_to_msg.sender.username
                    }

        msg = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=content,
            reply_to=reply_to_msg
        )
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
