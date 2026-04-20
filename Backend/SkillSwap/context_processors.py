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
        platform_earnings = float(total_revenue) * 0.10

        # Data for registration chart (registrations in last 7 days)
        registration_chart = []
        revenue_chart = []
        
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            # Reg count
            count = User.objects.filter(date_joined__date=date).count()
            registration_chart.append({'date': date.strftime('%b %d'), 'count': count})
            
            # Revenue count (10% of total completed on that day)
            daily_rev = Transaction.objects.filter(status='COMPLETED', created_at__date=date).aggregate(Sum('amount'))['amount__sum'] or 0
            revenue_chart.append({'date': date.strftime('%b %d'), 'amount': float(daily_rev) * 0.10})
        
        registration_chart.reverse()
        revenue_chart.reverse()

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
                'platform_earnings': platform_earnings,
                'registration_chart': json.dumps(registration_chart),
                'revenue_chart': json.dumps(revenue_chart),
                'skill_categories': json.dumps(list(skill_categories)),
                'recent_users': recent_users,
                'recent_transactions': recent_transactions,
            }
        }
    except Exception as e:
        return {'dashboard_error': str(e)}
