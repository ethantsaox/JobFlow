from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv

load_dotenv()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Job Application Tracker API",
    description="AI-powered job application tracking with Chrome extension integration",
    version="1.0.0"
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
from app.core.config import settings

# Custom CORS origin function to handle chrome-extension origins
def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed including chrome-extension patterns"""
    if not origin:
        return False
    
    # Check against configured origins
    allowed_origins = settings.cors_origins_list
    
    # Direct match
    if origin in allowed_origins:
        return True
    
    # Chrome extension pattern matching
    if origin.startswith('chrome-extension://'):
        return True
    
    # Localhost patterns for development
    if origin.startswith('http://localhost:') or origin.startswith('http://127.0.0.1:'):
        return True
        
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "Job Application Tracker API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

# Import routers
from app.routers import auth, job_applications, companies, analytics, ai

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(job_applications.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)