from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid
import enum

from app.core.database import Base

class FriendshipStatus(enum.Enum):
    """Status of friendship"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"
    DECLINED = "declined"

class Friendship(Base):
    """Friendship/Social connection between users"""
    __tablename__ = "friendships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # The user who sent the friend request
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # The user who received the friend request
    addressee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Status of the friendship
    status = Column(Enum(FriendshipStatus), nullable=False, default=FriendshipStatus.PENDING, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # When the friendship was accepted (if accepted)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_friend_requests")
    addressee = relationship("User", foreign_keys=[addressee_id], back_populates="received_friend_requests")

    def __repr__(self):
        return f"<Friendship(id={self.id}, requester={self.requester_id}, addressee={self.addressee_id}, status={self.status})>"

    @property
    def is_accepted(self) -> bool:
        """Check if friendship is accepted"""
        return self.status == FriendshipStatus.ACCEPTED

    @property
    def is_pending(self) -> bool:
        """Check if friendship is pending"""
        return self.status == FriendshipStatus.PENDING

    @property
    def is_blocked(self) -> bool:
        """Check if friendship is blocked"""
        return self.status == FriendshipStatus.BLOCKED

    def accept(self):
        """Accept the friendship"""
        self.status = FriendshipStatus.ACCEPTED
        self.accepted_at = datetime.now(timezone.utc)

    def decline(self):
        """Decline the friendship"""
        self.status = FriendshipStatus.DECLINED

    def block(self):
        """Block the friendship"""
        self.status = FriendshipStatus.BLOCKED