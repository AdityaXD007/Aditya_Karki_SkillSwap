from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, UserProfileSerializer, ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from .models import UserProfile
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='github/callback')
    def github_callback(self, request):
        """Exchange GitHub code for token and return user tokens"""
        code = request.GET.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import requests as py_requests
            # 1. Exchange code for access token
            token_response = py_requests.post(
                'https://github.com/login/oauth/access_token',
                data={
                    'client_id': settings.GITHUB_CLIENT_ID,
                    'client_secret': settings.GITHUB_CLIENT_SECRET,
                    'code': code,
                },
                headers={'Accept': 'application/json'}
            )
            
            if token_response.status_code != 200:
                return Response({'error': 'Failed to get GitHub token'}, status=status.HTTP_400_BAD_REQUEST)
                
            access_token = token_response.json().get('access_token')
            if not access_token:
                return Response({'error': 'No access token in GitHub response'}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Get GitHub user profile
            user_response = py_requests.get(
                'https://api.github.com/user',
                headers={'Authorization': f'token {access_token}'}
            )
            github_user = user_response.json()
            
            # 3. Get User Email (GitHub might hide the email unless we ask specifically)
            email = github_user.get('email')
            if not email:
                emails_response = py_requests.get(
                    'https://api.github.com/user/emails',
                    headers={'Authorization': f'token {access_token}'}
                )
                emails = emails_response.json()
                primary_email = next((e['email'] for e in emails if e['primary']), emails[0]['email'])
                email = primary_email

            first_name = github_user.get('name', '').split(' ')[0] if github_user.get('name') else ''
            last_name = ' '.join(github_user.get('name', '').split(' ')[1:]) if github_user.get('name') and ' ' in github_user.get('name') else ''
            username = github_user.get('login', email.split('@')[0])

            # 4. Find or Create the user
            try:
                user = User.objects.get(email__iexact=email)
                created = False
            except User.DoesNotExist:
                # Ensure username is unique
                current_username = username
                counter = 1
                while User.objects.filter(username=current_username).exists():
                    current_username = f"{username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=current_username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                created = True

            if created:
                user.set_unusable_password()
                user.save()
                user.profile.full_name = github_user.get('name', username)
                user.profile.save()

            # 5. Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)
            
            # 6. Redirect back to frontend with tokens as query params
            # Note: In production, it's safer to use postMessage or a temporary page, 
            # but this is standard for dev
            from django.shortcuts import redirect
            redirect_url = f"{settings.FRONTEND_URL}/dashboard?token={access}&refresh={refresh}"
            return redirect(redirect_url)

        except Exception as e:
            print(f"GitHub Login Error: {str(e)}")
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

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """Request a password reset link"""
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email__iexact=email).first()
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
                
                subject = "SkillSwap: Password Reset Request"
                message = f"Hello {user.username},\n\nYou requested a password reset for your SkillSwap account. Click the link below to set a new password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email."
                
                try:
                    send_mail(
                        subject,
                        message,
                        settings.EMAIL_HOST_USER,
                        [email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error sending reset email: {e}")
                    return Response({'error': 'Error sending email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            # We return success even if user not found for security (prevent email guessing)
            return Response({'message': 'If an account exists with this email, a reset link has been sent.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """Complete the password reset using token and uid"""
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user and default_token_generator.check_token(user, serializer.validated_data['token']):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({'message': 'Password reset successful!'})
            else:
                return Response({'error': 'Invalid or expired reset link. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
