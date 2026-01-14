from django.db import models
from django.contrib.auth.models import User

# 3. Skill
class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    icon_class = models.CharField(max_length=100, blank=True, help_text="FontAwesome or other icon class")
    color_class = models.CharField(max_length=100, blank=True, help_text="CSS color class")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 4. UserSkill
class UserSkill(models.Model):
    SKILL_TYPES = (
        ('TEACH', 'Teaching'),
        ('LEARN', 'Learning'),
    )
    PROFICIENCY_CHOICES = (
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
        ('EXPERT', 'Expert'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='skill_users')
    skill_type = models.CharField(max_length=10, choices=SKILL_TYPES)
    proficiency_level = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='BEGINNER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    description = models.TextField(blank=True, help_text="E.g., teaching style, scheduling notes")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'skill', 'skill_type')

    def __str__(self):
        return f"{self.user.username} - {self.skill.name} ({self.skill_type})"
