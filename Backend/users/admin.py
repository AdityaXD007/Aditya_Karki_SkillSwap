from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, ContactMessage, FeedbackMessage

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_sessions_taught')

    def get_sessions_taught(self, instance):
        return instance.profile.sessions_taught_count
    get_sessions_taught.short_description = 'Sessions Taught'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(UserProfile)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'full_name', 'email', 'created_at', 'is_resolved')
    list_filter = ('is_resolved', 'created_at')
    search_fields = ('subject', 'full_name', 'email', 'message')

@admin.register(FeedbackMessage)
class FeedbackMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'type', 'user', 'created_at', 'is_resolved')
    list_filter = ('type', 'is_resolved', 'created_at')
    search_fields = ('subject', 'message', 'user__username', 'user__email')
