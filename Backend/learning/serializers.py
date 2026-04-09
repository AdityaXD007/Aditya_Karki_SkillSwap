from rest_framework import serializers
from .models import SessionRequest, LearningSession
from users.serializers import UserProfileSerializer
from skills.serializers import SkillSerializer

class SessionRequestSerializer(serializers.ModelSerializer):
    requester_details = UserProfileSerializer(source='requester.profile', read_only=True)
    partner_details = UserProfileSerializer(source='partner.profile', read_only=True)
    skill_learn_details = SkillSerializer(source='skill_to_learn', read_only=True)
    skill_teach_details = SkillSerializer(source='skill_to_teach', read_only=True)

    class Meta:
        model = SessionRequest
        fields = [
            'id', 'requester', 'partner', 'requester_details', 'partner_details',
            'skill_to_learn', 'skill_to_teach', 'skill_learn_details', 'skill_teach_details',
            'session_length', 'proposed_time', 'message', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'requester', 'status', 'created_at']
    
    def to_representation(self, instance):
        # Ensure profiles exist before serializing
        from users.models import UserProfile
        
        # Create profile for requester if it doesn't exist
        if not hasattr(instance.requester, 'profile'):
            UserProfile.objects.create(user=instance.requester)
        
        # Create profile for partner if it doesn't exist
        if not hasattr(instance.partner, 'profile'):
            UserProfile.objects.create(user=instance.partner)
        
        return super().to_representation(instance)

    def validate(self, data):
        # Prevent self-request
        if self.context['request'].user == data.get('partner'):
            raise serializers.ValidationError("You cannot send a request to yourself.")
        return data

class LearningSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.profile.full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.profile.full_name', read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)

    class Meta:
        model = LearningSession
        fields = '__all__'
        read_only_fields = ['id', 'student', 'teacher', 'skill', 'request', 'status', 'created_at']
