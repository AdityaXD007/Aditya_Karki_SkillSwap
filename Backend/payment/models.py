from django.db import models
from django.contrib.auth.models import User
from learning.models import LearningSession

class Transaction(models.Model):
    STATUS_CHOICES = (
        ('INITIATED', 'Initiated'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('KHALTI', 'Khalti'),
        ('STRIPE', 'Stripe'),
    )

    session = models.ForeignKey(LearningSession, on_delete=models.CASCADE, related_name='transactions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, default='KHALTI')
    pidx = models.CharField(max_length=255, unique=True, null=True, blank=True)
    khalti_transaction_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    khalti_purchase_order_id = models.CharField(max_length=255, unique=True)
    stripe_session_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tx: {self.khalti_purchase_order_id} ({self.payment_method}) - {self.status}"
