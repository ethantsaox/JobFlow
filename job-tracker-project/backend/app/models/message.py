from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid

from app.core.database import Base

class Message(Base):
    """Chat messages between users"""
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Sender and receiver
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Message content
    content = Column(Text, nullable=False)
    
    # Message status
    is_read = Column(Boolean, default=False, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    
    # Optional: Message type (text, image, file, etc.) for future expansion
    message_type = Column(String, default="text", nullable=False)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    def __repr__(self):
        return f"<Message(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, content='{self.content[:50]}...')>"

    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.now(timezone.utc)

    def mark_as_edited(self):
        """Mark message as edited"""
        self.is_edited = True
        self.edited_at = datetime.now(timezone.utc)

    def soft_delete(self):
        """Soft delete the message"""
        self.is_deleted = True

    @property
    def is_recent(self) -> bool:
        """Check if message was sent in the last 24 hours"""
        now = datetime.now(timezone.utc)
        if self.created_at.tzinfo is None:
            created_at_aware = self.created_at.replace(tzinfo=timezone.utc)
        else:
            created_at_aware = self.created_at
        return (now - created_at_aware).total_seconds() < 86400  # 24 hours

    @property
    def formatted_content(self) -> str:
        """Return content with deleted message handling"""
        return "[Message deleted]" if self.is_deleted else self.content