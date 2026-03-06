from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Skill, UserSkill
from .serializers import SkillSerializer, UserSkillSerializer, MatchSerializer, AggregatedMatchSerializer
from django.db import models
from django.db.models import Avg, Count, Q

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
    Shows each user once with all their teaching skills.
    """
    serializer_class = AggregatedMatchSerializer
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

        # Group by user to get unique users with all their skills
        unique_matches = {}
        for user_skill in queryset:
            user_id = user_skill.user.id
            if user_id not in unique_matches:
                unique_matches[user_id] = user_skill
        
        # Convert to list for serialization
        grouped_queryset = list(unique_matches.values())
        serializer = self.get_serializer(grouped_queryset, many=True)
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
        
        # Group by user to get unique users
        unique_matches = {}
        for user_skill in queryset:
            user_id = user_skill.user.id
            if user_id not in unique_matches:
                unique_matches[user_id] = user_skill
        
        grouped_queryset = list(unique_matches.values())
        serializer = self.get_serializer(grouped_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='category-fallback')
    def category_fallback(self, request):
        """
        Level 2 Fallback: Get users who teach in specific categories.
        Level 0/Entry Check B Fallback: Get top teachers who share my skills (if no categories provided).
        """
        categories_str = request.query_params.get('categories', '')
        categories = [c.strip() for c in categories_str.split(',') if c.strip()]
        
        # Base queryset: Active teachers, excludes current user
        queryset = self.get_queryset()
        
        if not categories:
            # Entry Check B Fallback: User has teaching skills but nothing they want to learn
            # 1. Filter out users with 0 lessons taught
            queryset = queryset.filter(user__profile__sessions_taught_count__gt=0)
            
            # 2. Sort by lessons taught DESC, then rating DESC
            matches = queryset.annotate(
                taught_count=models.F('user__profile__sessions_taught_count'),
                avg_rating=Avg('user__learning_sessions_as_teacher__rating_by_student')
            ).order_by('-taught_count', '-avg_rating')
        else:
            # Level 2 Fallback: Matching by categories
            queryset = queryset.filter(skill__category__in=categories)
            
            # Sort by highest rating first, then most lessons taught (as per waterfall requirements)
            matches = queryset.annotate(
                avg_rating=Avg('user__learning_sessions_as_teacher__rating_by_student'),
                taught_count=models.F('user__profile__sessions_taught_count')
            ).order_by('-avg_rating', '-taught_count')

        # Limit to 10 unique users directly in the loop with a cap on the DB fetch
        unique_matches_data = []
        seen_users = set()
        
        for m in matches[:50]: # Fetch a reasonably large slice to ensure we find 10 unique users
            if m.user_id not in seen_users:
                unique_matches_data.append(m)
                seen_users.add(m.user_id)
            if len(unique_matches_data) >= 10:
                break
                
        serializer = self.get_serializer(unique_matches_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='top-teachers')
    def top_teachers(self, request):
        """
        Top Teachers: Filtered, sorted and capped at 10.
        """
        # Base queryset: Active teachers, excludes current user
        queryset = self.get_queryset()
        
        # 1. Filter out users with 0 lessons taught
        queryset = queryset.filter(user__profile__sessions_taught_count__gt=0)
        
        # 2. Sort by lessons taught DESC, then rating DESC
        matches = queryset.annotate(
            taught_count=models.F('user__profile__sessions_taught_count'),
            avg_rating=Avg('user__learning_sessions_as_teacher__rating_by_student')
        ).order_by('-taught_count', '-avg_rating')

        unique_matches_data = []
        seen_users = set()
        
        for m in matches[:50]:
            if m.user_id not in seen_users:
                unique_matches_data.append(m)
                seen_users.add(m.user_id)
            if len(unique_matches_data) >= 10:
                break
                
        serializer = self.get_serializer(unique_matches_data, many=True)
        return Response(serializer.data)
