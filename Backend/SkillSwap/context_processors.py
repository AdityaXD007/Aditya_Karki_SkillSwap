from django.contrib.auth.models import User
from users.models import UserProfile
from skills.models import Skill
from payment.models import Transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum
import json

def admin_dashboard_stats(request):
    if not request.path.startswith('/admin/'):
        return {}

    try:
        total_users = User.objects.count()
        total_skills = Skill.objects.count()
        total_transactions = Transaction.objects.count()
        total_revenue = Transaction.objects.filter(status='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or 0

        # Data for chart (registrations in last 7 days)
        last_7_days = []
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            count = User.objects.filter(date_joined__date=date).count()
            last_7_days.append({'date': date.strftime('%b %d'), 'count': count})
        
        last_7_days.reverse()

        # Skills categories data
        skill_categories = Skill.objects.values('category').annotate(count=Count('id')).order_by('-count')[:5]

        # Recent Users
        recent_users = User.objects.all().order_by('-date_joined')[:5]

        # Recent Transactions (Orders)
        recent_transactions = Transaction.objects.filter(status='COMPLETED').order_by('-created_at')[:5]

        return {
            'dashboard_stats': {
                'total_users': total_users,
                'total_skills': total_skills,
                'total_transactions': total_transactions,
                'total_revenue': total_revenue,
                'registration_chart': json.dumps(last_7_days),
                'skill_categories': json.dumps(list(skill_categories)),
                'recent_users': recent_users,
                'recent_transactions': recent_transactions,
            }
        }
    except Exception as e:
        return {'dashboard_error': str(e)}
