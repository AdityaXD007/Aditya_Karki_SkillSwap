from django.contrib import admin
from .models import Skill, UserSkill

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'icon_class', 'color_class', 'created_at']
    list_filter = ['category']
    search_fields = ['name', 'category']
    ordering = ['category', 'name']

@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ['user', 'skill', 'skill_type', 'proficiency_level', 'status']
    list_filter = ['skill_type', 'proficiency_level', 'status']
    search_fields = ['user__username', 'skill__name']