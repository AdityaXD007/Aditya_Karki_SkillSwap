from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('khalti_purchase_order_id', 'session', 'student', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('khalti_purchase_order_id', 'khalti_transaction_id', 'student__username')
    readonly_fields = ('created_at', 'updated_at')
