from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': "Passwords don't match"})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': "User with this email already exists"})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': "This username is already taken"})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Save the full name to UserProfile
        user.profile.full_name = f"{first_name} {last_name}".strip()
        user.profile.save()
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    user_skills = serializers.SerializerMethodField()
    rating = serializers.FloatField(default=5.0, read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'full_name', 'profile_image', 'profile_image_url', 
                  'location', 'bio', 'languages', 'availability', 'user_skills', 'rating',
                  'sessions_taught_count', 'sessions_learned_count', 'can_charge', 'hourly_rate']
        read_only_fields = ['id', 'username', 'email', 'full_name', 'rating', 
                           'sessions_taught_count', 'sessions_learned_count', 'can_charge']
    
    def get_full_name(self, obj):
        # Return full_name from UserProfile if available, otherwise use Django User's first_name
        if obj.full_name and obj.full_name.strip():
            return obj.full_name
        return obj.user.first_name or obj.user.username
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_image.url)
        return None

    def get_user_skills(self, obj):
        from skills.models import UserSkill
        from skills.serializers import UserSkillSerializer
        skills = UserSkill.objects.filter(user=obj.user)
        return UserSkillSerializer(skills, many=True).data
