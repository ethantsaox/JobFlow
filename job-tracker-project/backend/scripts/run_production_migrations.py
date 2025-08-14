#!/usr/bin/env python3
"""
Production database migration script for JobFlow
Run this script to safely apply all migrations to production database
"""

import os
import sys
import logging
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def validate_production_environment():
    """Validate that we're in production and all required variables are set"""
    load_dotenv()
    
    required_vars = [
        "DATABASE_URL",
        "JWT_SECRET_KEY",
        "ENVIRONMENT"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        return False
    
    if os.getenv("ENVIRONMENT") != "production":
        logger.error("This script should only be run in production environment")
        return False
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url.startswith("postgresql://"):
        logger.error("Production should use PostgreSQL database")
        return False
    
    return True

def backup_database():
    """Create a database backup before running migrations"""
    logger.info("Creating database backup...")
    
    database_url = os.getenv("DATABASE_URL")
    # Extract database name from URL for backup filename
    db_name = database_url.split("/")[-1].split("?")[0]
    backup_filename = f"backup_{db_name}_{os.getenv('ENVIRONMENT')}_{int(time.time())}.sql"
    
    # Use pg_dump to create backup
    backup_cmd = f"pg_dump {database_url} > {backup_filename}"
    
    try:
        os.system(backup_cmd)
        logger.info(f"Database backup created: {backup_filename}")
        return backup_filename
    except Exception as e:
        logger.error(f"Failed to create backup: {e}")
        return None

def test_database_connection():
    """Test database connection before running migrations"""
    logger.info("Testing database connection...")
    
    try:
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            if result.fetchone()[0] == 1:
                logger.info("Database connection successful")
                return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
    
    return False

def run_migrations():
    """Run Alembic migrations"""
    logger.info("Running database migrations...")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    
    # Create Alembic config
    alembic_cfg = Config(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    
    try:
        # Show current migration status
        logger.info("Current database status:")
        command.current(alembic_cfg, verbose=True)
        
        # Show pending migrations
        logger.info("Pending migrations:")
        command.history(alembic_cfg, verbose=True)
        
        # Ask for confirmation
        if not os.getenv("AUTO_CONFIRM_MIGRATIONS", "false").lower() == "true":
            response = input("Do you want to proceed with the migrations? (yes/no): ")
            if response.lower() != "yes":
                logger.info("Migration cancelled by user")
                return False
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations completed successfully")
        
        # Show final status
        logger.info("Final database status:")
        command.current(alembic_cfg, verbose=True)
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False

def verify_migration():
    """Verify that migrations were applied correctly"""
    logger.info("Verifying migration status...")
    
    try:
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check that alembic_version table exists and has current version
            result = conn.execute(text("""
                SELECT version_num FROM alembic_version 
                ORDER BY version_num DESC LIMIT 1
            """))
            current_version = result.fetchone()
            
            if current_version:
                logger.info(f"Current database version: {current_version[0]}")
                return True
            else:
                logger.error("No migration version found")
                return False
                
    except Exception as e:
        logger.error(f"Migration verification failed: {e}")
        return False

def main():
    """Main migration execution function"""
    logger.info("Starting production database migration...")
    
    # Validate environment
    if not validate_production_environment():
        logger.error("Environment validation failed")
        sys.exit(1)
    
    # Test database connection
    if not test_database_connection():
        logger.error("Database connection test failed")
        sys.exit(1)
    
    # Create backup
    backup_file = backup_database()
    if not backup_file:
        logger.error("Failed to create backup")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        logger.error("Migrations failed")
        logger.info(f"You can restore from backup: {backup_file}")
        sys.exit(1)
    
    # Verify migrations
    if not verify_migration():
        logger.error("Migration verification failed")
        sys.exit(1)
    
    logger.info("Production migration completed successfully!")
    logger.info(f"Backup available at: {backup_file}")

if __name__ == "__main__":
    import time
    main()