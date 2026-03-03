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

        purchase_order_id = str(uuid.uuid4())
        
        # In a real app, amount should be derived from the skill/teacher's rate
        # For now, we accept it from frontend or set a default
        if not amount:
            amount = 1000 # Default 10 NPR (1000 Paisa)

        # Create initiated transaction
        transaction = Transaction.objects.create(
            session=session,
            student=request.user,
            amount=amount/100, # Store in NPR
            khalti_purchase_order_id=purchase_order_id,
            status='INITIATED'
        )

        payload = {
            "return_url": request.data.get('return_url', "http://localhost:5173/payment-callback"),
            "website_url": "http://localhost:5173",
            "amount": int(amount),
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
                return Response(khalti_data)
            else:
                transaction.status = 'FAILED'
                transaction.save()
                return Response(khalti_data, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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
            response = requests.post(f'{settings.KHALTI_API_URL}/epayment/lookup/', json={'pidx': pidx}, headers=headers)
            data = response.json()

            if data.get('status') == 'Completed':
                # Find the transaction
                purchase_order_id = data.get('purchase_order_id')
                try:
                    transaction = Transaction.objects.get(khalti_purchase_order_id=purchase_order_id)
                    transaction.status = 'COMPLETED'
                    transaction.khalti_transaction_id = data.get('transaction_id')
                    transaction.save()

                    # Mark session as paid
                    session = transaction.session
                    session.is_paid = True
                    session.save()

                    return Response({'status': 'Payment verified and session unlocked'})
                except Transaction.DoesNotExist:
                    return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Payment not completed', 'khalti_status': data.get('status')}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)