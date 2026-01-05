#!/usr/bin/env python3
"""
Create a test user for login testing
"""
import sys
import os
sys.path.append('.')

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.core.security import get_password_hash

def create_test_user():
    """Create a test user"""
    with Session(engine) as db:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("Test user already exists!")
            print(f"Email: test@example.com")
            print("Password: password123")
            return
        
        # Create test user
        hashed_password = get_password_hash("password123")
        test_user = User(
            email="test@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"Email: test@example.com")
        print("Password: password123")
        print(f"User ID: {test_user.id}")

if __name__ == "__main__":
    create_test_user()