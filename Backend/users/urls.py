from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserProfileViewSet, ContactMessageViewSet, FeedbackMessageViewSet, VerifyEmailView, ResendVerificationView

router = DefaultRouter()
router.register('auth', AuthViewSet, basename='auth')
router.register('profiles', UserProfileViewSet, basename='profiles')
router.register('contact', ContactMessageViewSet, basename='contact')
router.register('feedback', FeedbackMessageViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
    path('verify/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
]
