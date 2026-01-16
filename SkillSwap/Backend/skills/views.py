from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Skill, UserSkill
from .serializers import SkillSerializer, UserSkillSerializer, MatchSerializer
from django.db import models

class SkillViewSet(viewsets.ModelViewSet):
    """
    Handle operational CRUD for Skills.
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class UserSkillViewSet(viewsets.ModelViewSet):
    """
    Handle User's personal skills (Teaching/Learning).
    """
    serializer_class = UserSkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only skills belonging to the current user
        return UserSkill.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the current user
        serializer.save(user=self.request.user)

class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Find matches: Users who can teach what you want to learn.
    """
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Base queryset: Active Teaching entries (excluding own)
        return UserSkill.objects.filter(
            skill_type='TEACH', 
            status='ACTIVE'
        ).exclude(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by specific skill_id if provided
        skill_id = request.query_params.get('skill_id')
        if skill_id:
            queryset = queryset.filter(skill_id=skill_id)
            
        # Filter by search query (skill name or user name)
        search_query = request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(skill__name__icontains=search_query) |
                models.Q(user__profile__full_name__icontains=search_query)
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get recommended teachers based on skills the current user wants to LEARN.
        """
        # 1. Get IDs of skills the current user is 'LEARNING'
        learning_skill_ids = UserSkill.objects.filter(
            user=request.user,
            skill_type='LEARN',
            status='ACTIVE'
        ).values_list('skill_id', flat=True)

        # 2. Find teachers for these skills
        queryset = self.get_queryset().filter(skill_id__in=learning_skill_ids)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
