from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timezone, timedelta
from typing import List
import logging

from app.core.database import get_db
from app.models.online_status import OnlineStatus

logger = logging.getLogger(__name__)

class OnlineStatusService:
    """Service for managing user online status"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def cleanup_inactive_users(self, timeout_minutes: int = 15) -> int:
        """
        Mark users as offline if they haven't been active for timeout_minutes
        Returns the number of users marked offline
        """
        try:
            # Find users who should be marked offline
            inactive_statuses = (
                self.db.query(OnlineStatus)
                .filter(
                    and_(
                        OnlineStatus.is_online == True,
                        OnlineStatus.last_activity < datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
                    )
                )
                .all()
            )
            
            count = 0
            for status in inactive_statuses:
                status.mark_offline()
                count += 1
            
            if count > 0:
                self.db.commit()
                logger.info(f"Marked {count} inactive users as offline")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up inactive users: {e}")
            self.db.rollback()
            return 0
    
    def get_online_users_count(self) -> int:
        """Get count of currently online users"""
        return self.db.query(OnlineStatus).filter(OnlineStatus.is_online == True).count()
    
    def get_recently_active_users_count(self, minutes: int = 5) -> int:
        """Get count of users active in the last N minutes"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return (
            self.db.query(OnlineStatus)
            .filter(OnlineStatus.last_activity >= cutoff_time)
            .count()
        )
    
    def mark_user_online(self, user_id: str, session_id: str = None, device_info: str = None) -> OnlineStatus:
        """Mark a specific user as online"""
        online_status = self.db.query(OnlineStatus).filter(OnlineStatus.user_id == user_id).first()
        
        if not online_status:
            online_status = OnlineStatus(user_id=user_id)
            self.db.add(online_status)
        
        online_status.mark_online(session_id=session_id, device_info=device_info)
        self.db.commit()
        
        return online_status
    
    def mark_user_offline(self, user_id: str) -> bool:
        """Mark a specific user as offline"""
        online_status = self.db.query(OnlineStatus).filter(OnlineStatus.user_id == user_id).first()
        
        if online_status and online_status.is_online:
            online_status.mark_offline()
            self.db.commit()
            return True
        
        return False
    
    def update_user_activity(self, user_id: str) -> OnlineStatus:
        """Update user's last activity timestamp"""
        online_status = self.db.query(OnlineStatus).filter(OnlineStatus.user_id == user_id).first()
        
        if not online_status:
            online_status = OnlineStatus(user_id=user_id)
            self.db.add(online_status)
        
        online_status.update_activity()
        self.db.commit()
        
        return online_status

def get_online_status_service(db: Session = None) -> OnlineStatusService:
    """Get online status service instance"""
    if db is None:
        db = next(get_db())
    return OnlineStatusService(db)