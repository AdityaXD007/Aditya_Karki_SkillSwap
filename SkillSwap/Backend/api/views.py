from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user and return token"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Check if user exists (using email as username)
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'User with this email not found'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Authenticate using the username (which is the email)
            user = authenticate(username=user_obj.username, password=password)
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key
                })
            else:
                return Response({'error': 'Incorrect password'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['post'], authentication_classes=[TokenAuthentication], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user by deleting token"""
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'})

    @action(detail=False, methods=['get'], authentication_classes=[TokenAuthentication], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)