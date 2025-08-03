from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, extract
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.cache import analytics_cache
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.company import Company
from app.models.streak import Streak
from app.services.export_service import export_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
@analytics_cache(ttl=300)  # Cache for 5 minutes
async def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get overall analytics summary for the user"""
    
    # Total applications
    total_apps = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id
    ).scalar()
    
    # Applications this week
    week_start = date.today() - timedelta(days=date.today().weekday())
    week_apps = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.applied_date >= week_start
        )
    ).scalar()
    
    # Applications today
    today_apps = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            func.date(JobApplication.applied_date) == date.today()
        )
    ).scalar()
    
    # Current streak
    current_streak = await calculate_current_streak(current_user.id, db)
    
    # Success rates
    total_interviews = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.status.in_(["interview", "offer"])
        )
    ).scalar()
    
    interview_rate = (total_interviews / total_apps * 100) if total_apps > 0 else 0
    
    # Status distribution
    status_dist = db.query(
        JobApplication.status,
        func.count(JobApplication.id).label('count')
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(JobApplication.status).all()
    
    status_distribution = {status: count for status, count in status_dist}
    
    return {
        "total_applications": total_apps,
        "applications_this_week": week_apps,
        "applications_today": today_apps,
        "current_streak": current_streak,
        "interview_rate": round(interview_rate, 1),
        "status_distribution": status_distribution,
        "daily_goal": current_user.daily_goal,
        "weekly_goal": current_user.weekly_goal,
        "goal_progress_today": min(today_apps / current_user.daily_goal * 100, 100) if current_user.daily_goal > 0 else 0,
        "goal_progress_week": min(week_apps / current_user.weekly_goal * 100, 100) if current_user.weekly_goal > 0 else 0
    }

@router.get("/timeline")
@analytics_cache(ttl=600)  # Cache for 10 minutes
async def get_application_timeline(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get application timeline data"""
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Get daily application counts
    daily_counts = db.query(
        func.date(JobApplication.applied_date).label('date'),
        func.count(JobApplication.id).label('count')
    ).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.applied_date >= start_date,
            JobApplication.applied_date <= end_date
        )
    ).group_by(func.date(JobApplication.applied_date)).all()
    
    # Create timeline with all dates (including zeros)
    timeline = []
    current_date = start_date
    daily_dict = {str(date_obj): count for date_obj, count in daily_counts}
    
    while current_date <= end_date:
        timeline.append({
            "date": str(current_date),
            "applications": daily_dict.get(str(current_date), 0)
        })
        current_date += timedelta(days=1)
    
    return {
        "timeline": timeline,
        "period_days": days,
        "total_applications": sum(item["applications"] for item in timeline)
    }

@router.get("/role-distribution")
async def get_role_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get distribution of job roles/titles"""
    
    # Extract job categories from titles (simplified categorization)
    role_counts = db.query(
        JobApplication.title,
        func.count(JobApplication.id).label('count')
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(JobApplication.title).order_by(desc('count')).limit(10).all()
    
    # Categorize roles
    categories = {}
    for title, count in role_counts:
        category = categorize_job_title(title)
        categories[category] = categories.get(category, 0) + count
    
    return {
        "role_distribution": [
            {"role": role, "count": count} 
            for role, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)
        ],
        "top_titles": [
            {"title": title, "count": count} 
            for title, count in role_counts
        ]
    }

@router.get("/company-analysis")
async def get_company_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get company-related analytics"""
    
    # Top companies by application count
    top_companies = db.query(
        Company.name,
        Company.size,
        Company.industry,
        func.count(JobApplication.id).label('applications')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).group_by(
        Company.id, Company.name, Company.size, Company.industry
    ).order_by(desc('applications')).limit(10).all()
    
    # Company size distribution
    size_dist = db.query(
        Company.size,
        func.count(JobApplication.id).label('count')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        and_(
            JobApplication.user_id == current_user.id,
            Company.size.isnot(None)
        )
    ).group_by(Company.size).all()
    
    # Industry distribution
    industry_dist = db.query(
        Company.industry,
        func.count(JobApplication.id).label('count')
    ).join(
        JobApplication, JobApplication.company_id == Company.id
    ).filter(
        and_(
            JobApplication.user_id == current_user.id,
            Company.industry.isnot(None)
        )
    ).group_by(Company.industry).all()
    
    return {
        "top_companies": [
            {
                "name": name,
                "size": size,
                "industry": industry,
                "applications": applications
            }
            for name, size, industry, applications in top_companies
        ],
        "company_size_distribution": [
            {"size": size or "Unknown", "count": count}
            for size, count in size_dist
        ],
        "industry_distribution": [
            {"industry": industry or "Unknown", "count": count}
            for industry, count in industry_dist
        ]
    }

@router.get("/success-rates")
async def get_success_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get success rate analytics"""
    
    # Overall funnel
    total = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id
    ).scalar()
    
    screening = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.status.in_(["screening", "interview", "offer"])
        )
    ).scalar()
    
    interview = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.status.in_(["interview", "offer"])
        )
    ).scalar()
    
    offers = db.query(func.count(JobApplication.id)).filter(
        and_(
            JobApplication.user_id == current_user.id,
            JobApplication.status == "offer"
        )
    ).scalar()
    
    # Calculate rates
    if total > 0:
        screening_rate = screening / total * 100
        interview_rate = interview / total * 100
        offer_rate = offers / total * 100
    else:
        screening_rate = interview_rate = offer_rate = 0
    
    return {
        "funnel": {
            "applied": total,
            "screening": screening,
            "interview": interview,
            "offers": offers
        },
        "rates": {
            "screening_rate": round(screening_rate, 1),
            "interview_rate": round(interview_rate, 1),
            "offer_rate": round(offer_rate, 1)
        }
    }

@router.get("/streaks")
async def get_streak_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get streak-related analytics"""
    
    current_streak = await calculate_current_streak(current_user.id, db)
    longest_streak = await calculate_longest_streak(current_user.id, db)
    
    # Recent streak data for calendar view
    recent_streaks = db.query(Streak).filter(
        and_(
            Streak.user_id == current_user.id,
            Streak.date >= date.today() - timedelta(days=90)
        )
    ).order_by(Streak.date).all()
    
    streak_calendar = [
        {
            "date": str(streak.date),
            "applications": streak.applications_count,
            "goal_met": streak.goal_met
        }
        for streak in recent_streaks
    ]
    
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "streak_calendar": streak_calendar,
        "goals_met_last_30_days": len([s for s in recent_streaks[-30:] if s.goal_met])
    }

# Helper functions

async def calculate_current_streak(user_id: str, db: Session) -> int:
    """Calculate the user's current streak"""
    current_date = date.today()
    streak_count = 0
    
    while True:
        streak_record = db.query(Streak).filter(
            and_(
                Streak.user_id == user_id,
                Streak.date == current_date,
                Streak.goal_met == True
            )
        ).first()
        
        if not streak_record:
            break
            
        streak_count += 1
        current_date -= timedelta(days=1)
    
    return streak_count

async def calculate_longest_streak(user_id: str, db: Session) -> int:
    """Calculate the user's longest streak"""
    streaks = db.query(Streak).filter(
        and_(
            Streak.user_id == user_id,
            Streak.goal_met == True
        )
    ).order_by(Streak.date).all()
    
    if not streaks:
        return 0
    
    longest = current = 1
    prev_date = streaks[0].date
    
    for streak in streaks[1:]:
        if streak.date == prev_date + timedelta(days=1):
            current += 1
            longest = max(longest, current)
        else:
            current = 1
        prev_date = streak.date
    
    return longest

def categorize_job_title(title: str) -> str:
    """Categorize job titles into broader categories"""
    title_lower = title.lower()
    
    if any(term in title_lower for term in ['engineer', 'developer', 'programmer', 'architect']):
        return 'Engineering'
    elif any(term in title_lower for term in ['data', 'scientist', 'analyst', 'ml', 'ai']):
        return 'Data Science'
    elif any(term in title_lower for term in ['product', 'manager', 'pm']):
        return 'Product Management'
    elif any(term in title_lower for term in ['design', 'ux', 'ui']):
        return 'Design'
    elif any(term in title_lower for term in ['marketing', 'growth', 'seo']):
        return 'Marketing'
    elif any(term in title_lower for term in ['sales', 'business development', 'bd']):
        return 'Sales'
    else:
        return 'Other'

# Export Endpoints

@router.get("/export/applications/csv")
async def export_applications_csv(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> StreamingResponse:
    """Export job applications to CSV"""
    
    applications = export_service.get_applications_for_export(
        db, current_user.id, start_date, end_date
    )
    
    return export_service.export_applications_csv(applications)

@router.get("/export/streaks/csv")
async def export_streaks_csv(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> StreamingResponse:
    """Export streak data to CSV"""
    
    streaks = export_service.get_streaks_for_export(
        db, current_user.id, start_date, end_date
    )
    
    return export_service.export_streaks_csv(streaks)

@router.get("/export/analytics/json")
async def export_analytics_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> StreamingResponse:
    """Export complete analytics data to JSON"""
    
    # Get all analytics data
    summary = await get_analytics_summary(db, current_user)
    timeline = await get_application_timeline(30, db, current_user)
    role_dist = await get_role_distribution(db, current_user)
    company_analysis = await get_company_analysis(db, current_user)
    success_rates = await get_success_rates(db, current_user)
    streaks = await get_streak_analytics(db, current_user)
    
    analytics_data = {
        'summary': summary,
        'timeline': timeline,
        'role_distribution': role_dist,
        'company_analysis': company_analysis,
        'success_rates': success_rates,
        'streaks': streaks
    }
    
    return export_service.export_analytics_json(analytics_data, current_user.email)