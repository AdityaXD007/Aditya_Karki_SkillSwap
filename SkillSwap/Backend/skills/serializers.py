from rest_framework import serializers
from .models import Skill, UserSkill
from users.serializers import UserProfileSerializer

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class UserSkillSerializer(serializers.ModelSerializer):
    skill_details = SkillSerializer(source='skill', read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), source='skill', write_only=True
    )
    
    class Meta:
        model = UserSkill
        fields = ['id', 'skill_id', 'skill_details', 'skill_type', 'proficiency_level', 'status', 'description', 'created_at']
        read_only_fields = ['id', 'created_at', 'status']

class MatchSerializer(serializers.ModelSerializer):
    teacher = UserProfileSerializer(source='user.profile', read_only=True)
    skill = SkillSerializer(read_only=True)
    
    class Meta:
        model = UserSkill
        fields = ['id', 'teacher', 'skill', 'proficiency_level', 'status', 'description']
