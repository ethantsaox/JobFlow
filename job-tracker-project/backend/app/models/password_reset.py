from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone
import uuid

from app.core.database import Base

class PasswordResetToken(Base):
    """Password reset token model for secure password reset flow"""
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    token_hash = Column(String, nullable=False, index=True)  # SHA-256 hash of the raw token
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)  # Prevent token reuse
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="password_reset_tokens")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set expiration to 15 minutes from creation
        if not self.expires_at:
            self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        now = datetime.now(timezone.utc)
        # Handle both timezone-aware and naive datetimes
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at

    @property
    def is_used(self) -> bool:
        """Check if token has been used"""
        return self.used_at is not None

    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not used)"""
        return not self.is_expired and not self.is_used

    def mark_as_used(self):
        """Mark token as used"""
        self.used_at = datetime.now(timezone.utc)

    def __repr__(self):
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"