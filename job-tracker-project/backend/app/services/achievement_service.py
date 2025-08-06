from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
import asyncio

from app.models.user import User
from app.models.job_application import JobApplication
from app.models.achievement import Achievement
from app.models.streak import Streak

class AchievementService:
    """Service for managing achievements and badges"""
    
    # Define all possible achievements with difficulty/rarity
    ACHIEVEMENT_DEFINITIONS = [
        # Application Count Milestones
        {"type": "application_count", "value": 1, "title": "First Step", "description": "Applied to your first job", "icon": "🎯", "category": "milestone", "rarity": "common"},
        {"type": "application_count", "value": 5, "title": "Getting Started", "description": "Applied to 5 jobs", "icon": "🚀", "category": "milestone", "rarity": "common"},
        {"type": "application_count", "value": 10, "title": "Double Digits", "description": "Applied to 10 jobs", "icon": "🔟", "category": "milestone", "rarity": "uncommon"},
        {"type": "application_count", "value": 25, "title": "Quarter Century", "description": "Applied to 25 jobs", "icon": "💪", "category": "milestone", "rarity": "uncommon"},
        {"type": "application_count", "value": 50, "title": "Half Century", "description": "Applied to 50 jobs", "icon": "⭐", "category": "milestone", "rarity": "rare"},
        {"type": "application_count", "value": 100, "title": "Century Club", "description": "Applied to 100 jobs", "icon": "💯", "category": "milestone", "rarity": "epic"},
        {"type": "application_count", "value": 200, "title": "Persistent", "description": "Applied to 200 jobs", "icon": "🏆", "category": "milestone", "rarity": "legendary"},
        {"type": "application_count", "value": 500, "title": "Job Hunter", "description": "Applied to 500 jobs", "icon": "👑", "category": "milestone", "rarity": "mythic"},
        
        # Streak Achievements
        {"type": "streak", "value": 1, "title": "Streak Starter", "description": "Maintained your goal for 1 day", "icon": "🔥", "category": "streak", "rarity": "common"},
        {"type": "streak", "value": 3, "title": "Three Days Strong", "description": "Maintained your goal for 3 consecutive days", "icon": "🔥", "category": "streak", "rarity": "common"},
        {"type": "streak", "value": 7, "title": "Week Warrior", "description": "Maintained your goal for 7 consecutive days", "icon": "🔥", "category": "streak", "rarity": "uncommon"},
        {"type": "streak", "value": 14, "title": "Two Week Champion", "description": "Maintained your goal for 14 consecutive days", "icon": "🔥", "category": "streak", "rarity": "rare"},
        {"type": "streak", "value": 30, "title": "Month Master", "description": "Maintained your goal for 30 consecutive days", "icon": "🔥", "category": "streak", "rarity": "epic"},
        {"type": "streak", "value": 60, "title": "Unstoppable", "description": "Maintained your goal for 60 consecutive days", "icon": "🔥", "category": "streak", "rarity": "legendary"},
        {"type": "streak", "value": 100, "title": "Streak Legend", "description": "Maintained your goal for 100 consecutive days", "icon": "🔥", "category": "streak", "rarity": "mythic"},
        
        # Interview Achievements
        {"type": "interview_count", "value": 1, "title": "First Interview", "description": "Got your first interview", "icon": "👔", "category": "milestone", "rarity": "uncommon"},
        {"type": "interview_count", "value": 5, "title": "Interview Pro", "description": "Got 5 interviews", "icon": "👔", "category": "milestone", "rarity": "rare"},
        {"type": "interview_count", "value": 10, "title": "Interview Expert", "description": "Got 10 interviews", "icon": "👔", "category": "milestone", "rarity": "epic"},
        
        # Consistency Achievements
        {"type": "consistency", "value": 7, "title": "Consistent Applicant", "description": "Applied to jobs 7 days in a row", "icon": "📅", "category": "consistency", "rarity": "uncommon"},
        {"type": "consistency", "value": 30, "title": "Monthly Momentum", "description": "Applied to jobs 30 days in a row", "icon": "📅", "category": "consistency", "rarity": "epic"},
        
        # Offer Achievements
        {"type": "offer_count", "value": 1, "title": "First Offer", "description": "Received your first job offer", "icon": "💼", "category": "milestone", "rarity": "rare"},
        {"type": "offer_count", "value": 3, "title": "Multiple Offers", "description": "Received 3 job offers", "icon": "💼", "category": "milestone", "rarity": "legendary"},
        
        # Speed Achievements
        {"type": "daily_applications", "value": 5, "title": "Speed Demon", "description": "Applied to 5 jobs in one day", "icon": "⚡", "category": "speed", "rarity": "uncommon"},
        {"type": "daily_applications", "value": 10, "title": "Application Machine", "description": "Applied to 10 jobs in one day", "icon": "⚡", "category": "speed", "rarity": "rare"},
    ]
    
    @staticmethod
    async def initialize_user_achievements(user_id: str, db: Session):
        """Initialize all achievements for a new user"""
        existing_achievements = db.query(Achievement).filter(Achievement.user_id == user_id).all()
        existing_types = {f"{a.achievement_type}_{a.criteria_value}" for a in existing_achievements}
        
        for achievement_def in AchievementService.ACHIEVEMENT_DEFINITIONS:
            achievement_key = f"{achievement_def['type']}_{achievement_def['value']}"
            
            if achievement_key not in existing_types:
                new_achievement = Achievement(
                    user_id=user_id,
                    achievement_type=achievement_def["type"],
                    title=achievement_def["title"],
                    description=achievement_def["description"],
                    icon=achievement_def["icon"],
                    criteria_value=achievement_def["value"],
                    category=achievement_def["category"],
                    rarity=achievement_def["rarity"],
                    unlocked=False,
                    current_progress=0
                )
                db.add(new_achievement)
        
        db.commit()
    
    @staticmethod
    async def check_and_unlock_achievements(user_id: str, db: Session) -> List[Dict]:
        """Check for newly unlocked achievements and return them"""
        newly_unlocked = []
        
        # Get current user stats
        total_applications = db.query(func.count(JobApplication.id)).filter(
            JobApplication.user_id == user_id
        ).scalar() or 0
        
        total_interviews = db.query(func.count(JobApplication.id)).filter(
            and_(
                JobApplication.user_id == user_id,
                JobApplication.status.in_(["interview", "offer"])
            )
        ).scalar() or 0
        
        total_offers = db.query(func.count(JobApplication.id)).filter(
            and_(
                JobApplication.user_id == user_id,
                JobApplication.status == "offer"
            )
        ).scalar() or 0
        
        # Get today's applications
        today_applications = db.query(func.count(JobApplication.id)).filter(
            and_(
                JobApplication.user_id == user_id,
                func.date(JobApplication.applied_date) == date.today()
            )
        ).scalar() or 0
        
        # Calculate current streak
        from app.services.streak_service import streak_service
        current_streak = await streak_service.calculate_current_streak(user_id, db)
        
        # Check all achievements
        achievements = db.query(Achievement).filter(
            and_(
                Achievement.user_id == user_id,
                Achievement.unlocked == False
            )
        ).all()
        
        for achievement in achievements:
            should_unlock = False
            new_progress = 0
            
            if achievement.achievement_type == "application_count":
                new_progress = total_applications
                should_unlock = total_applications >= achievement.criteria_value
                
            elif achievement.achievement_type == "streak":
                new_progress = current_streak
                should_unlock = current_streak >= achievement.criteria_value
                
            elif achievement.achievement_type == "interview_count":
                new_progress = total_interviews
                should_unlock = total_interviews >= achievement.criteria_value
                
            elif achievement.achievement_type == "offer_count":
                new_progress = total_offers
                should_unlock = total_offers >= achievement.criteria_value
                
            elif achievement.achievement_type == "daily_applications":
                new_progress = today_applications
                should_unlock = today_applications >= achievement.criteria_value
                
            elif achievement.achievement_type == "consistency":
                # This would require more complex logic to check consecutive days
                new_progress = current_streak
                should_unlock = current_streak >= achievement.criteria_value
            
            # Update progress
            achievement.current_progress = new_progress
            
            # Unlock if criteria met
            if should_unlock:
                achievement.unlocked = True
                achievement.unlocked_at = datetime.utcnow()
                
                newly_unlocked.append({
                    "id": str(achievement.id),
                    "title": achievement.title,
                    "description": achievement.description,
                    "icon": achievement.icon,
                    "category": achievement.category,
                    "criteria_value": achievement.criteria_value,
                    "unlocked_at": achievement.unlocked_at.isoformat()
                })
        
        db.commit()
        return newly_unlocked
    
    @staticmethod
    async def get_user_achievements(user_id: str, db: Session, unlocked_only: bool = False) -> Dict:
        """Get all achievements for a user"""
        query = db.query(Achievement).filter(Achievement.user_id == user_id)
        
        if unlocked_only:
            query = query.filter(Achievement.unlocked == True)
        
        achievements = query.order_by(
            Achievement.unlocked.desc(),
            Achievement.unlocked_at.desc().nullslast(),
            Achievement.criteria_value
        ).all()
        
        # Group by category
        by_category = {}
        total_unlocked = 0
        total_achievements = len(achievements)
        
        for achievement in achievements:
            if achievement.unlocked:
                total_unlocked += 1
                
            if achievement.category not in by_category:
                by_category[achievement.category] = []
            
            by_category[achievement.category].append({
                "id": str(achievement.id),
                "title": achievement.title,
                "description": achievement.description,
                "icon": achievement.icon,
                "criteria_value": achievement.criteria_value,
                "current_progress": achievement.current_progress,
                "unlocked": achievement.unlocked,
                "unlocked_at": achievement.unlocked_at.isoformat() if achievement.unlocked_at else None,
                "progress_percentage": min(100, (achievement.current_progress / achievement.criteria_value * 100)) if achievement.criteria_value > 0 else 0,
                "rarity": achievement.rarity,
                "category": achievement.category
            })
        
        return {
            "total_achievements": total_achievements,
            "total_unlocked": total_unlocked,
            "completion_percentage": (total_unlocked / total_achievements * 100) if total_achievements > 0 else 0,
            "by_category": by_category,
            "recent_unlocked": [
                ach for category in by_category.values() 
                for ach in category 
                if ach["unlocked"]
            ][-5:]  # Last 5 unlocked
        }
    
    @staticmethod
    async def get_achievement_progress(user_id: str, db: Session) -> Dict:
        """Get progress toward next achievements"""
        
        # Get achievements that are close to being unlocked (within 80% progress)
        achievements = db.query(Achievement).filter(
            and_(
                Achievement.user_id == user_id,
                Achievement.unlocked == False
            )
        ).all()
        
        close_achievements = []
        for achievement in achievements:
            if achievement.criteria_value > 0:
                progress_percent = achievement.current_progress / achievement.criteria_value * 100
                if progress_percent >= 80:
                    close_achievements.append({
                        "title": achievement.title,
                        "description": achievement.description,
                        "icon": achievement.icon,
                        "current_progress": achievement.current_progress,
                        "criteria_value": achievement.criteria_value,
                        "progress_percentage": round(progress_percent, 1),
                        "remaining": achievement.criteria_value - achievement.current_progress
                    })
        
        # Sort by progress percentage
        close_achievements.sort(key=lambda x: x["progress_percentage"], reverse=True)
        
        return {
            "close_to_unlocking": close_achievements[:5],  # Top 5 closest
            "total_pending": len([a for a in achievements if not a.unlocked])
        }

# Create service instance
achievement_service = AchievementService()