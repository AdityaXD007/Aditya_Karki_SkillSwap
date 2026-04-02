from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, UserProfileSerializer, ChangePasswordSerializer
from .models import UserProfile

from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def google_login(self, request):
        """Handle Google OAuth login"""
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Verify the access token by calling Google's userinfo endpoint
            # We use the 'requests' library here
            import requests as py_requests
            userinfo_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}"
            response = py_requests.get(userinfo_url)
            
            if response.status_code != 200:
                return Response({'error': 'Invalid Google token or token expired'}, status=status.HTTP_400_BAD_REQUEST)
            
            idinfo = response.json()

            # 2. Extract user info
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
                
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            # Use email prefix as username if not exists, or generate unique
            base_username = email.split('@')[0]
            username = base_username
            
            # 3. Find or Create the user
            try:
                user = User.objects.get(email__iexact=email)
                created = False
            except User.DoesNotExist:
                # Ensure username is unique
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                created = True

            if created:
                # Set a random password for social login users
                user.set_unusable_password()
                user.save()
                
                # Also ensure profile name is set
                user.profile.full_name = f"{first_name} {last_name}".strip()
                user.profile.save()

            # 4. Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'is_new': created
            })

        except Exception as e:
            print(f"Google Login Error: {str(e)}")
            return Response({'error': f"Internal server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], authentication_classes=[JWTAuthentication], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Update user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            # SMTP feature: Notify user about password change
            try:
                subject = "Security Alert: Password Changed"
                message = f"Hello {user.username},\n\nYour SkillSwap account password was recently changed. If you did not perform this action, please contact support immediately."
                send_mail(
                    subject,
                    message,
                    None, # Uses DEFAULT_FROM_EMAIL
                    [user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error sending email: {e}")

            return Response({'message': 'Password updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'token': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user and return JWT tokens"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            try:
                user_obj = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return Response({'error': 'User with this email not found'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user = authenticate(username=user_obj.username, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': str(refresh.access_token),
                    'refresh': str(refresh)
                })
            else:
                return Response({'error': 'Incorrect password'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], authentication_classes=[JWTAuthentication], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user - JWT is stateless, so we just return success"""
        # If using blacklist, we would blacklist the token here
        return Response({'message': 'Logged out successfully'})

    @action(detail=False, methods=['get'], authentication_classes=[JWTAuthentication], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user__id'

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(profile, context={'request': request})
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='upload-image', permission_classes=[IsAuthenticated])
    def upload_image(self, request):
        """Upload profile image"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if 'profile_image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old image if exists
        if profile.profile_image:
            profile.profile_image.delete(save=False)
        
        profile.profile_image = request.FILES['profile_image']
        profile.save()
        
        serializer = self.get_serializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
