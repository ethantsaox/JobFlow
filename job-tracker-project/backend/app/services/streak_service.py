from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
import asyncio

from app.models.user import User
from app.models.job_application import JobApplication
from app.models.streak import Streak
from app.core.cache import analytics_cache

class StreakService:
    """Service for managing user streaks and gamification"""
    
    @staticmethod
    async def update_daily_streak(user_id: str, db: Session, target_date: date = None) -> Dict:
        """Update streak data for a specific date (default: today)"""
        if target_date is None:
            target_date = date.today()
        
        # Count applications for the target date
        applications_count = db.query(func.count(JobApplication.id)).filter(
            and_(
                JobApplication.user_id == user_id,
                func.date(JobApplication.applied_date) == target_date
            )
        ).scalar() or 0
        
        # Get user's daily goal
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        daily_goal = user.daily_goal
        goal_met = applications_count >= daily_goal
        
        # Update or create streak record
        existing_streak = db.query(Streak).filter(
            and_(
                Streak.user_id == user_id,
                Streak.date == target_date
            )
        ).first()
        
        if existing_streak:
            existing_streak.applications_count = applications_count
            existing_streak.goal_met = goal_met
        else:
            new_streak = Streak(
                user_id=user_id,
                date=target_date,
                applications_count=applications_count,
                goal_met=goal_met
            )
            db.add(new_streak)
        
        db.commit()
        
        # Calculate current streak length
        current_streak = await StreakService.calculate_current_streak(user_id, db)
        
        return {
            "date": target_date,
            "applications_count": applications_count,
            "daily_goal": daily_goal,
            "goal_met": goal_met,
            "current_streak": current_streak
        }
    
    @staticmethod
    async def calculate_current_streak(user_id: str, db: Session) -> int:
        """Calculate the user's current active streak"""
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
    
    @staticmethod
    async def calculate_longest_streak(user_id: str, db: Session) -> int:
        """Calculate the user's longest streak ever"""
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
    
    @staticmethod
    async def get_streak_calendar(user_id: str, db: Session, days: int = 90) -> List[Dict]:
        """Get streak calendar data for heatmap visualization"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        streaks = db.query(Streak).filter(
            and_(
                Streak.user_id == user_id,
                Streak.date >= start_date,
                Streak.date <= end_date
            )
        ).order_by(Streak.date).all()
        
        # Create full calendar with all dates
        calendar_data = []
        current_date = start_date
        streak_dict = {streak.date: streak for streak in streaks}
        
        while current_date <= end_date:
            streak = streak_dict.get(current_date)
            calendar_data.append({
                "date": current_date.isoformat(),
                "applications": streak.applications_count if streak else 0,
                "goal_met": streak.goal_met if streak else False,
                "has_data": streak is not None
            })
            current_date += timedelta(days=1)
        
        return calendar_data
    
    @staticmethod
    async def get_streak_stats(user_id: str, db: Session) -> Dict:
        """Get comprehensive streak statistics"""
        current_streak = await StreakService.calculate_current_streak(user_id, db)
        longest_streak = await StreakService.calculate_longest_streak(user_id, db)
        
        # Goals met in last 30 days
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_streaks = db.query(Streak).filter(
            and_(
                Streak.user_id == user_id,
                Streak.date >= thirty_days_ago,
                Streak.goal_met == True
            )
        ).count()
        
        # Total applications in streak period
        total_streak_apps = db.query(func.sum(Streak.applications_count)).filter(
            and_(
                Streak.user_id == user_id,
                Streak.goal_met == True
            )
        ).scalar() or 0
        
        # Average applications per day when goal is met
        streak_days = db.query(func.count(Streak.id)).filter(
            and_(
                Streak.user_id == user_id,
                Streak.goal_met == True
            )
        ).scalar() or 0
        
        avg_apps_per_streak_day = (total_streak_apps / streak_days) if streak_days > 0 else 0
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "goals_met_last_30_days": recent_streaks,
            "total_streak_days": streak_days,
            "average_apps_per_streak_day": round(avg_apps_per_streak_day, 1)
        }
    
    @staticmethod
    async def check_streak_milestones(user_id: str, current_streak: int, db: Session) -> List[Dict]:
        """Check for streak milestone achievements"""
        milestones = [1, 3, 7, 14, 30, 60, 100, 365]
        achievements = []
        
        for milestone in milestones:
            if current_streak >= milestone:
                achievements.append({
                    "type": "streak_milestone",
                    "milestone": milestone,
                    "title": f"{milestone} Day Streak!",
                    "description": f"Maintained your daily goal for {milestone} consecutive days",
                    "achieved_date": date.today(),
                    "icon": "🔥"
                })
        
        return achievements
    
    @staticmethod
    async def get_motivation_message(user_id: str, db: Session) -> Dict:
        """Generate motivational message based on user's progress"""
        current_streak = await StreakService.calculate_current_streak(user_id, db)
        today_apps = db.query(func.count(JobApplication.id)).filter(
            and_(
                JobApplication.user_id == user_id,
                func.date(JobApplication.applied_date) == date.today()
            )
        ).scalar() or 0
        
        user = db.query(User).filter(User.id == user_id).first()
        daily_goal = user.daily_goal if user else 5
        
        # Generate contextual message
        if current_streak == 0 and today_apps == 0:
            message = "Start your streak today! Apply to your first job to begin building momentum. 🚀"
            type_msg = "start"
        elif current_streak == 0 and today_apps > 0:
            remaining = max(0, daily_goal - today_apps)
            if remaining == 0:
                message = "Great start! You've hit your daily goal. Keep it up tomorrow to start a streak! 🎯"
                type_msg = "goal_met"
            else:
                message = f"Good progress! Apply to {remaining} more job{'s' if remaining > 1 else ''} to reach your daily goal. 💪"
                type_msg = "progress"
        elif current_streak > 0 and today_apps < daily_goal:
            remaining = daily_goal - today_apps
            message = f"Don't break your {current_streak}-day streak! Apply to {remaining} more job{'s' if remaining > 1 else ''} today. 🔥"
            type_msg = "maintain_streak"
        else:
            message = f"Amazing! You're on a {current_streak}-day streak and crushing your daily goals! 🏆"
            type_msg = "celebration"
        
        return {
            "message": message,
            "type": type_msg,
            "current_streak": current_streak,
            "today_progress": today_apps,
            "daily_goal": daily_goal
        }

# Create service instance
streak_service = StreakService()