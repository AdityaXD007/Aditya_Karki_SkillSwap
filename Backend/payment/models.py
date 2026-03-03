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

    session = models.ForeignKey(LearningSession, on_delete=models.CASCADE, related_name='transactions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    pidx = models.CharField(max_length=100, unique=True, null=True, blank=True)
    khalti_transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    khalti_purchase_order_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tx: {self.khalti_purchase_order_id} - {self.status}"
