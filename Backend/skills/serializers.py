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

class AggregatedMatchSerializer(serializers.Serializer):
    """
    Aggregates all teaching skills for a user into a single match object.
    Shows user once with all their skills.
    """
    id = serializers.IntegerField(source='user.id')
    teacher = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    availability = serializers.CharField(source='user.profile.availability')

    def get_teacher(self, obj):
        """Get teacher profile from the user"""
        return UserProfileSerializer(obj.user.profile).data

    def get_skills(self, obj):
        """Get all teaching skills for this user"""
        user_id = obj.user.id
        teaching_skills = UserSkill.objects.filter(
            user_id=user_id,
            skill_type='TEACH',
            status='ACTIVE'
        )
        return [{
            'id': us.skill.id,
            'name': us.skill.name,
            'proficiency_level': us.proficiency_level,
            'category': us.skill.category,
            'icon_class': us.skill.icon_class,
            'color_class': us.skill.color_class,
            'description': us.description,
        } for us in teaching_skills]
