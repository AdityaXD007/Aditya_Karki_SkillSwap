from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserProfileViewSet

router = DefaultRouter()
router.register('auth', AuthViewSet, basename='auth')
router.register('profiles', UserProfileViewSet, basename='profiles')

urlpatterns = [
    path('', include(router.urls)),
]
