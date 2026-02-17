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

        # 3. Create/Get Chat Conversation
        from chat.models import Conversation
        
        # Check if conversation already exists between these two users
        # Find conversations where both users are participants
        # We need to filter for conversations that have BOTH users
        # 1. Get conversations for requester
        requester_convs = Conversation.objects.filter(participants=session_request.requester)
        # 2. Filter those to find one that also has partner
        existing_conversations = requester_convs.filter(participants=session_request.partner)
        
        if not existing_conversations.exists():
            print(f"Creating new conversation between {session_request.requester} and {session_request.partner}")
            chat = Conversation.objects.create()
            chat.participants.add(session_request.requester, session_request.partner)
        else:
            print(f"Conversation already exists between {session_request.requester} and {session_request.partner}")

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
    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        session = self.get_object()
        if session.teacher != request.user:
            return Response({'error': 'Only the teacher can start the session'}, status=status.HTTP_403_FORBIDDEN)
        
        if session.status != 'SCHEDULED':
            return Response({'error': f'Cannot start session with status {session.status}'}, status=status.HTTP_400_BAD_REQUEST)

        session.status = 'ONGOING'
        session.actual_start_time = timezone.now()
        session.save()
        
        return Response({
            'status': 'Session started',
            'actual_start_time': session.actual_start_time,
            'duration': session.duration
        })

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        session = self.get_object()
        if session.teacher != request.user:
            return Response({'error': 'Only the teacher can end the session'}, status=status.HTTP_403_FORBIDDEN)

        if session.status != 'ONGOING':
            return Response({'error': 'Session is not ongoing'}, status=status.HTTP_400_BAD_REQUEST)

        session.status = 'COMPLETED'
        session.actual_end_time = timezone.now()
        session.save()

        return Response({'status': 'Session completed'})

    @action(detail=True, methods=['post'])
    def pause_session(self, request, pk=None):
        session = self.get_object()
        if session.teacher != request.user:
            return Response({'error': 'Only teacher can pause'}, status=status.HTTP_403_FORBIDDEN)
        
        if session.status != 'ONGOING' or session.is_paused:
            return Response({'error': 'Cannot pause this session'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate remaining seconds
        now = timezone.now()
        elapsed = (now - session.actual_start_time).total_seconds()
        total_duration = session.duration * 60
        remaining = max(0, total_duration - elapsed)

        session.is_paused = True
        session.paused_at = now
        session.remaining_duration_seconds = int(remaining)
        session.save()

        return Response({'status': 'Session paused', 'remaining': session.remaining_duration_seconds})

    @action(detail=True, methods=['post'])
    def resume_session(self, request, pk=None):
        session = self.get_object()
        if session.teacher != request.user:
            return Response({'error': 'Only teacher can resume'}, status=status.HTTP_403_FORBIDDEN)
        
        if not session.is_paused:
            return Response({'error': 'Session is not paused'}, status=status.HTTP_400_BAD_REQUEST)

        # Adjust actual_start_time so that (current_time - actual_start_time) = total - remaining
        # Basically: actual_start_time = current_time - (total - remaining)
        now = timezone.now()
        total_duration = session.duration * 60
        elapsed_needed = total_duration - session.remaining_duration_seconds
        session.actual_start_time = now - timezone.timedelta(seconds=elapsed_needed)
        
        session.is_paused = False
        session.paused_at = None
        session.save()

        return Response({'status': 'Session resumed', 'actual_start_time': session.actual_start_time})
