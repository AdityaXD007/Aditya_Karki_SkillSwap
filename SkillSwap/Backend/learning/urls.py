from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SessionRequestViewSet, LearningSessionViewSet

router = DefaultRouter()
router.register('requests', SessionRequestViewSet, basename='requests')
router.register('sessions', LearningSessionViewSet, basename='sessions')

urlpatterns = [
    path('', include(router.urls)),
]
