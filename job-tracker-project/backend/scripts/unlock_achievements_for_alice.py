#!/usr/bin/env python3
"""
Script to unlock various achievements for Alice to showcase the rarity system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.models.user import User
from app.models.achievement import Achievement

def unlock_achievements_for_alice():
    """Unlock a variety of achievements for Alice to showcase different rarities"""
    
    db = SessionLocal()
    
    try:
        # Get Alice
        alice = db.query(User).filter(User.email == "alice.johnson@example.com").first()
        if not alice:
            print("Alice not found!")
            return
        
        # Define achievements to unlock with different rarities
        achievements_to_unlock = [
            # Mythic
            ("Job Hunter", "mythic"),
            
            # Legendary  
            ("Persistent", "legendary"),
            ("Unstoppable", "legendary"),
            
            # Epic
            ("Century Club", "epic"),
            ("Month Master", "epic"),
            ("Interview Expert", "epic"),
            
            # Rare
            ("Half Century", "rare"),
            ("Two Week Champion", "rare"),
            ("First Offer", "rare"),
            ("Speed Demon", "rare"),
            
            # Uncommon
            ("Double Digits", "uncommon"),
            ("Week Warrior", "uncommon"),
            ("First Interview", "uncommon"),
            ("Consistent Applicant", "uncommon"),
            
            # Common
            ("First Step", "common"),
            ("Getting Started", "common"),
            ("Three Days Strong", "common"),
        ]
        
        unlocked_count = 0
        
        for title, expected_rarity in achievements_to_unlock:
            achievement = db.query(Achievement).filter(
                Achievement.user_id == alice.id,
                Achievement.title == title
            ).first()
            
            if achievement:
                if not achievement.unlocked:
                    achievement.unlocked = True
                    achievement.unlocked_at = datetime.now(timezone.utc)
                    achievement.current_progress = achievement.criteria_value
                    unlocked_count += 1
                    print(f"✅ Unlocked {expected_rarity.upper()}: {title}")
                else:
                    print(f"⏭️  Already unlocked: {title}")
            else:
                print(f"❌ Achievement not found: {title}")
        
        db.commit()
        print(f"\n🎉 Successfully unlocked {unlocked_count} achievements for Alice!")
        print("\nAlice now has achievements spanning all rarity levels:")
        print("🔮 Mythic: Job Hunter")
        print("🌟 Legendary: Persistent, Unstoppable")  
        print("💜 Epic: Century Club, Month Master, Interview Expert")
        print("💙 Rare: Half Century, Two Week Champion, First Offer, Speed Demon")
        print("💚 Uncommon: Double Digits, Week Warrior, First Interview, Consistent Applicant")
        print("⚪ Common: First Step, Getting Started, Three Days Strong")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    unlock_achievements_for_alice()