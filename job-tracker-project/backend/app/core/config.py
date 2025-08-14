from pydantic_settings import BaseSettings
from typing import List
import os
import secrets

class Settings(BaseSettings):
    # Database - Use environment variables, fallback to dev defaults
    database_url: str = os.getenv("DATABASE_URL", "postgresql://job_user:job_pass@localhost:5432/job_tracker")
    postgres_user: str = os.getenv("POSTGRES_USER", "job_user")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "job_pass")
    postgres_db: str = os.getenv("POSTGRES_DB", "job_tracker")
    
    # JWT - Auto-generate secure key if not provided
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours
    
    # OpenAI - Optional
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Extension - Auto-generate if not provided
    extension_secret: str = os.getenv("EXTENSION_SECRET", secrets.token_urlsafe(32))
    
    # Security
    rate_limit_per_minute: int = 100
    bcrypt_rounds: int = 12
    
    # Application
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,chrome-extension://mhmcmnimdnkgilemaajpbhcobnjcjnpj")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # File Upload Configuration
    max_upload_size: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB default
    upload_path: str = os.getenv("UPLOAD_PATH", "./uploads")
    
    # Database Connection Pool Settings  
    database_pool_size: int = int(os.getenv("DATABASE_POOL_SIZE", "5"))
    database_max_overflow: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))
    database_pool_timeout: int = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
    
    # Admin Security
    admin_ips: str = os.getenv("ADMIN_IPS", "")
    
    # SSL Configuration
    ssl_cert_path: str = os.getenv("SSL_CERT_PATH", "")
    ssl_key_path: str = os.getenv("SSL_KEY_PATH", "")

    class Config:
        env_file = ".env"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert CORS origins string to list for use
        
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins string to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()