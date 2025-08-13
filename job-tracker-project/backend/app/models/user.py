from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Job tracking specific fields
    daily_goal = Column(Integer, default=5, nullable=False)
    weekly_goal = Column(Integer, default=25, nullable=False)
    timezone = Column(String, default="America/Los_Angeles", nullable=False)
    
    # Settings and preferences
    profile_visibility = Column(String, default="private", nullable=False)  # 'public', 'friends', 'private'
    analytics_sharing = Column(Boolean, default=False, nullable=False)
    theme = Column(String, default="light", nullable=False)  # 'light', 'dark', 'auto'
    date_format = Column(String, default="MM/DD/YYYY", nullable=False)  # 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'
    profile_picture = Column(String, nullable=True)  # Filename of uploaded profile picture

    # Relationships
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    
    # Social relationships
    sent_friend_requests = relationship("Friendship", foreign_keys="[Friendship.requester_id]", back_populates="requester", cascade="all, delete-orphan")
    received_friend_requests = relationship("Friendship", foreign_keys="[Friendship.addressee_id]", back_populates="addressee", cascade="all, delete-orphan")
    online_status = relationship("OnlineStatus", back_populates="user", uselist=False, cascade="all, delete-orphan")
    privacy_settings = relationship("PrivacySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    # Social helper methods
    def get_friends(self, db_session):
        """Get all accepted friends"""
        from app.models.friendship import Friendship, FriendshipStatus
        
        # Get friendships where this user is either requester or addressee and status is accepted
        friendships = db_session.query(Friendship).filter(
            ((Friendship.requester_id == self.id) | (Friendship.addressee_id == self.id)),
            Friendship.status == FriendshipStatus.ACCEPTED
        ).all()
        
        friends = []
        for friendship in friendships:
            if friendship.requester_id == self.id:
                friends.append(friendship.addressee)
            else:
                friends.append(friendship.requester)
        
        return friends

    def is_friends_with(self, other_user_id, db_session):
        """Check if this user is friends with another user"""
        from app.models.friendship import Friendship, FriendshipStatus
        
        friendship = db_session.query(Friendship).filter(
            ((Friendship.requester_id == self.id) & (Friendship.addressee_id == other_user_id)) |
            ((Friendship.requester_id == other_user_id) & (Friendship.addressee_id == self.id)),
            Friendship.status == FriendshipStatus.ACCEPTED
        ).first()
        
        return friendship is not None

    def get_friendship_status(self, other_user_id, db_session):
        """Get the friendship status with another user"""
        from app.models.friendship import Friendship
        
        friendship = db_session.query(Friendship).filter(
            ((Friendship.requester_id == self.id) & (Friendship.addressee_id == other_user_id)) |
            ((Friendship.requester_id == other_user_id) & (Friendship.addressee_id == self.id))
        ).first()
        
        if not friendship:
            return None
        
        return {
            'status': friendship.status,
            'is_requester': friendship.requester_id == self.id,
            'created_at': friendship.created_at,
            'accepted_at': friendship.accepted_at
        }

    def can_see_user_stats(self, other_user, db_session):
        """Check if this user can see another user's stats based on friendship and privacy settings"""
        if self.id == other_user.id:
            return True  # Can always see own stats
            
        # Check if they're friends
        is_friend = self.is_friends_with(other_user.id, db_session)
        
        # Get the other user's privacy settings
        if not other_user.privacy_settings:
            return False  # No privacy settings means private
            
        privacy = other_user.privacy_settings
        
        # If not friends and user only shares with friends
        if not is_friend and not privacy.share_application_stats:
            return False
            
        return privacy.share_application_stats

    @property
    def display_name(self):
        """Get display name for social features"""
        return self.full_name