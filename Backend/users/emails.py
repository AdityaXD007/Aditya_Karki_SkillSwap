from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .tokens import generate_verification_token

def send_verification_email(user):
    token = generate_verification_token(user.id)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verification_link = f"{frontend_url}/verify-email?token={token}"

    subject = "Verify your SkillSwap account"
    
    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Welcome to SkillSwap, {user.first_name or user.username}!</h2>
            <p>Thank you for signing up. Please verify your email address to activate your account and start sharing skills.</p>
            <p style="margin: 20px 0;">
                <a href="{verification_link}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="{verification_link}">{verification_link}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <br>
            <p>Thanks,<br>The SkillSwap Team</p>
        </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@skillswap.com'),
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
