from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Decode the JWT token
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception as e:
        print(f"JWT Auth Error: {e}")
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token_key = query_params.get('token', [None])[0]

        if token_key:
            scope['user'] = await get_user(token_key)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
