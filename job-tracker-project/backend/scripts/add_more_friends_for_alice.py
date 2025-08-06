#!/usr/bin/env python3
"""
Script to add more friends for Alice to demonstrate leaderboards
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal
from app.models.user import User
from app.models.job_application import JobApplication
from app.models.friendship import Friendship, FriendshipStatus
from app.models.company import Company
from app.services.achievement_service import AchievementService
from datetime import datetime, timedelta
import random

async def create_more_friends():
    """Create additional friends for Alice with varied stats"""
    
    db = SessionLocal()
    
    try:
        # Find Alice
        alice = db.query(User).filter(User.email == "alice.johnson@example.com").first()
        if not alice:
            print("❌ Alice not found!")
            return
        
        # Additional friends data
        new_friends = [
            {"name": "David Chen", "email": "david.chen@example.com", "apps": 45, "interviews": 3, "streak": 12},
            {"name": "Emma Wilson", "email": "emma.wilson@example.com", "apps": 78, "interviews": 7, "streak": 25},
            {"name": "Frank Rodriguez", "email": "frank.rodriguez@example.com", "apps": 23, "interviews": 1, "streak": 5},
            {"name": "Grace Kim", "email": "grace.kim@example.com", "apps": 156, "interviews": 12, "streak": 45},
            {"name": "Henry Johnson", "email": "henry.johnson@example.com", "apps": 89, "interviews": 4, "streak": 18},
            {"name": "Ivy Martinez", "email": "ivy.martinez@example.com", "apps": 67, "interviews": 8, "streak": 33},
            {"name": "Jack Thompson", "email": "jack.thompson@example.com", "apps": 34, "interviews": 2, "streak": 8},
            {"name": "Kate Anderson", "email": "kate.anderson@example.com", "apps": 112, "interviews": 9, "streak": 28}
        ]
        
        created_users = []
        
        for friend_data in new_friends:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == friend_data["email"]).first()
            if existing_user:
                print(f"⏭️  {friend_data['name']} already exists")
                created_users.append(existing_user)
                continue
            
            # Create user
            names = friend_data["name"].split()
            user = User(
                first_name=names[0],
                last_name=" ".join(names[1:]),
                email=friend_data["email"],
                hashed_password="$2b$12$dummy_hash_for_demo",
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(user)
            db.flush()  # Get the user ID
            
            print(f"✅ Created user: {friend_data['name']}")
            created_users.append(user)
            
            # Create companies and job applications
            statuses = ["applied", "interview", "offer", "rejected"]
            for i in range(friend_data["apps"]):
                # Create company
                company = Company(
                    name=f"Company {i+1}",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(company)
                db.flush()  # Get company ID
                
                # Determine status
                if i < friend_data["interviews"]:
                    status = random.choice(["interview", "offer"])
                else:
                    status = random.choice(["applied", "rejected"])
                
                app_date = datetime.utcnow() - timedelta(days=random.randint(1, 90))
                
                job_app = JobApplication(
                    user_id=str(user.id),
                    company_id=str(company.id),
                    title=f"Software Engineer {i+1}",
                    status=status,
                    applied_date=app_date,
                    created_at=app_date,
                    updated_at=app_date
                )
                db.add(job_app)
            
            print(f"✅ Created {friend_data['apps']} applications for {friend_data['name']}")
        
        db.commit()
        
        # Create friendships with Alice
        for user in created_users:
            # Check if friendship already exists
            existing_friendship = db.query(Friendship).filter(
                ((Friendship.requester_id == alice.id) & (Friendship.addressee_id == user.id)) |
                ((Friendship.requester_id == user.id) & (Friendship.addressee_id == alice.id))
            ).first()
            
            if existing_friendship:
                print(f"⏭️  Friendship with {user.first_name} {user.last_name} already exists")
                continue
            
            # Create friendship (Alice sends request, it's auto-accepted)
            friendship = Friendship(
                requester_id=alice.id,
                addressee_id=user.id,
                status=FriendshipStatus.ACCEPTED,
                created_at=datetime.utcnow(),
                accepted_at=datetime.utcnow()
            )
            
            db.add(friendship)
            
            print(f"✅ Created friendship between Alice and {user.first_name} {user.last_name}")
        
        db.commit()
        
        # Initialize achievements for all new users
        for user in created_users:
            await AchievementService.initialize_user_achievements(str(user.id), db)
            await AchievementService.check_and_unlock_achievements(str(user.id), db)
            print(f"✅ Initialized achievements for {user.first_name} {user.last_name}")
        
        print(f"\n🎉 Successfully created {len(created_users)} friends for Alice!")
        print("The leaderboards should now show a full ranking with podium and list sections.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

async def main():
    await create_more_friends()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())