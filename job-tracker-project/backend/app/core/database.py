from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
import os
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()

DATABASE_URL = settings.database_url

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Configure engine based on database type and environment
if "sqlite" in DATABASE_URL:
    # SQLite configuration (development/testing only)
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
elif "postgresql" in DATABASE_URL:
    # PostgreSQL configuration (recommended for production)
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_timeout=settings.database_pool_timeout,
        pool_recycle=3600,  # Recycle connections every hour
        pool_pre_ping=True,  # Verify connections before use
        echo=settings.debug and settings.environment != "production",  # Log SQL in debug mode only
        connect_args={
            "sslmode": "require" if settings.environment == "production" else "prefer",
            "options": "-c timezone=utc"
        }
    )
else:
    # Fallback for other databases
    engine = create_engine(
        DATABASE_URL,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_timeout=settings.database_pool_timeout,
        echo=settings.debug and settings.environment != "production"
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()