from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from django.utils import timezone
from .models import SessionRequest, LearningSession
from utils.email_sender import send_skillswap_email

@admin.register(SessionRequest)
class SessionRequestAdmin(admin.ModelAdmin):
    list_display = ('requester', 'partner', 'skill_to_learn', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('requester__username', 'partner__username', 'skill_to_learn__name')

@admin.register(LearningSession)
class LearningSessionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'student', 'teacher', 'skill', 'total_price', 
        'status_badge', 'payment_status', 'is_paid', 'payout_status', 'quick_approve', 'scheduled_time'
    )
    list_filter = ('status', 'is_paid', 'admin_confirmed', 'payout_completed', 'is_free')
    search_fields = ('student__username', 'teacher__username', 'skill__name')
    readonly_fields = ('created_at',)
    list_editable = ('is_paid',) # Allow manual marking as paid from list view
    
    actions = ['approve_payout', 'revert_payout']

    def status_badge(self, obj):
        colors = {
            'SCHEDULED': '#3b82f6', # blue
            'ONGOING': '#f59e0b',   # amber
            'COMPLETED': '#10b981', # emerald
            'CANCELLED': '#ef4444', # red
        }
        color = colors.get(obj.status, '#64748b')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = "Status"

    def payment_status(self, obj):
        if obj.is_free:
            return format_html('<span style="color: #64748b;">Free Session</span>')
        icon = "✅" if obj.is_paid else "❌"
        color = "green" if obj.is_paid else "red"
        return format_html('<b style="color: {};">{} {}</b>', color, icon, "Paid" if obj.is_paid else "Pending")
    payment_status.short_description = "Student Paid"

    def payout_status(self, obj):
        if obj.is_free:
            return "-"
        if obj.payout_completed:
            return format_html('<b style="color: #10b981;">💰 Payout Sent</b>')
        if obj.status == 'COMPLETED' and obj.is_paid:
            return format_html('<b style="color: #f59e0b; animation: pulse 2s infinite;">⏳ Ready for Approval</b>')
        return format_html('<span style="color: #94a3b8;">Not Ready</span>')
    payout_status.short_description = "Payout"

    def quick_approve(self, obj):
        if obj.status == 'COMPLETED' and obj.is_paid and not obj.payout_completed:
            # We use a trick to trigger the action via a custom URL or just a confirmation link
            # For this case, let's create a custom URL in get_urls
            from django.urls import reverse
            url = reverse('admin:approve-session-payout', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}" style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-decoration: none;">Approve Now</a>',
                url
            )
        return "-"
    quick_approve.short_description = "Quick Action"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:session_id>/approve-payout/', self.admin_site.admin_view(self.process_approve_payout), name='approve-session-payout'),
        ]
        return custom_urls + urls

    def process_approve_payout(self, request, session_id):
        session = self.get_object(request, session_id)
        if session:
            if session.status == 'COMPLETED' and session.is_paid:
                session.admin_confirmed = True
                session.payout_completed = True
                session.save()
                
                # --- Notification ---
                send_skillswap_email(
                    user=session.teacher,
                    subject="Funds Released - SkillSwap",
                    template_name="payout_released_teacher.html",
                    context={'session': session, 'now': timezone.now()},
                    force=True
                )
                
                self.message_user(request, f"Payout for session {session_id} has been approved and marked as sent.", messages.SUCCESS)
            else:
                self.message_user(request, "This session is not eligible for payout approval.", messages.ERROR)
        
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        return HttpResponseRedirect(reverse('admin:learning_learningsession_changelist'))

    def approve_payout(self, request, queryset):
        success_count = 0
        error_count = 0
        
        for session in queryset:
            if session.is_free:
                error_count += 1
                messages.warning(request, f"Session {session.id} is free and doesn't require payout approval.")
                continue
                
            if session.status != 'COMPLETED':
                error_count += 1
                messages.error(request, f"Session {session.id} cannot be approved: Status is '{session.status}', not 'COMPLETED'.")
                continue
                
            if not session.is_paid:
                error_count += 1
                messages.error(request, f"Session {session.id} cannot be approved: Student has not paid yet.")
                continue

            # Update session
            session.admin_confirmed = True
            session.payout_completed = True
            session.save()
            
            # --- Notification ---
            send_skillswap_email(
                user=session.teacher,
                subject="Funds Released - SkillSwap",
                template_name="payout_released_teacher.html",
                context={'session': session, 'now': timezone.now()},
                force=True
            )
            
            success_count += 1
            
        if success_count:
            self.message_user(request, f"Successfully approved payout for {success_count} sessions.", messages.SUCCESS)
        if error_count:
            self.message_user(request, f"Skipped {error_count} sessions due to validation errors.", messages.WARNING)
            
    approve_payout.short_description = "✅ Approve & Release Payout to Teacher"

    def revert_payout(self, request, queryset):
        queryset.update(admin_confirmed=False, payout_completed=False)
        self.message_user(request, f"Reverted payout status for {queryset.count()} sessions.")
    revert_payout.short_description = "🔄 Revert Payout Status (Admin Only)"
