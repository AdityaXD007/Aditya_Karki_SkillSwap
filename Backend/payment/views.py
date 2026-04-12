import requests
import uuid
from django.conf import settings
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Transaction
from learning.models import LearningSession
from .serializers import TransactionSerializer
from utils.email_sender import send_skillswap_email

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

class InitiatePaymentView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        payment_method = request.data.get('payment_method', 'KHALTI').upper()
        
        try:
            session = LearningSession.objects.get(id=session_id, student=request.user)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure teacher can charge (5+ sessions taught)
        if not session.teacher.profile.can_charge:
            print(f"Error: Teacher {session.teacher.username} cannot charge yet.")
            return Response({'error': 'This teacher is still in their free trail period (less than 5 sessions taught). No payment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure session is not already paid or free
        if session.is_paid or session.is_free:
            print(f"Error: Session {session_id} is already paid or free. is_paid={session.is_paid}, is_free={session.is_free}")
            return Response({'error': 'This session is already paid or marked as free.'}, status=status.HTTP_400_BAD_REQUEST)

        purchase_order_id = str(uuid.uuid4())
        amount_npr = float(session.total_price)

        if payment_method == 'KHALTI':
            # Khalti Logic
            paisa_amount = int(amount_npr * 100)
            transaction = Transaction.objects.create(
                session=session,
                student=request.user,
                amount=amount_npr,
                payment_method='KHALTI',
                order_id=purchase_order_id,
                khalti_purchase_order_id=purchase_order_id,
                status='INITIATED'
            )

            # Dynamic frontend URL for payment callbacks
            host = request.get_host()
            frontend_url = settings.FRONTEND_URL
            if 'devtunnels.ms' in host:
                frontend_url = 'https://' + host.replace('-8000', '-5173').replace(':8000', '')
            elif 'localhost' in host:
                frontend_url = 'http://localhost:5173'

            payload = {
                "return_url": request.data.get('return_url', f"{frontend_url}/payment-callback"),
                "website_url": frontend_url,
                "amount": paisa_amount,
                "purchase_order_id": purchase_order_id,
                "purchase_order_name": f"Session with {session.teacher.username}",
                "customer_info": {
                    "name": request.user.get_full_name() or request.user.username,
                    "email": request.user.email,
                }
            }

            headers = {
                'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
                'Content-Type': 'application/json',
            }

            try:
                url = f"{settings.KHALTI_API_URL.rstrip('/')}/epayment/initiate/"
                print(f"Initiating Khalti payment at {url}")
                response = requests.post(url, json=payload, headers=headers)
                khalti_data = response.json()

                if response.status_code == 200:
                    transaction.pidx = khalti_data.get('pidx')
                    transaction.save()
                    return Response({
                        'payment_url': khalti_data.get('payment_url'),
                        'pidx': khalti_data.get('pidx'),
                        'payment_method': 'KHALTI'
                    })
                else:
                    print(f"Khalti initiation failed: {khalti_data}")
                    transaction.status = 'FAILED'
                    # Store error in message field if possible, or just log
                    transaction.save()
                    return Response(khalti_data, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"Internal error initiating Khalti: {str(e)}")
                transaction.status = 'FAILED'
                transaction.save()
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif payment_method == 'STRIPE':
            # Stripe Logic
            try:
                amount_cents = int(amount_npr * 100)
                
                checkout_session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price_data': {
                            'currency': 'npr',
                            'product_data': {
                                'name': f"Session with {session.teacher.username}",
                            },
                            'unit_amount': amount_cents,
                        },
                        'quantity': 1,
                    }],
                    mode='payment',
                    # Dynamic frontend URL for Stripe callbacks
                    success_url=request.data.get('return_url', f"{frontend_url}/payment-callback") + "?session_id={CHECKOUT_SESSION_ID}",
                    cancel_url=f"{frontend_url}/messages",
                    client_reference_id=str(session.id),
                    customer_email=request.user.email,
                )

                transaction = Transaction.objects.create(
                    session=session,
                    student=request.user,
                    amount=amount_npr,
                    payment_method='STRIPE',
                    order_id=purchase_order_id,
                    stripe_session_id=checkout_session.id,
                    status='INITIATED'
                )

                return Response({
                    'payment_url': checkout_session.url,
                    'stripe_session_id': checkout_session.id,
                    'payment_method': 'STRIPE'
                })
            except Exception as e:
                print(f"Stripe setup error: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        else:
            return Response({'error': 'Invalid payment method'}, status=status.HTTP_400_BAD_REQUEST)

class VerifyPaymentView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pidx = request.data.get('pidx')
        stripe_session_id = request.data.get('session_id')
        
        if pidx:
            # Khalti Verification Logic
            headers = {
                'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
                'Content-Type': 'application/json',
            }

            try:
                url = f"{settings.KHALTI_API_URL.rstrip('/')}/epayment/lookup/"
                print(f"Verifying Khalti payment at {url} with pidx: {pidx}")
                response = requests.post(url, json={'pidx': pidx}, headers=headers)
                data = response.json()

                if data.get('status') == 'Completed':
                    try:
                        transaction = Transaction.objects.get(pidx=pidx)
                        transaction.status = 'COMPLETED'
                        # Capture Khalti's ID from multiple possible keys
                        transaction.khalti_transaction_id = (
                            data.get('transaction_id') or 
                            data.get('khalti_transaction_id') or 
                            data.get('id')
                        )
                        transaction.save()
                        
                        # Mark session as paid
                        session = transaction.session
                        session.is_paid = True
                        session.save()

                        # --- Notifications ---
                        # 1. To Student (Confirmation)
                        send_skillswap_email(
                            user=request.user,
                            subject="Payment Successful - SkillSwap",
                            template_name="payment_paid_student.html",
                            context={'session': session},
                            force=True
                        )
                        # 2. To Teacher (Notification)
                        send_skillswap_email(
                            user=session.teacher,
                            subject="Payment Received - SkillSwap",
                            template_name="payment_received_teacher.html",
                            context={'session': session},
                            force=True
                        )

                        return Response({'status': 'Payment verified and session unlocked', 'method': 'KHALTI'})
                    except Transaction.DoesNotExist:
                        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response({'error': 'Payment verification failed', 'khalti_error': data}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif stripe_session_id:
            # Stripe Verification Logic
            try:
                print(f"Verifying Stripe payment with session_id: {stripe_session_id}")
                checkout_session = stripe.checkout.Session.retrieve(stripe_session_id)
                
                if checkout_session.payment_status == 'paid':
                    try:
                        transaction = Transaction.objects.get(stripe_session_id=stripe_session_id)
                        transaction.status = 'COMPLETED'
                        transaction.stripe_payment_intent_id = checkout_session.payment_intent
                        transaction.save()

                        # Mark session as paid
                        session = transaction.session
                        session.is_paid = True
                        session.save()

                        # --- Notifications ---
                        # 1. To Student
                        send_skillswap_email(
                            user=request.user,
                            subject="Payment Successful - SkillSwap",
                            template_name="payment_paid_student.html",
                            context={'session': session},
                            force=True
                        )
                        # 2. To Teacher
                        send_skillswap_email(
                            user=session.teacher,
                            subject="Payment Received - SkillSwap",
                            template_name="payment_received_teacher.html",
                            context={'session': session},
                            force=True
                        )

                        return Response({'status': 'Payment verified and session unlocked', 'method': 'STRIPE'})
                    except Transaction.DoesNotExist:
                        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response({'error': 'Stripe payment not completed'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            return Response({'error': 'No verification identifier provided'}, status=status.HTTP_400_BAD_REQUEST)