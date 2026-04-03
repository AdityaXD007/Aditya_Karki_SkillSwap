from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.contrib.auth.models import User

def send_skillswap_email(user, subject, template_name, context, force=False):
    """
    Sends an email to a user if they have enabled email notifications,
    or if the email is critical (force=True).
    """
    # Check if user has a profile and notifications are enabled (only if not forced)
    if not force:
        if not hasattr(user, 'profile') or not user.profile.email_notifications_enabled:
            return False
    
    if not user.email:
        return False

    context['user'] = user
    context['frontend_url'] = settings.FRONTEND_URL
    
    html_content = render_to_string(f'emails/{template_name}', context)
    text_content = strip_tags(html_content)
    
    email = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [user.email]
    )
    email.attach_alternative(html_content, "text/html")
    
    try:
        email.send()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
