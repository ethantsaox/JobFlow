from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.privacy_settings import PrivacySettings
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class UserSettingsUpdate(BaseModel):
    # Privacy settings
    profile_visibility: Optional[str] = None  # 'public', 'friends', 'private'
    analytics_sharing: Optional[bool] = None
    
    # Preferences
    theme: Optional[str] = None  # 'light', 'dark', 'auto'
    timezone: Optional[str] = None
    date_format: Optional[str] = None  # 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'

class UserSettingsResponse(BaseModel):
    privacy: dict
    preferences: dict

@router.get("/", response_model=UserSettingsResponse)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's settings"""
    
    # Get or create privacy settings
    privacy_settings = db.query(PrivacySettings).filter(
        PrivacySettings.user_id == current_user.id
    ).first()
    
    if not privacy_settings:
        privacy_settings = PrivacySettings(user_id=current_user.id)
        db.add(privacy_settings)
        db.commit()
        db.refresh(privacy_settings)
    
    # Build response
    settings = {
        "privacy": {
            "profile_visibility": getattr(current_user, 'profile_visibility', 'private'),
            "analytics_sharing": getattr(current_user, 'analytics_sharing', False)
        },
        "preferences": {
            "theme": getattr(current_user, 'theme', 'light'),
            "timezone": getattr(current_user, 'timezone', 'America/Los_Angeles'),
            "date_format": getattr(current_user, 'date_format', 'MM/DD/YYYY')
        }
    }
    
    return settings

@router.patch("/", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    
    # Get or create privacy settings
    privacy_settings = db.query(PrivacySettings).filter(
        PrivacySettings.user_id == current_user.id
    ).first()
    
    if not privacy_settings:
        privacy_settings = PrivacySettings(user_id=current_user.id)
        db.add(privacy_settings)
    
    # Update privacy settings
    if settings_update.profile_visibility is not None:
        if settings_update.profile_visibility not in ['public', 'friends', 'private']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid profile visibility setting"
            )
        # Store in user table for easier querying
        current_user.profile_visibility = settings_update.profile_visibility
    
    if settings_update.analytics_sharing is not None:
        current_user.analytics_sharing = settings_update.analytics_sharing
        
        # Log analytics opt-in/opt-out event
        if settings_update.analytics_sharing:
            print(f"User {current_user.id} opted INTO analytics sharing at {datetime.utcnow()}")
        else:
            print(f"User {current_user.id} opted OUT of analytics sharing at {datetime.utcnow()}")
    
    # Update preferences
    if settings_update.theme is not None:
        if settings_update.theme not in ['light', 'dark', 'auto']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid theme setting"
            )
        current_user.theme = settings_update.theme
    
    if settings_update.timezone is not None:
        # Basic timezone validation
        valid_timezones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 
            'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
            'UTC', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 
            'Asia/Shanghai', 'Australia/Sydney'
        ]
        if settings_update.timezone not in valid_timezones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid timezone setting"
            )
        current_user.timezone = settings_update.timezone
    
    if settings_update.date_format is not None:
        if settings_update.date_format not in ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format setting"
            )
        current_user.date_format = settings_update.date_format
    
    # Update timestamps
    current_user.updated_at = datetime.utcnow()
    
    # Commit changes
    db.commit()
    db.refresh(current_user)
    
    # Return updated settings
    return await get_user_settings(current_user, db)

@router.post("/analytics-event")
async def log_analytics_event(
    event_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log analytics event if user has opted in"""
    
    # Check if user has opted into analytics sharing
    if not getattr(current_user, 'analytics_sharing', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has not opted into analytics sharing"
        )
    
    # Log the event (in production, you'd send this to your analytics service)
    analytics_event = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": str(current_user.id),  # Anonymized in production
        "event_type": event_data.get("event_type", "unknown"),
        "event_data": event_data,
        "user_timezone": getattr(current_user, 'timezone', 'UTC')
    }
    
    print(f"ANALYTICS EVENT: {analytics_event}")
    
    # In production, you would:
    # - Send to analytics service (Google Analytics, Mixpanel, etc.)
    # - Store in analytics database
    # - Remove personally identifiable information
    
    return {"status": "logged", "message": "Analytics event recorded"}

@router.get("/privacy-impact")
async def get_privacy_impact(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get information about what data is visible to others based on privacy settings"""
    
    profile_visibility = getattr(current_user, 'profile_visibility', 'private')
    
    impact = {
        "profile_visibility": profile_visibility,
        "visible_to_others": {
            "basic_profile": False,
            "achievements": False,
            "activity_status": False,
            "job_applications": False,  # Always private
            "friends_list": False
        },
        "description": ""
    }
    
    if profile_visibility == 'public':
        impact["visible_to_others"].update({
            "basic_profile": True,
            "achievements": True, 
            "activity_status": True,
            "friends_list": True
        })
        impact["description"] = "Your profile, achievements, and activity are visible to all JobFlow users. Your job applications remain private."
    
    elif profile_visibility == 'friends':
        impact["visible_to_others"].update({
            "basic_profile": True,
            "achievements": True,
            "activity_status": True,
            "friends_list": True
        })
        impact["description"] = "Only your friends can see your profile, achievements, and activity. Your job applications remain private."
    
    else:  # private
        impact["description"] = "Your profile and all activity are completely hidden from other users. Only you can see your data."
    
    return impact