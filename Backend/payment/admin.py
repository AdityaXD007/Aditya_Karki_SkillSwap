from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('payment_method', 'order_id', 'session', 'student', 'amount', 'status', 'created_at')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('order_id', 'khalti_transaction_id', 'stripe_session_id', 'student__username')
    readonly_fields = ('created_at', 'updated_at')
