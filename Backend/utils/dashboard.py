from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum
from users.models import UserProfile
from skills.models import Skill
from payment.models import Transaction
from learning.models import LearningSession
from django.db.models.functions import TruncMonth
import json

from django.contrib import admin

@staff_member_required
def admin_reports(request):
    # Get standard admin context (needed for sidebar)
    context = admin.site.each_context(request)
    
    # 0. Get date range from request
    from django.utils import timezone
    from datetime import timedelta, datetime
    
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    else:
        start_date = (timezone.now() - timedelta(days=30)).date()
        
    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    else:
        end_date = timezone.now().date()

    # Create range filter for queries
    date_filter = {'created_at__date__gte': start_date, 'created_at__date__lte': end_date}
    user_date_filter = {'date_joined__date__gte': start_date, 'date_joined__date__lte': end_date}

    # 1. Skill Popularity Report
    skill_popularity = Skill.objects.filter(learningsession__created_at__date__gte=start_date, learningsession__created_at__date__lte=end_date).values('name').annotate(
        use_count=Count('learningsession')
    ).order_by('-use_count')[:10]

    # 2. Revenue by Month (filtered by range)
    monthly_revenue = Transaction.objects.filter(status='COMPLETED', created_at__date__gte=start_date, created_at__date__lte=end_date).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('month')

    # Prepare monthly data for chart
    months = [item['month'].strftime('%b %Y') for item in monthly_revenue]
    revenue_totals = [float(item['total']) for item in monthly_revenue]
    profit_totals = [float(item['total']) * 0.10 for item in monthly_revenue]

    # 3. User Distribution (True P2P distribution)
    # Categorize users based on their skill types
    all_users = User.objects.filter(date_joined__date__lte=end_date)
    
    swappers_count = 0
    pure_mentors_count = 0
    pure_students_count = 0
    inactive_count = 0
    
    for u in all_users:
        has_teach = u.user_skills.filter(skill_type='TEACH').exists()
        has_learn = u.user_skills.filter(skill_type='LEARN').exists()
        
        if has_teach and has_learn:
            swappers_count += 1
        elif has_teach:
            pure_mentors_count += 1
        elif has_learn:
            pure_students_count += 1
        else:
            inactive_count += 1

    # Dynamic Trends for the selected period
    registration_chart = []
    weekly_profit_chart = []
    
    delta = end_date - start_date
    # Limit to 31 days for the trend chart to keep it readable, or group by week if longer
    step = 1 if delta.days <= 31 else (delta.days // 30)
    
    for i in range(0, delta.days + 1, step):
        current_day = start_date + timedelta(days=i)
        count = User.objects.filter(date_joined__date=current_day).count()
        registration_chart.append({'date': current_day.strftime('%b %d'), 'count': count})
        
        daily_rev = Transaction.objects.filter(status='COMPLETED', created_at__date=current_day).aggregate(Sum('amount'))['amount__sum'] or 0
        weekly_profit_chart.append({'date': current_day.strftime('%b %d'), 'amount': float(daily_rev) * 0.10})

    # 4. Learning Session Status Distribution
    session_stats = LearningSession.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date).values('status').annotate(count=Count('id'))

    context.update({
        'title': 'System Reports',
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'skill_popularity': skill_popularity,
        'monthly_revenue_labels': json.dumps(months),
        'monthly_revenue_data': json.dumps(revenue_totals),
        'monthly_profit_data': json.dumps(profit_totals),
        'user_distribution': json.dumps([swappers_count, pure_mentors_count, pure_students_count, inactive_count]),
        'registration_chart': json.dumps(registration_chart),
        'weekly_profit_chart': json.dumps(weekly_profit_chart),
        'session_stats': session_stats,
    })
    return render(request, 'admin/reports.html', context)
