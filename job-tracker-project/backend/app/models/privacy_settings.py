from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid

from app.core.database import Base

class PrivacySettings(Base):
    """User privacy settings for social features"""
    __tablename__ = "privacy_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User reference
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Profile visibility settings
    allow_friend_requests = Column(Boolean, default=True, nullable=False)
    show_online_status = Column(Boolean, default=True, nullable=False)
    show_last_seen = Column(Boolean, default=True, nullable=False)
    
    # Stats sharing settings  
    share_application_stats = Column(Boolean, default=True, nullable=False)
    share_streak_data = Column(Boolean, default=True, nullable=False)
    share_achievement_data = Column(Boolean, default=True, nullable=False)
    share_goal_progress = Column(Boolean, default=False, nullable=False)  # More private by default
    
    # Detailed stats visibility
    show_total_applications = Column(Boolean, default=True, nullable=False)
    show_interview_count = Column(Boolean, default=True, nullable=False)
    show_offer_count = Column(Boolean, default=False, nullable=False)  # More sensitive
    show_rejection_count = Column(Boolean, default=False, nullable=False)  # More sensitive
    
    # Social interaction settings (removed chat functionality)
    
    # Discoverability settings
    discoverable_by_email = Column(Boolean, default=True, nullable=False)
    discoverable_by_name = Column(Boolean, default=True, nullable=False)
    show_in_friend_suggestions = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="privacy_settings")

    def __repr__(self):
        return f"<PrivacySettings(user_id={self.user_id}, friend_requests={self.allow_friend_requests})>"

    @classmethod
    def create_default_settings(cls, user_id: UUID):
        """Create default privacy settings for a new user"""
        return cls(
            user_id=user_id,
            allow_friend_requests=True,
            show_online_status=True,
            show_last_seen=True,
            share_application_stats=True,
            share_streak_data=True,
            share_achievement_data=True,
            share_goal_progress=False,
            show_total_applications=True,
            show_interview_count=True,
            show_offer_count=False,
            show_rejection_count=False,
            discoverable_by_email=True,
            discoverable_by_name=True,
            show_in_friend_suggestions=True
        )

    def can_see_stats(self, stat_type: str) -> bool:
        """Check if friends can see a specific stat type"""
        stat_mapping = {
            'applications': self.share_application_stats and self.show_total_applications,
            'interviews': self.share_application_stats and self.show_interview_count,
            'offers': self.share_application_stats and self.show_offer_count,
            'rejections': self.share_application_stats and self.show_rejection_count,
            'streaks': self.share_streak_data,
            'achievements': self.share_achievement_data,
            'goals': self.share_goal_progress,
        }
        return stat_mapping.get(stat_type, False)

    def is_discoverable_by(self, search_type: str) -> bool:
        """Check if user can be discovered by a specific search method"""
        if search_type == "email":
            return self.discoverable_by_email
        elif search_type == "name":
            return self.discoverable_by_name
        return False

    def set_privacy_level(self, level: str):
        """Set privacy to a predefined level"""
        if level == "open":
            # Very open sharing for competition
            self.allow_friend_requests = True
            self.show_online_status = True
            self.show_last_seen = True
            self.share_application_stats = True
            self.share_streak_data = True
            self.share_achievement_data = True
            self.share_goal_progress = True
            self.show_total_applications = True
            self.show_interview_count = True
            self.show_offer_count = True
            self.show_rejection_count = False  # Still keep some privacy
            self.discoverable_by_email = True
            self.discoverable_by_name = True
            self.show_in_friend_suggestions = True
            
        elif level == "friends":
            # Share with friends only (default) - perfect for competition
            self.allow_friend_requests = True
            self.show_online_status = True
            self.show_last_seen = True
            self.share_application_stats = True
            self.share_streak_data = True
            self.share_achievement_data = True
            self.share_goal_progress = False
            self.show_total_applications = True
            self.show_interview_count = True
            self.show_offer_count = False
            self.show_rejection_count = False
            self.discoverable_by_email = True
            self.discoverable_by_name = True
            self.show_in_friend_suggestions = True
            
        elif level == "private":
            # Very private - no competition features
            self.allow_friend_requests = False
            self.show_online_status = False
            self.show_last_seen = False
            self.share_application_stats = False
            self.share_streak_data = False
            self.share_achievement_data = False
            self.share_goal_progress = False
            self.show_total_applications = False
            self.show_interview_count = False
            self.show_offer_count = False
            self.show_rejection_count = False
            self.discoverable_by_email = False
            self.discoverable_by_name = False
            self.show_in_friend_suggestions = False