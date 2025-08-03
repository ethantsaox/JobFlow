from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://job_user:job_pass@localhost:5432/job_tracker"
    postgres_user: str = "job_user"
    postgres_password: str = "job_pass" 
    postgres_db: str = "job_tracker"
    
    # JWT
    jwt_secret_key: str = "your-secret-key-here"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OpenAI
    openai_api_key: str = "your-openai-key-here"
    
    # Extension
    extension_secret: str = "your-extension-secret-key"
    
    # Security
    rate_limit_per_minute: int = 100
    bcrypt_rounds: int = 12
    
    # Application
    debug: bool = False
    cors_origins: str = "http://localhost:3000,http://localhost:5173,chrome-extension://mhmcmnimdnkgilemaajpbhcobnjcjnpj"
    log_level: str = "INFO"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"

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