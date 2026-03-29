from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, UserProfileSerializer
from .models import UserProfile

class AuthViewSet(viewsets.ViewSet):
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
