from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Achievement details
    achievement_type = Column(String, nullable=False)  # "streak", "application_count", "interview", etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)  # Emoji or icon identifier
    
    # Achievement criteria
    criteria_value = Column(Integer, nullable=True)  # The threshold (e.g., 10 for "10 applications")
    category = Column(String, nullable=False)  # "milestone", "streak", "consistency", etc.
    
    # Achievement status
    unlocked = Column(Boolean, default=False, nullable=False)
    unlocked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Progress tracking
    current_progress = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="achievements")

# Add this to User model relationship (you'll need to update user.py)
# achievements = relationship("Achievement", back_populates="user")