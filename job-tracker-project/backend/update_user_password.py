#!/usr/bin/env python3
"""
Update test user password with known working hash
"""
import sys
import os
sys.path.append('.')

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import engine

def update_user_password():
    """Update the test user password with a known working hash"""
    with Session(engine) as db:
        # Use a pre-computed bcrypt hash for "password123" 
        # Generated with: bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt(rounds=12))
        known_hash = "$2b$12$LQv3c1yqBWVHxkd0LQ4YKuWLsXklP.Ap9rGOGwNCtgKcqZXOzsQZy"
        
        sql = """
        UPDATE users 
        SET hashed_password = :password_hash, is_active = true 
        WHERE email = 'test@example.com'
        """
        
        result = db.execute(text(sql), {'password_hash': known_hash})
        db.commit()
        
        if result.rowcount > 0:
            print("✅ User password updated successfully!")
            print("Email: test@example.com")
            print("Password: password123")
            print("Hash used:", known_hash[:50] + "...")
        else:
            print("❌ No user found with email test@example.com")

if __name__ == "__main__":
    update_user_password()