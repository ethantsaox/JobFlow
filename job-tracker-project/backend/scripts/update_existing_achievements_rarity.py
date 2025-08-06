#!/usr/bin/env python3
"""
Script to update existing achievements with rarity values based on their titles.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.achievement import Achievement
from app.services.achievement_service import AchievementService

def update_achievements_rarity():
    """Update existing achievements with rarity values"""
    
    db = SessionLocal()
    
    try:
        # Create a mapping from title to rarity based on the achievement definitions
        title_to_rarity = {}
        for achievement_def in AchievementService.ACHIEVEMENT_DEFINITIONS:
            title_to_rarity[achievement_def["title"]] = achievement_def["rarity"]
        
        # Get all achievements in the database
        all_achievements = db.query(Achievement).all()
        
        updated_count = 0
        
        for achievement in all_achievements:
            if achievement.title in title_to_rarity:
                new_rarity = title_to_rarity[achievement.title]
                if achievement.rarity != new_rarity:
                    achievement.rarity = new_rarity
                    updated_count += 1
                    print(f"✅ Updated {achievement.title} to {new_rarity}")
                else:
                    print(f"⏭️  {achievement.title} already has correct rarity: {achievement.rarity}")
            else:
                print(f"❓ Unknown achievement title: {achievement.title}")
        
        db.commit()
        print(f"\n🎉 Successfully updated {updated_count} achievements with rarity values!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_achievements_rarity()