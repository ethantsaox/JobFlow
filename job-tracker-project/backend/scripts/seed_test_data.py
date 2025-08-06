#!/usr/bin/env python3
"""
Seed script to create test users and social data for development/testing.
Run this script to populate the database with test data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid

from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.models.online_status import OnlineStatus
from app.models.privacy_settings import PrivacySettings
from app.models.job_application import JobApplication
from app.models.company import Company
from app.models.streak import Streak
from app.services.achievement_service import AchievementService
from app.core.security import get_password_hash

def create_test_users(db: Session):
    """Create test users with different profiles"""
    
    test_users = [
        {
            "email": "alice.johnson@example.com",
            "first_name": "Alice",
            "last_name": "Johnson",
            "password": "testpass123"
        },
        {
            "email": "bob.smith@example.com", 
            "first_name": "Bob",
            "last_name": "Smith",
            "password": "testpass123"
        },
        {
            "email": "carol.wilson@example.com",
            "first_name": "Carol", 
            "last_name": "Wilson",
            "password": "testpass123"
        },
        {
            "email": "david.brown@example.com",
            "first_name": "David",
            "last_name": "Brown", 
            "password": "testpass123"
        },
        {
            "email": "eve.davis@example.com",
            "first_name": "Eve",
            "last_name": "Davis",
            "password": "testpass123"
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping")
            created_users.append(existing_user)
            continue
            
        # Create new user
        user = User(
            id=uuid.uuid4(),
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            hashed_password=get_password_hash(user_data["password"]),
            is_active=True,
            is_verified=True,
            daily_goal=5,
            weekly_goal=25
        )
        
        db.add(user)
        created_users.append(user)
        print(f"Created user: {user.email}")
    
    db.commit()
    return created_users

def create_online_status(db: Session, users):
    """Create online status for users with varying activity"""
    
    for i, user in enumerate(users):
        existing_status = db.query(OnlineStatus).filter(OnlineStatus.user_id == user.id).first()
        if existing_status:
            continue
            
        # Vary online status for testing
        is_online = i < 2  # First 2 users are online
        last_seen_offset = timedelta(minutes=i * 30) if not is_online else timedelta(0)
        
        online_status = OnlineStatus(
            user_id=user.id,
            is_online=is_online,
            last_seen=datetime.now(timezone.utc) - last_seen_offset,
            last_activity=datetime.now(timezone.utc) - last_seen_offset
        )
        
        db.add(online_status)
        print(f"Created online status for {user.email}: {'Online' if is_online else 'Offline'}")
    
    db.commit()

def create_privacy_settings(db: Session, users):
    """Create privacy settings for all users"""
    
    for user in users:
        existing_settings = db.query(PrivacySettings).filter(PrivacySettings.user_id == user.id).first()
        if existing_settings:
            continue
            
        privacy_settings = PrivacySettings(user_id=user.id)
        db.add(privacy_settings)
        print(f"Created privacy settings for {user.email}")
    
    db.commit()

def create_friendships(db: Session, users):
    """Create test friendships between users"""
    
    # Alice and Bob are friends
    create_friendship(db, users[0], users[1], FriendshipStatus.ACCEPTED)
    
    # Alice and Carol are friends  
    create_friendship(db, users[0], users[2], FriendshipStatus.ACCEPTED)
    
    # Bob has pending request to David
    create_friendship(db, users[1], users[3], FriendshipStatus.PENDING)
    
    # Carol sent request to Eve
    create_friendship(db, users[2], users[4], FriendshipStatus.PENDING)
    
    # David and Eve are friends
    create_friendship(db, users[3], users[4], FriendshipStatus.ACCEPTED)
    
    db.commit()

def create_friendship(db: Session, user1: User, user2: User, status: FriendshipStatus):
    """Helper to create a friendship between two users"""
    
    # Check if friendship already exists
    existing = db.query(Friendship).filter(
        ((Friendship.requester_id == user1.id) & (Friendship.addressee_id == user2.id)) |
        ((Friendship.requester_id == user2.id) & (Friendship.addressee_id == user1.id))
    ).first()
    
    if existing:
        print(f"Friendship between {user1.email} and {user2.email} already exists")
        return
    
    friendship = Friendship(
        requester_id=user1.id,
        addressee_id=user2.id,
        status=status,
        accepted_at=datetime.now(timezone.utc) if status == FriendshipStatus.ACCEPTED else None
    )
    
    db.add(friendship)
    print(f"Created friendship: {user1.email} -> {user2.email} ({status.value})")

def create_companies(db: Session):
    """Create test companies"""
    
    companies_data = [
        {"name": "TechCorp", "website": "https://techcorp.com"},
        {"name": "StartupXYZ", "website": "https://startupxyz.com"},
        {"name": "BigTech Inc", "website": "https://bigtech.com"},
        {"name": "Innovation Labs", "website": "https://innovationlabs.com"},
        {"name": "Future Systems", "website": "https://futuresystems.com"},
        {"name": "Digital Solutions", "website": "https://digitalsolutions.com"},
        {"name": "CloudFirst", "website": "https://cloudfirst.com"},
        {"name": "DataDriven Co", "website": "https://datadriven.com"},
        {"name": "AgileWorks", "website": "https://agileworks.com"},
        {"name": "ScaleUp Inc", "website": "https://scaleup.com"}
    ]
    
    created_companies = []
    
    for company_data in companies_data:
        existing_company = db.query(Company).filter(Company.name == company_data["name"]).first()
        if existing_company:
            created_companies.append(existing_company)
            continue
            
        company = Company(
            name=company_data["name"],
            website=company_data["website"]
        )
        
        db.add(company)
        created_companies.append(company)
        print(f"Created company: {company.name}")
    
    db.commit()
    return created_companies

def create_job_applications(db: Session, users, companies):
    """Create sample job applications for users to show different stats"""
    
    applications_data = [
        # Alice - High performer
        {"user": users[0], "count": 45, "interviews": 8, "offers": 2},
        # Bob - Moderate performer  
        {"user": users[1], "count": 28, "interviews": 4, "offers": 1},
        # Carol - New user
        {"user": users[2], "count": 12, "interviews": 2, "offers": 0},
        # David - Consistent performer
        {"user": users[3], "count": 35, "interviews": 6, "offers": 1},
        # Eve - Starter
        {"user": users[4], "count": 8, "interviews": 1, "offers": 0}
    ]
    
    for data in applications_data:
        user = data["user"]
        
        # Check if user already has applications
        existing_count = db.query(JobApplication).filter(JobApplication.user_id == user.id).count()
        if existing_count > 0:
            print(f"User {user.email} already has {existing_count} applications, skipping")
            continue
        
        # Create applications with varying dates and statuses
        for i in range(data["count"]):
            days_ago = i // 2  # Spread applications over time
            created_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
            
            # Determine status based on counts
            if i < data["offers"]:
                status = "offer"
            elif i < data["interviews"]:
                status = "interview"
            elif i < data["interviews"] + 5:
                status = "applied"
            else:
                status = "applied"
            
            # Pick a random company
            company = companies[i % len(companies)]
            
            app = JobApplication(
                user_id=user.id,
                company_id=company.id,
                title=f"Software Engineer {i+1}",
                status=status,
                source_url=f"https://example.com/job/{i+1}",
                source_platform="linkedin" if i % 2 == 0 else "indeed",
                applied_date=created_date,
                created_at=created_date,
                updated_at=created_date
            )
            
            db.add(app)
        
        print(f"Created {data['count']} applications for {user.email}")
    
    db.commit()

def create_daily_streaks(db: Session, users):
    """Create daily streak data for users"""
    
    streak_data = [
        {"user": users[0], "days": 12},  # Alice - streak leader
        {"user": users[1], "days": 7},   # Bob - good streak
        {"user": users[2], "days": 3},    # Carol - building streak
        {"user": users[3], "days": 9},   # David - consistent
        {"user": users[4], "days": 1}     # Eve - just started
    ]
    
    for data in streak_data:
        user = data["user"]
        days_back = data["days"]
        
        # Create daily streak entries for the last N days
        for i in range(days_back):
            date_entry = datetime.now(timezone.utc).date() - timedelta(days=i)
            
            existing_streak = db.query(Streak).filter(
                Streak.user_id == user.id,
                Streak.date == date_entry
            ).first()
            
            if existing_streak:
                continue
                
            applications_count = 2 if i < days_back else 1  # Vary the application counts
            
            streak = Streak(
                user_id=user.id,
                date=date_entry,
                applications_count=applications_count,
                goal_met=applications_count >= user.daily_goal
            )
            
            db.add(streak)
        
        print(f"Created {days_back} daily streak entries for {user.email}")
    
    db.commit()

async def initialize_achievements(db: Session, users):
    """Initialize and unlock achievements for test users"""
    import asyncio
    
    for user in users:
        print(f"Initializing achievements for {user.email}")
        
        # Initialize achievements for user
        await AchievementService.initialize_user_achievements(str(user.id), db)
        
        # Check and unlock achievements based on their data
        newly_unlocked = await AchievementService.check_and_unlock_achievements(str(user.id), db)
        
        if newly_unlocked:
            print(f"  Unlocked {len(newly_unlocked)} achievements for {user.email}")

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    db = SessionLocal()
    
    try:
        # Create test users
        print("\n👥 Creating test users...")
        users = create_test_users(db)
        
        # Create online status
        print("\n🟢 Creating online status...")
        create_online_status(db, users)
        
        # Create privacy settings
        print("\n🔒 Creating privacy settings...")
        create_privacy_settings(db, users)
        
        # Create friendships
        print("\n👫 Creating friendships...")
        create_friendships(db, users)
        
        # Create companies
        print("\n🏢 Creating companies...")
        companies = create_companies(db)
        
        # Create job applications
        print("\n📋 Creating job applications...")
        create_job_applications(db, users, companies)
        
        # Create streaks 
        print("\n🔥 Creating daily streaks...")
        create_daily_streaks(db, users)
        
        # Initialize achievements
        print("\n🏆 Initializing achievements...")
        import asyncio
        asyncio.run(initialize_achievements(db, users))
        
        print("\n✅ Database seeding completed!")
        print("\n📋 Test User Accounts Created:")
        print("=" * 50)
        for user in users:
            print(f"Email: {user.email}")
            print(f"Password: testpass123")
            print(f"Name: {user.first_name} {user.last_name}")
            print("-" * 30)
        
        print("\n🔗 Friendship Network:")
        print("=" * 50)
        print("Alice ↔ Bob (Friends)")
        print("Alice ↔ Carol (Friends)")
        print("Bob → David (Pending)")
        print("Carol → Eve (Pending)")
        print("David ↔ Eve (Friends)")
        
        print("\n🎯 Application Stats:")
        print("=" * 50)
        print("Alice: 45 apps, 8 interviews, 2 offers, 12-day streak")
        print("Bob: 28 apps, 4 interviews, 1 offer, 7-day streak") 
        print("Carol: 12 apps, 2 interviews, 0 offers, 3-day streak")
        print("David: 35 apps, 6 interviews, 1 offer, 9-day streak")
        print("Eve: 8 apps, 1 interview, 0 offers, 1-day streak")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()