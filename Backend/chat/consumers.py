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

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
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
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'id': saved_message.id,
                        'message': message_content,
                        'sender': user.username,
                        'sender_id': user.id,
                        'timestamp': str(saved_message.timestamp),
                        'reply_to_data': reply_to_data
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
