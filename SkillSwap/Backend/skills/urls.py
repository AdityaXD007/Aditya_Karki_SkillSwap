from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SkillViewSet, UserSkillViewSet, MatchViewSet

router = DefaultRouter()
router.register('skills', SkillViewSet, basename='skills')
router.register('user-skills', UserSkillViewSet, basename='user-skills')
router.register('matches', MatchViewSet, basename='matches')

urlpatterns = [
    path('', include(router.urls)),
]
