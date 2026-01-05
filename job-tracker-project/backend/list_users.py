#!/usr/bin/env python3
"""
List all registered users in the database
"""
import sys
import os
sys.path.append('.')

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User

def list_all_users():
    """List all users in the database"""
    try:
        with Session(engine) as db:
            users = db.query(User).all()
            
            if not users:
                print("❌ No users found in the database")
                print("\nTo create a test user, run:")
                print("python create_test_user.py")
                return
            
            print(f"📊 Found {len(users)} user(s) in the database:\n")
            print("ID | Email | Name | Active | Verified | Created")
            print("-" * 70)
            
            for user in users:
                created_date = user.created_at.strftime("%Y-%m-%d") if user.created_at else "N/A"
                print(f"{user.id} | {user.email} | {user.first_name} {user.last_name} | {'✅' if user.is_active else '❌'} | {'✅' if user.is_verified else '❌'} | {created_date}")
            
            print(f"\n✅ Total users: {len(users)}")
            
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print("Make sure your database is running:")
        print("docker-compose up -d postgres")

if __name__ == "__main__":
    list_all_users()