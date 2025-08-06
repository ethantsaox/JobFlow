from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Import basic configurations first
from app.core.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Import security systems after basic setup
try:
    from app.core.security_config import validate_security_config, get_security_settings
    from app.middleware.security import SecurityMiddleware
    from app.middleware.cors_security import setup_cors_middleware, setup_csrf_protection
    from app.core.secure_jwt import get_jwt_handler
    
    # Validate security configuration on startup
    validate_security_config()
    logger.info("Security configuration validated successfully")
    
    # Rate limiting (with security settings)
    security_settings = get_security_settings()
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[f"{security_settings.rate_limit_per_minute}/minute"]
    )
    SECURITY_ENABLED = True
except Exception as e:
    logger.warning(f"Security configuration failed, using basic setup: {e}")
    # Fall back to basic rate limiting
    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
    SECURITY_ENABLED = False

# Background task for online status cleanup
cleanup_task = None

async def cleanup_inactive_users():
    """Background task to mark inactive users as offline"""
    from app.core.database import SessionLocal
    from app.services.online_status_service import OnlineStatusService
    
    while True:
        try:
            db = SessionLocal()
            service = OnlineStatusService(db)
            
            # Mark users as offline if inactive for 15 minutes
            count = service.cleanup_inactive_users(timeout_minutes=15)
            
            if count > 0:
                logger.info(f"Marked {count} inactive users as offline")
            
            # Also cleanup expired JWT tokens if security is enabled
            if SECURITY_ENABLED:
                jwt_handler = get_jwt_handler()
                jwt_handler.cleanup_expired_tokens()
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")
        
        # Run every 5 minutes
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global cleanup_task
    cleanup_task = asyncio.create_task(cleanup_inactive_users())
    yield
    # Shutdown
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title="JobFlow API",
    description="Secure job application tracking with Chrome extension integration",
    version="1.0.0",
    lifespan=lifespan,
)

# Add security middleware if available
if SECURITY_ENABLED:
    try:
        # Re-enable SecurityMiddleware with fixed body handling
        app.add_middleware(SecurityMiddleware)
        
        # Setup secure CORS
        setup_cors_middleware(app)
        
        # Setup CSRF protection (but disable for now)
        # setup_csrf_protection(app)
        
        logger.info("Security middleware fully enabled")
    except Exception as e:
        logger.error(f"Failed to setup security middleware: {e}")
else:
    # Fallback to basic CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"chrome-extension://.*|http://localhost:.*|http://127\.0\.0\.1:.*",
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security
security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "Job Application Tracker API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

# Import routers
from app.routers import auth, job_applications, companies, analytics, ai, social

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(job_applications.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(social.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)