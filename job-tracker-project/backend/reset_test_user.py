#!/usr/bin/env python3
"""
Reset the test user with a fresh password
"""
import sys
import os
sys.path.append('.')

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.core.security import get_password_hash

def reset_test_user():
    """Reset the test user password"""
    with Session(engine) as db:
        # Find existing user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if user:
            # Update password
            new_hash = get_password_hash("password123")
            user.hashed_password = new_hash
            user.is_active = True
            db.commit()
            print("✅ Test user password reset successfully!")
            print("Email: test@example.com")
            print("Password: password123")
        else:
            # Create new user
            new_hash = get_password_hash("password123")
            user = User(
                email="test@example.com",
                first_name="Test",
                last_name="User",
                hashed_password=new_hash,
                is_active=True,
                is_verified=False
            )
            db.add(user)
            db.commit()
            print("✅ New test user created!")
            print("Email: test@example.com")
            print("Password: password123")

if __name__ == "__main__":
    reset_test_user()