from django.contrib import admin
from .models import SessionRequest, LearningSession

@admin.register(SessionRequest)
class SessionRequestAdmin(admin.ModelAdmin):
    list_display = ('requester', 'partner', 'skill_to_learn', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(LearningSession)
class LearningSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'teacher', 'skill', 'status', 'is_paid', 'admin_confirmed', 'scheduled_time')
    list_filter = ('status', 'is_paid', 'admin_confirmed')
    search_fields = ('student__username', 'teacher__username', 'skill__name')
    actions = ['confirm_sessions']

    def confirm_sessions(self, request, queryset):
        queryset.update(admin_confirmed=True)
    confirm_sessions.short_description = "Confirm selected sessions for payment release"
