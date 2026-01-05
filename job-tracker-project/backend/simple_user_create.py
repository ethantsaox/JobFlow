#!/usr/bin/env python3
"""
Create a simple test user using direct SQL
"""
import sys
import os
sys.path.append('.')

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import engine
import uuid

def create_simple_user():
    """Create a test user with simple password for debugging"""
    with Session(engine) as db:
        # Delete existing test user
        db.execute(text("DELETE FROM users WHERE email = 'test@example.com'"))
        
        # Create user with a known bcrypt hash for "password123"
        # This is a pre-computed bcrypt hash for "password123"
        known_hash = "$2b$12$LQv3c1yqBWVHxkd0LQ4YKuWLsXklP.Ap9rGOGwNCtgKcqZXOzsQZy"
        user_id = str(uuid.uuid4())
        
        sql = """
        INSERT INTO users (id, email, first_name, last_name, hashed_password, is_active, is_verified, created_at, updated_at)
        VALUES (:id, :email, :first_name, :last_name, :password_hash, :is_active, :is_verified, NOW(), NOW())
        """
        
        db.execute(text(sql), {
            'id': user_id,
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password_hash': known_hash,
            'is_active': True,
            'is_verified': False
        })
        
        db.commit()
        print("✅ Simple test user created!")
        print("Email: test@example.com")
        print("Password: password123")
        print(f"User ID: {user_id}")

if __name__ == "__main__":
    create_simple_user()