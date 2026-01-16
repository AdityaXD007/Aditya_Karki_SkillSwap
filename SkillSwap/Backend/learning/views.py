from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SessionRequest, LearningSession
from .serializers import SessionRequestSerializer, LearningSessionSerializer
from django.db.models import Q
from django.utils import timezone

class SessionRequestViewSet(viewsets.ModelViewSet):
    """
    Manage session requests (Sent/Received).
    """
    serializer_class = SessionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can see requests they sent OR received
        return SessionRequest.objects.filter(
            Q(requester=self.request.user) | Q(partner=self.request.user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        session_request = self.get_object()
        
        if session_request.partner != request.user:
            return Response({'error': 'Not authorized to accept this request'}, status=status.HTTP_403_FORBIDDEN)
        
        if session_request.status != 'PENDING':
            return Response({'error': 'Request is not pending'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Update Request Status
        session_request.status = 'ACCEPTED'
        session_request.save()

        # 2. Create Learning Session
        # Default scheduling logic could go here, or handled separately
        # For now, we create a placeholder session (user needs to update time later)
        LearningSession.objects.create(
            request=session_request,
            student=session_request.requester,
            teacher=session_request.partner,
            skill=session_request.skill_to_learn,
            duration=session_request.session_length,
            scheduled_time=timezone.now() + timezone.timedelta(days=1), # Default: Tomorrow
            status='SCHEDULED'
        )

        return Response({'status': 'Request accepted, session created'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        session_request = self.get_object()
        if session_request.partner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        session_request.status = 'REJECTED'
        session_request.save()
        return Response({'status': 'Request rejected'})

class LearningSessionViewSet(viewsets.ModelViewSet):
    """
    Manage confirmed learning sessions.
    """
    serializer_class = LearningSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LearningSession.objects.filter(
            Q(student=self.request.user) | Q(teacher=self.request.user)
        ).order_by('scheduled_time')

    # Add actions for cancelling, adding feedback etc.
