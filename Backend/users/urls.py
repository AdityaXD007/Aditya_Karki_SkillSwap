from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserProfileViewSet, ContactMessageViewSet, FeedbackMessageViewSet

router = DefaultRouter()
router.register('auth', AuthViewSet, basename='auth')
router.register('profiles', UserProfileViewSet, basename='profiles')
router.register('contact', ContactMessageViewSet, basename='contact')
router.register('feedback', FeedbackMessageViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
]
