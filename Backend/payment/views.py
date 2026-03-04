import requests
import uuid
from django.conf import settings
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Transaction
from learning.models import LearningSession
from .serializers import TransactionSerializer

class InitiatePaymentView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        amount = request.data.get('amount') # In Paisa for Khalti

        try:
            session = LearningSession.objects.get(id=session_id, student=request.user)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure teacher can charge (5+ sessions taught)
        if not session.teacher.profile.can_charge:
            return Response({'error': 'This teacher is still in their free trail period (less than 5 sessions taught). No payment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure session is not already paid or free
        if session.is_paid or session.is_free:
            return Response({'error': 'This session is already paid or marked as free.'}, status=status.HTTP_400_BAD_REQUEST)

        purchase_order_id = str(uuid.uuid4())
        
        # Use the stored total_price from the session (includes 10% fee)
        # Convert total_price from NPR to Paisa for Khalti
        paisa_amount = int(float(session.total_price) * 100)

        # Create initiated transaction
        transaction = Transaction.objects.create(
            session=session,
            student=request.user,
            amount=session.total_price, # Store in NPR
            khalti_purchase_order_id=purchase_order_id,
            status='INITIATED'
        )

        payload = {
            "return_url": request.data.get('return_url', "http://localhost:5173/payment-callback"),
            "website_url": "http://localhost:5173",
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
            response = requests.post(f'{settings.KHALTI_API_URL}/epayment/initiate/', json=payload, headers=headers)
            khalti_data = response.json()

            if response.status_code == 200:
                # Save the pidx to the transaction object
                print(f"Initiated payment, pidx received: {khalti_data.get('pidx')}")
                transaction.pidx = khalti_data.get('pidx')
                transaction.save()
                return Response(khalti_data)
            else:
                transaction.status = 'FAILED'
                transaction.save()
                return Response(khalti_data, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Exception during verification: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyPaymentView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pidx = request.data.get('pidx')
        
        headers = {
            'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json',
        }

        try:
            print(f"Verifying payment with pidx: {pidx}")
            response = requests.post(f'{settings.KHALTI_API_URL}/epayment/lookup/', json={'pidx': pidx}, headers=headers)
            data = response.json()
            print(f"Khalti lookup response: {data}")

            if data.get('status') == 'Completed':
                # Find the transaction using the pidx from our request
                try:
                    print(f"Looking for transaction with pidx: {pidx}")
                    transaction = Transaction.objects.get(pidx=pidx)
                    transaction.status = 'COMPLETED'
                    transaction.khalti_transaction_id = data.get('transaction_id')
                    transaction.save()

                    # Mark session as paid
                    session = transaction.session
                    session.is_paid = True
                    session.save()

                    return Response({'status': 'Payment verified and session unlocked'})
                except Transaction.DoesNotExist:
                    print(f"Failed to find transaction for pidx: {pidx}")
                    return Response({
                        'error': 'Transaction not found in our database.',
                        'pidx': pidx,
                        'khalti_full_data': data
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    'error': 'Payment verification failed', 
                    'khalti_error': data
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)