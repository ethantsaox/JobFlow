import re
import secrets
import hashlib
import hmac
from typing import Optional, Tuple
from passlib.context import CryptContext
from passlib.hash import bcrypt
import logging
from datetime import datetime, timedelta
from app.core.security_config import get_security_settings

logger = logging.getLogger(__name__)

# Configure secure password hashing
# Use fewer rounds in development for faster performance
import os
bcrypt_rounds = 10 if os.getenv('ENVIRONMENT') == 'production' else 8

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=bcrypt_rounds  # Adjustable rounds based on environment
)

class PasswordSecurity:
    """Comprehensive password security system"""
    
    def __init__(self):
        self.settings = get_security_settings()
        self.failed_attempts = {}  # In production, use Redis
    
    def validate_password_strength(self, password: str) -> Tuple[bool, list]:
        """
        Validate password against security policy
        Returns: (is_valid, list_of_issues)
        """
        issues = []
        
        # Length check
        if len(password) < self.settings.password_min_length:
            issues.append(f"Password must be at least {self.settings.password_min_length} characters long")
        
        # Character requirements
        if self.settings.password_require_uppercase and not re.search(r'[A-Z]', password):
            issues.append("Password must contain at least one uppercase letter")
        
        if self.settings.password_require_numbers and not re.search(r'\d', password):
            issues.append("Password must contain at least one number")
        
        if self.settings.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            issues.append("Password must contain at least one special character")
        
        # Common password patterns to reject
        common_patterns = [
            r'123456',
            r'password',
            r'qwerty',
            r'admin',
            r'letmein',
            r'welcome',
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password.lower()):
                issues.append("Password is too common and easily guessable")
                break
        
        # Check for keyboard patterns
        keyboard_patterns = [
            r'qwertyuiop',
            r'asdfghjkl',
            r'zxcvbnm',
            r'1234567890',
        ]
        
        for pattern in keyboard_patterns:
            if pattern in password.lower():
                issues.append("Password contains keyboard patterns")
                break
        
        # Check for repeated characters
        if re.search(r'(.)\1{2,}', password):  # 3+ repeated characters
            issues.append("Password contains too many repeated characters")
        
        return len(issues) == 0, issues
    
    def hash_password(self, password: str) -> str:
        """Securely hash a password"""
        if not password:
            raise ValueError("Password cannot be empty")
        
        # Validate password strength first
        is_valid, issues = self.validate_password_strength(password)
        if not is_valid:
            raise ValueError(f"Password does not meet security requirements: {'; '.join(issues)}")
        
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        if not plain_password or not hashed_password:
            return False
        
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def needs_rehash(self, hashed_password: str) -> bool:
        """Check if password hash needs to be updated"""
        return pwd_context.needs_update(hashed_password)
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        return secrets.token_urlsafe(length)
    
    def generate_secure_password(self, length: int = 16) -> str:
        """Generate a secure random password"""
        if length < 8:
            length = 8
        
        # Character sets
        uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        lowercase = "abcdefghijklmnopqrstuvwxyz"
        numbers = "0123456789"
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        all_chars = uppercase + lowercase + numbers + special
        
        # Ensure at least one character from each required set
        password = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(numbers),
            secrets.choice(special)
        ]
        
        # Fill the rest randomly
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    def record_failed_login(self, identifier: str):
        """Record a failed login attempt"""
        current_time = datetime.utcnow()
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = []
        
        # Clean old attempts (older than lockout period)
        cutoff_time = current_time - timedelta(minutes=self.settings.password_lockout_minutes)
        self.failed_attempts[identifier] = [
            attempt_time for attempt_time in self.failed_attempts[identifier]
            if attempt_time > cutoff_time
        ]
        
        self.failed_attempts[identifier].append(current_time)
        
        # Log security event
        attempt_count = len(self.failed_attempts[identifier])
        logger.warning(f"Failed login attempt for {identifier}: {attempt_count} attempts in last {self.settings.password_lockout_minutes} minutes")
    
    def is_account_locked(self, identifier: str) -> Tuple[bool, Optional[int]]:
        """Check if account is locked due to failed attempts"""
        if identifier not in self.failed_attempts:
            return False, None
        
        current_time = datetime.utcnow()
        cutoff_time = current_time - timedelta(minutes=self.settings.password_lockout_minutes)
        
        # Count recent failed attempts
        recent_attempts = [
            attempt_time for attempt_time in self.failed_attempts[identifier]
            if attempt_time > cutoff_time
        ]
        
        if len(recent_attempts) >= self.settings.password_max_attempts:
            # Calculate remaining lockout time
            oldest_attempt = min(recent_attempts)
            unlock_time = oldest_attempt + timedelta(minutes=self.settings.password_lockout_minutes)
            remaining_seconds = int((unlock_time - current_time).total_seconds())
            return True, max(0, remaining_seconds)
        
        return False, None
    
    def clear_failed_attempts(self, identifier: str):
        """Clear failed login attempts for successful login"""
        if identifier in self.failed_attempts:
            del self.failed_attempts[identifier]
    
    def secure_compare(self, a: str, b: str) -> bool:
        """Constant-time string comparison to prevent timing attacks"""
        if not isinstance(a, str) or not isinstance(b, str):
            return False
        
        return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))

# Global password security instance
password_security = PasswordSecurity()

def get_password_security() -> PasswordSecurity:
    """Get password security instance"""
    return password_security

def validate_and_hash_password(password: str) -> str:
    """Convenience function to validate and hash password"""
    return password_security.hash_password(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Convenience function to verify password"""
    return password_security.verify_password(plain_password, hashed_password)