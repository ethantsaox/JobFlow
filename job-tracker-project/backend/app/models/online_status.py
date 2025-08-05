from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone, timedelta
import uuid

from app.core.database import Base

class OnlineStatus(Base):
    """Track user online/offline status"""
    __tablename__ = "online_status"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User reference
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Status tracking
    is_online = Column(Boolean, default=False, nullable=False, index=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Session info (optional)
    session_id = Column(String, nullable=True)  # For tracking specific sessions
    device_info = Column(String, nullable=True)  # Browser/device info
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="online_status")

    def __repr__(self):
        return f"<OnlineStatus(user_id={self.user_id}, is_online={self.is_online}, last_seen={self.last_seen})>"

    def mark_online(self, session_id: str = None, device_info: str = None):
        """Mark user as online"""
        now = datetime.now(timezone.utc)
        self.is_online = True
        self.last_seen = now
        self.last_activity = now
        if session_id:
            self.session_id = session_id
        if device_info:
            self.device_info = device_info

    def mark_offline(self):
        """Mark user as offline"""
        self.is_online = False
        self.last_seen = datetime.now(timezone.utc)

    def update_activity(self):
        """Update last activity timestamp"""
        now = datetime.now(timezone.utc)
        self.last_activity = now
        self.last_seen = now
        if not self.is_online:
            self.is_online = True

    @property
    def is_recently_active(self) -> bool:
        """Check if user was active in the last 5 minutes"""
        now = datetime.now(timezone.utc)
        if self.last_activity.tzinfo is None:
            last_activity_aware = self.last_activity.replace(tzinfo=timezone.utc)
        else:
            last_activity_aware = self.last_activity
        return (now - last_activity_aware).total_seconds() < 300  # 5 minutes

    @property
    def status_text(self) -> str:
        """Get human-readable status"""
        if self.is_online:
            return "Online"
        elif self.is_recently_active:
            return "Recently active"
        else:
            # Calculate time since last seen
            now = datetime.now(timezone.utc)
            if self.last_seen.tzinfo is None:
                last_seen_aware = self.last_seen.replace(tzinfo=timezone.utc)
            else:
                last_seen_aware = self.last_seen
            
            time_diff = now - last_seen_aware
            
            if time_diff.total_seconds() < 3600:  # Less than 1 hour
                minutes = int(time_diff.total_seconds() / 60)
                return f"Last seen {minutes}m ago"
            elif time_diff.total_seconds() < 86400:  # Less than 1 day
                hours = int(time_diff.total_seconds() / 3600)
                return f"Last seen {hours}h ago"
            else:  # More than 1 day
                days = int(time_diff.total_seconds() / 86400)
                return f"Last seen {days}d ago"

    def should_auto_offline(self, timeout_minutes: int = 15) -> bool:
        """Check if user should be automatically marked offline due to inactivity"""
        if not self.is_online:
            return False
        
        now = datetime.now(timezone.utc)
        if self.last_activity.tzinfo is None:
            last_activity_aware = self.last_activity.replace(tzinfo=timezone.utc)
        else:
            last_activity_aware = self.last_activity
        
        return (now - last_activity_aware).total_seconds() > (timeout_minutes * 60)