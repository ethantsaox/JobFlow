import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.password_reset import PasswordResetToken

class PasswordResetService:
    """Service for handling secure password reset operations"""
    
    @staticmethod
    def generate_reset_token() -> Tuple[str, str]:
        """
        Generate a cryptographically secure reset token
        Returns: (raw_token, token_hash)
        """
        # Generate 32-byte random token (256 bits)
        raw_token = secrets.token_urlsafe(32)
        
        # Create SHA-256 hash of the token for database storage
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        return raw_token, token_hash
    
    @staticmethod
    def create_reset_token(db: Session, user: User) -> str:
        """
        Create a password reset token for a user
        Returns: raw_token (to be sent in email)
        """
        # Generate token
        raw_token, token_hash = PasswordResetService.generate_reset_token()
        
        # Invalidate any existing tokens for this user
        existing_tokens = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None)
        ).all()
        
        for token in existing_tokens:
            token.mark_as_used()
        
        # Create new token
        reset_token = PasswordResetToken(
            token_hash=token_hash,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)  # 15 minute expiry
        )
        
        db.add(reset_token)
        db.commit()
        
        return raw_token
    
    @staticmethod
    def verify_reset_token(db: Session, raw_token: str) -> Optional[User]:
        """
        Verify a password reset token and return the associated user
        Returns: User if valid, None if invalid/expired/used
        """
        # Hash the provided token
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Find the token in database
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()
        
        if not reset_token:
            return None
        
        # Check if token is valid (not expired and not used)
        if not reset_token.is_valid:
            return None
        
        # Return the associated user
        return reset_token.user
    
    @staticmethod
    def use_reset_token(db: Session, raw_token: str) -> Optional[PasswordResetToken]:
        """
        Mark a reset token as used (called after successful password reset)
        Returns: PasswordResetToken if valid, None if invalid
        """
        # Hash the provided token
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Find and mark token as used
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()
        
        if reset_token and reset_token.is_valid:
            reset_token.mark_as_used()
            db.commit()
            return reset_token
        
        return None
    
    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """
        Clean up expired password reset tokens
        Returns: number of tokens cleaned up
        """
        expired_tokens = db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at < datetime.now(timezone.utc)
        ).all()
        
        count = len(expired_tokens)
        
        for token in expired_tokens:
            db.delete(token)
        
        db.commit()
        return count