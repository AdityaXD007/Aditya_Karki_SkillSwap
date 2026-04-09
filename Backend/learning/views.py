from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SessionRequest, LearningSession
from .serializers import SessionRequestSerializer, LearningSessionSerializer
from django.db.models import Q, Avg
from django.utils import timezone
from utils.email_sender import send_skillswap_email
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
        instance = serializer.save(requester=self.request.user)
        # Trigger 3: SKILL SWAP REQUEST RECEIVED
        send_skillswap_email(
            user=instance.partner,
            subject=f"New Skill Swap Request from @{instance.requester.username}",
            template_name="swap_request_received.html",
            context={
                'requester_username': instance.requester.username,
                'skill_offered': instance.skill_to_teach.name if instance.skill_to_teach else "Unspecified",
                'skill_wanted': instance.skill_to_learn.name,
            }
        )

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

        # 2. Determine scheduled time
        # Priority: explicit scheduled_time from teacher > student's proposed_time > default (tomorrow)
        scheduled_time_str = request.data.get('scheduled_time')
        if scheduled_time_str:
            from django.utils.dateparse import parse_datetime
            scheduled_time = parse_datetime(scheduled_time_str)
            if not scheduled_time:
                scheduled_time = timezone.now() + timezone.timedelta(days=1)
        elif session_request.proposed_time:
            scheduled_time = session_request.proposed_time
        else:
            scheduled_time = timezone.now() + timezone.timedelta(days=1)

        # 3. Create Learning Session
        # Check if teacher has taught 5+ sessions; if not, mark it as free session
        teacher_profile = session_request.partner.profile
        is_free_session = not teacher_profile.can_charge
        
        # Calculate price if not free
        total_price = 0
        if not is_free_session:
            # (Duration in min / 60) * Hourly Rate * 1.10 (Fee)
            base_rate = float(teacher_profile.hourly_rate)
            duration_hours = session_request.session_length / 60.0
            total_price = duration_hours * base_rate * 1.10 
            print(f"Calculated session price: {total_price} for {session_request.session_length} min at {base_rate}/hr + 10% fee")

        session = LearningSession.objects.create(
            request=session_request,
            student=session_request.requester,
            teacher=session_request.partner,
            skill=session_request.skill_to_learn,
            duration=session_request.session_length,
            scheduled_time=scheduled_time,
            status='SCHEDULED',
            is_paid=is_free_session,
            is_free=is_free_session,
            total_price=total_price
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

        # Trigger 4: SWAP REQUEST ACCEPTED
        send_skillswap_email(
            user=session_request.requester,
            subject=f"Swap Request Accepted by @{session_request.partner.username}!",
            template_name="swap_request_responded.html",
            context={
                'responder_username': session_request.partner.username,
                'skill_topic': session_request.skill_to_learn.name,
                'outcome': 'Accepted'
            }
        )

        # Trigger 1: SESSION BOOKING CONFIRMED (To both)
        # To Requester (Student)
        send_skillswap_email(
            user=session.student,
            subject="Session Booking Confirmed!",
            template_name="session_confirmed.html",
            context={
                'other_username': session.teacher.username,
                'session_time': session.scheduled_time,
                'skill_topic': session.skill.name
            }
        )
        # To Partner (Teacher)
        send_skillswap_email(
            user=session.teacher,
            subject="New Session Booked with You!",
            template_name="session_confirmed.html",
            context={
                'other_username': session.student.username,
                'session_time': session.scheduled_time,
                'skill_topic': session.skill.name
            }
        )

        return Response({'status': 'Request accepted, session created'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        session_request = self.get_object()
        if session_request.partner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        session_request.status = 'REJECTED'
        session_request.save()

        # Trigger 4: SWAP REQUEST REJECTED
        send_skillswap_email(
            user=session_request.requester,
            subject=f"Update on your Swap Request to @{session_request.partner.username}",
            template_name="swap_request_responded.html",
            context={
                'responder_username': session_request.partner.username,
                'skill_topic': session_request.skill_to_learn.name,
                'outcome': 'Rejected'
            }
        )

        return Response({'status': 'Request rejected'})

    @action(detail=True, methods=['patch'])
    def withdraw(self, request, pk=None):
        """
        Withdraw a sent request. Only available for the requester and when status is PENDING.
        """
        session_request = self.get_object()
        
        # Verify requesting user is the original requester
        if session_request.requester != request.user:
            return Response({'error': 'Not authorized to withdraw this request'}, status=status.HTTP_403_FORBIDDEN)
        
        # Only pending sessions (requests) can be withdrawn
        if session_request.status != 'PENDING':
            return Response({'error': 'Only pending requests can be withdrawn'}, status=status.HTTP_400_BAD_REQUEST)
        
        session_request.status = 'WITHDRAWN'
        session_request.save()
        return Response({'status': 'Request withdrawn'}, status=status.HTTP_200_OK)

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

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Trigger 2: SESSION CANCELLED"""
        session = self.get_object()
        if session.status == 'CANCELLED':
            return Response({'error': 'Session already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        session.status = 'CANCELLED'
        reason = request.data.get('reason', 'No reason provided')
        session.notes = f"Cancelled by {request.user.username}. Reason: {reason}"
        session.save()

        # Send email to the OTHER party
        other_user = session.teacher if session.student == request.user else session.student
        send_skillswap_email(
            user=other_user,
            subject=f"Session Cancelled by @{request.user.username}",
            template_name="session_change.html",
            context={
                'changer_username': request.user.username,
                'action_type': 'Cancelled',
                'skill_topic': session.skill.name,
                'session_time': session.scheduled_time,
                'reason': reason
            }
        )

        return Response({'status': 'Session cancelled'})

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Phase 1: Propose a Reschedule"""
        session = self.get_object()
        new_time_str = request.data.get('new_time')
        reason = request.data.get('reason', 'No reason provided')
        
        if not new_time_str:
            return Response({'error': 'New time is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from django.utils.dateparse import parse_datetime
            new_time = parse_datetime(new_time_str)
            if not new_time:
                raise ValueError("Invalid format")
        except Exception:
            return Response({'error': 'Invalid datetime format'}, status=status.HTTP_400_BAD_REQUEST)

        # Save the request rather than updating the time immediately
        session.reschedule_requested_time = new_time
        session.reschedule_reason = reason
        session.reschedule_requested_by = request.user
        session.save()

        # Send email to the OTHER party to inform them they have a request to review
        other_user = session.teacher if session.student == request.user else session.student
        send_skillswap_email(
            user=other_user,
            subject=f"Reschedule Request from @{request.user.username}",
            template_name="session_change.html",
            context={
                'changer_username': request.user.username,
                'action_type': 'Requested a Reschedule',
                'skill_topic': session.skill.name,
                'session_time': new_time,
                'reason': f"Wants to reschedule the session. Reason: {reason}. Please go to your bookings to accept or reject."
            }
        )

        return Response({'status': 'Reschedule request sent', 'requested_time': session.reschedule_requested_time})

    @action(detail=True, methods=['post'])
    def accept_reschedule(self, request, pk=None):
        """Phase 2: Finalize Reschedule"""
        session = self.get_object()
        
        if not session.reschedule_requested_time:
            return Response({'error': 'No pending reschedule request found'}, status=status.HTTP_400_BAD_REQUEST)
        
        if session.reschedule_requested_by == request.user:
            return Response({'error': 'You cannot accept your own reschedule request'}, status=status.HTTP_400_BAD_REQUEST)

        old_time = session.scheduled_time
        new_time = session.reschedule_requested_time
        
        # Finalize the move
        session.scheduled_time = new_time
        session.notes += f"\nRescheduled to {new_time} from {old_time}. Request by {session.reschedule_requested_by.username} accepted by {request.user.username}."
        
        # Clear request fields
        session.reschedule_requested_time = None
        session.reschedule_reason = ""
        session.reschedule_requested_by = None
        session.save()

        # Notify both parties
        for user in [session.teacher, session.student]:
            send_skillswap_email(
                user=user,
                subject="Session Reschedule Confirmed!",
                template_name="session_change.html",
                context={
                    'changer_username': request.user.username,
                    'action_type': 'Reschedule Confirmed',
                    'skill_topic': session.skill.name,
                    'session_time': session.scheduled_time,
                    'reason': f"The reschedule from {old_time.strftime('%b %d, %H:%M %p')} has been accepted."
                }
            )

        return Response({'status': 'Reschedule accepted', 'new_time': session.scheduled_time})

    @action(detail=True, methods=['post'])
    def reject_reschedule(self, request, pk=None):
        """Phase 2: Reject Reschedule Request"""
        session = self.get_object()
        
        if not session.reschedule_requested_time:
            return Response({'error': 'No pending reschedule request found'}, status=status.HTTP_400_BAD_REQUEST)
        
        if session.reschedule_requested_by == request.user:
            return Response({'error': 'You cannot reject your own reschedule request'}, status=status.HTTP_400_BAD_REQUEST)

        requester = session.reschedule_requested_by
        requested_time = session.reschedule_requested_time

        # Clear request fields
        session.reschedule_requested_time = None
        session.reschedule_reason = ""
        session.reschedule_requested_by = None
        session.save()

        # Notify the requester
        send_skillswap_email(
            user=requester,
            subject="Reschedule Request Rejected",
            template_name="session_change.html",
            context={
                'changer_username': request.user.username,
                'action_type': 'Reschedule Rejected',
                'skill_topic': session.skill.name,
                'session_time': session.scheduled_time, # Keep original time
                'reason': f"The request to move the session to {requested_time.strftime('%b %d, %H:%M %p')} was rejected by @{request.user.username}."
            }
        )

        return Response({'status': 'Reschedule request rejected'})

    # Add actions for cancelling, adding feedback etc.
    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        session = self.get_object()
        if session.teacher != request.user:
            return Response({'error': 'Only the teacher can start the session'}, status=status.HTTP_403_FORBIDDEN)
        
        if session.status != 'SCHEDULED':
            return Response({'error': f'Cannot start session with status {session.status}'}, status=status.HTTP_400_BAD_REQUEST)

        if not session.is_paid:
            return Response({'error': 'Session cannot be started until student has paid the fee'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent starting a new session if the user already has an ongoing one
        existing_ongoing = LearningSession.objects.filter(
            Q(teacher=request.user) | Q(student=request.user),
            status='ONGOING'
        ).exclude(pk=session.pk).exists()
        if existing_ongoing:
            return Response({'error': 'You already have an active session in progress. Please end it before starting a new one.'}, status=status.HTTP_400_BAD_REQUEST)

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

        # Update teacher's taught count
        teacher_profile = session.teacher.profile
        teacher_profile.sessions_taught_count += 1
        teacher_profile.save()

        # Update student's learned count
        student_profile = session.student.profile
        student_profile.sessions_learned_count += 1
        student_profile.save()

        # Broadcast session ended via WebSocket
        try:
            from chat.models import Conversation
            conversation = Conversation.objects.filter(participants=session.student).filter(participants=session.teacher).first()
            if conversation:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'chat_{conversation.id}',
                    {
                        'type': 'signal_message',
                        'signal_type': 'session_ended',
                        'data': {'session_id': session.id},
                        'sender_id': request.user.id
                    }
                )
        except Exception as e:
            print(f"Error broadcasting session end: {e}")

        return Response({'status': 'Session completed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def admin_confirm_session(self, request, pk=None):
        """
        Action for admin to confirm session completion and trigger payout.
        In a real app, this should be restricted to admin/staff.
        """
        if not request.user.is_staff:
            return Response({'error': 'Only admins can confirm session completion'}, status=status.HTTP_403_FORBIDDEN)
            
        session = self.get_object()
        if session.status != 'COMPLETED':
            return Response({'error': 'Only completed sessions can be confirmed'}, status=status.HTTP_400_BAD_REQUEST)
        
        session.admin_confirmed = True
        session.save()
        
        # Here you would trigger the actual payout logic to the teacher
        # For now, we just mark it as confirmed
        
        return Response({'status': 'Session confirmed by admin, payment released to teacher'})

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

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        """Submit rating and feedback for a completed session."""
        session = self.get_object()

        if session.status != 'COMPLETED':
            return Response({'error': 'Feedback can only be submitted for completed sessions'}, status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        feedback = request.data.get('feedback', '')
        submitted_by = request.data.get('submitted_by')

        # Validate rating
        if rating is None:
            return Response({'error': 'Rating is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'error': 'Rating must be an integer between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate submitted_by
        if submitted_by not in ('student', 'teacher'):
            return Response({'error': 'submitted_by must be "student" or "teacher"'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the user matches the role they claim
        if submitted_by == 'student' and session.student != request.user:
            return Response({'error': 'You are not the student of this session'}, status=status.HTTP_403_FORBIDDEN)
        if submitted_by == 'teacher' and session.teacher != request.user:
            return Response({'error': 'You are not the teacher of this session'}, status=status.HTTP_403_FORBIDDEN)

        # Check for duplicate feedback
        if submitted_by == 'student' and session.rating_by_student is not None:
            return Response({'error': 'You have already rated this session'}, status=status.HTTP_400_BAD_REQUEST)
        if submitted_by == 'teacher' and session.rating_by_teacher is not None:
            return Response({'error': 'You have already rated this session'}, status=status.HTTP_400_BAD_REQUEST)

        # Save feedback
        if submitted_by == 'student':
            session.rating_by_student = rating
            session.feedback_by_student = feedback
        else:
            session.rating_by_teacher = rating
            session.feedback_by_teacher = feedback

        session.save()

        # Recalculate teacher's average rating from all student ratings
        teacher_profile = session.teacher.profile
        avg = LearningSession.objects.filter(
            teacher=session.teacher,
            status='COMPLETED',
            rating_by_student__isnull=False
        ).aggregate(avg_rating=Avg('rating_by_student'))

        teacher_profile.rating = avg['avg_rating'] or 0.0
        teacher_profile.save()

        return Response({
            'status': 'Feedback submitted successfully',
            'average_rating': teacher_profile.rating
        })
