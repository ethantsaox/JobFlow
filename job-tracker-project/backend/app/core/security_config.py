import os
import secrets
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import logging

logger = logging.getLogger(__name__)

class SecuritySettings(BaseSettings):
    """Security configuration with validation"""
    
    # JWT Settings
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    jwt_refresh_expiration_days: int = 7
    
    # Password Security
    password_min_length: int = 8
    password_require_special: bool = True
    password_require_numbers: bool = True
    password_require_uppercase: bool = True
    password_max_attempts: int = 5
    password_lockout_minutes: int = 15
    
    # Database Security
    database_url: str = ""
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout: int = 30
    
    # API Security
    api_key_header: str = "X-API-Key"
    cors_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    cors_allow_credentials: bool = True
    max_request_size: int = 10 * 1024 * 1024  # 10MB
    
    # Rate Limiting
    rate_limit_per_minute: int = 100
    login_rate_limit_per_minute: int = 5
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # Security Headers
    enable_cors: bool = True
    enable_csrf_protection: bool = True
    
    # Encryption
    encryption_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @field_validator('jwt_secret_key')
    @classmethod
    def validate_jwt_secret(cls, v):
        if not v:
            if os.getenv('ENVIRONMENT') == 'production':
                raise ValueError("JWT_SECRET_KEY must be set in production")
            # Generate a secure random key for development
            return secrets.token_urlsafe(32)
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v):
        if not v:
            if os.getenv('ENVIRONMENT') == 'production':
                raise ValueError("DATABASE_URL must be set in production")
            return "sqlite:///./test.db"  # Default for development
        # Validate database URL format
        if not (v.startswith('postgresql://') or v.startswith('sqlite://')):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL or SQLite URL")
        return v
    
    @field_validator('cors_origins')
    @classmethod
    def validate_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v):
        valid_envs = ['development', 'testing', 'staging', 'production']
        if v not in valid_envs:
            raise ValueError(f"Environment must be one of: {valid_envs}")
        return v
    
    @field_validator('encryption_key')
    @classmethod
    def validate_encryption_key(cls, v):
        if not v and os.getenv('ENVIRONMENT') == 'production':
            logger.warning("No encryption key set, generating random key")
            return secrets.token_urlsafe(32)
        return v
    
    def is_production(self) -> bool:
        return self.environment == "production"
    
    def is_development(self) -> bool:
        return self.environment == "development"
    
    def get_cors_origins(self) -> list:
        """Get CORS origins with environment-specific defaults"""
        if self.is_production():
            # In production, be more restrictive
            if "localhost" in str(self.cors_origins):
                logger.warning("Localhost found in CORS origins in production!")
            return [origin for origin in self.cors_origins if "localhost" not in origin]
        return self.cors_origins

# Global settings instance
security_settings = SecuritySettings()

def get_security_settings() -> SecuritySettings:
    """Get security settings instance"""
    return security_settings

def validate_security_config():
    """Validate security configuration on startup"""
    settings = get_security_settings()
    
    issues = []
    
    # Check for common security misconfigurations
    if settings.is_production():
        if settings.debug:
            issues.append("DEBUG mode should be disabled in production")
        
        if "localhost" in str(settings.cors_origins):
            issues.append("Localhost origins should not be allowed in production")
        
        if settings.jwt_secret_key == "your-secret-key-here" or len(settings.jwt_secret_key) < 32:
            issues.append("JWT secret key is weak or default")
        
        if "sqlite" in settings.database_url:
            issues.append("SQLite should not be used in production")
    
    # Check password policy
    if settings.password_min_length < 8:
        issues.append("Password minimum length should be at least 8 characters")
    
    if issues:
        logger.error("Security configuration issues found:")
        for issue in issues:
            logger.error(f"  - {issue}")
        
        if settings.is_production():
            raise ValueError("Security configuration issues must be fixed before production deployment")
        else:
            logger.warning("Security configuration issues detected (development environment)")
    
    logger.info("Security configuration validation completed")
    return len(issues) == 0