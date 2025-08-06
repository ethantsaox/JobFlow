from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging
from app.models.user import User
from app.models.privacy_settings import PrivacySettings
from app.models.friendship import Friendship, FriendshipStatus

logger = logging.getLogger(__name__)

class PrivacySecurityManager:
    """Comprehensive privacy and data access control system"""
    
    def __init__(self):
        self.sensitive_fields = {
            "users": [
                "hashed_password",
                "email",  # Email should be protected unless user allows it
                "last_login",
                "created_at",
                "updated_at"
            ],
            "job_applications": [
                "notes",  # Personal notes should be private
                "resume_path",
                "cover_letter_path"
            ]
        }
    
    def can_access_user_data(
        self, 
        requesting_user: User, 
        target_user: User, 
        data_type: str,
        db: Session
    ) -> bool:
        """
        Determine if a user can access another user's data
        
        Args:
            requesting_user: User making the request
            target_user: User whose data is being accessed
            data_type: Type of data being accessed
            db: Database session
        """
        
        # Users can always access their own data
        if requesting_user.id == target_user.id:
            return True
        
        # Get target user's privacy settings
        privacy_settings = db.query(PrivacySettings).filter(
            PrivacySettings.user_id == target_user.id
        ).first()
        
        if not privacy_settings:
            # If no privacy settings exist, default to private
            logger.warning(f"No privacy settings found for user {target_user.id}, defaulting to private")
            return False
        
        # Check friendship status
        friendship = db.query(Friendship).filter(
            ((Friendship.requester_id == requesting_user.id) & 
             (Friendship.addressee_id == target_user.id)) |
            ((Friendship.requester_id == target_user.id) & 
             (Friendship.addressee_id == requesting_user.id))
        ).first()
        
        is_friend = friendship and friendship.status == FriendshipStatus.ACCEPTED
        
        # Apply privacy rules based on data type
        if data_type == "profile":
            return privacy_settings.profile_visibility == "public" or (
                privacy_settings.profile_visibility == "friends" and is_friend
            )
        
        elif data_type == "application_stats":
            if not privacy_settings.share_application_stats:
                return False
            return privacy_settings.stats_visibility == "public" or (
                privacy_settings.stats_visibility == "friends" and is_friend
            )
        
        elif data_type == "achievements":
            if not privacy_settings.share_achievements:
                return False
            return privacy_settings.achievements_visibility == "public" or (
                privacy_settings.achievements_visibility == "friends" and is_friend
            )
        
        elif data_type == "activity":
            if not privacy_settings.share_activity:
                return False
            return privacy_settings.activity_visibility == "public" or (
                privacy_settings.activity_visibility == "friends" and is_friend
            )
        
        elif data_type == "online_status":
            return privacy_settings.show_online_status and (
                privacy_settings.online_status_visibility == "public" or (
                    privacy_settings.online_status_visibility == "friends" and is_friend
                )
            )
        
        # Default to deny access
        return False
    
    def filter_user_data(
        self, 
        user_data: Dict[str, Any], 
        requesting_user: User, 
        target_user: User, 
        db: Session
    ) -> Dict[str, Any]:
        """
        Filter user data based on privacy settings
        
        Args:
            user_data: Raw user data
            requesting_user: User making the request
            target_user: User whose data is being filtered
            db: Database session
        """
        
        # If accessing own data, return everything (except sensitive fields)
        if requesting_user.id == target_user.id:
            return self._remove_sensitive_fields(user_data, "users")
        
        # For other users, filter based on privacy settings
        filtered_data = {}
        
        # Basic profile information
        if self.can_access_user_data(requesting_user, target_user, "profile", db):
            filtered_data.update({
                "id": user_data.get("id"),
                "first_name": user_data.get("first_name"),
                "last_name": user_data.get("last_name"),
                "display_name": user_data.get("display_name"),
            })
        else:
            # Minimal data for non-accessible profiles
            filtered_data = {
                "id": user_data.get("id"),
                "display_name": "Private User"
            }
            return filtered_data
        
        # Email (only if explicitly allowed)
        privacy_settings = db.query(PrivacySettings).filter(
            PrivacySettings.user_id == target_user.id
        ).first()
        
        if privacy_settings and privacy_settings.share_email:
            filtered_data["email"] = user_data.get("email")
        
        # Application statistics
        if self.can_access_user_data(requesting_user, target_user, "application_stats", db):
            stats_fields = [
                "total_applications", "current_streak", "interview_rate", 
                "applications_today", "applications_this_week"
            ]
            for field in stats_fields:
                if field in user_data:
                    filtered_data[field] = user_data[field]
        
        # Achievements
        if self.can_access_user_data(requesting_user, target_user, "achievements", db):
            if "achievements" in user_data:
                filtered_data["achievements"] = user_data["achievements"]
        
        # Activity data
        if self.can_access_user_data(requesting_user, target_user, "activity", db):
            activity_fields = ["last_application_date", "recent_activity"]
            for field in activity_fields:
                if field in user_data:
                    filtered_data[field] = user_data[field]
        
        # Online status
        if self.can_access_user_data(requesting_user, target_user, "online_status", db):
            if "online_status" in user_data:
                filtered_data["online_status"] = user_data["online_status"]
        
        return filtered_data
    
    def _remove_sensitive_fields(self, data: Dict[str, Any], table_name: str) -> Dict[str, Any]:
        """Remove sensitive fields from data"""
        if table_name not in self.sensitive_fields:
            return data
        
        filtered_data = data.copy()
        for field in self.sensitive_fields[table_name]:
            if field in filtered_data:
                del filtered_data[field]
        
        return filtered_data
    
    def validate_privacy_settings_update(
        self, 
        settings_data: Dict[str, Any], 
        user: User
    ) -> Dict[str, Any]:
        """
        Validate and sanitize privacy settings update
        """
        
        valid_visibility_options = ["public", "friends", "private"]
        
        # Define allowed fields and their validation
        allowed_fields = {
            "profile_visibility": valid_visibility_options,
            "stats_visibility": valid_visibility_options,
            "achievements_visibility": valid_visibility_options,
            "activity_visibility": valid_visibility_options,
            "online_status_visibility": valid_visibility_options,
            "share_application_stats": [True, False],
            "share_achievements": [True, False],
            "share_activity": [True, False],
            "share_email": [True, False],
            "show_online_status": [True, False],
            "allow_friend_requests": [True, False],
        }
        
        validated_settings = {}
        
        for field, value in settings_data.items():
            if field not in allowed_fields:
                logger.warning(f"Invalid privacy setting field: {field} for user {user.id}")
                continue
            
            if value not in allowed_fields[field]:
                logger.warning(f"Invalid value for privacy setting {field}: {value} for user {user.id}")
                continue
            
            validated_settings[field] = value
        
        return validated_settings
    
    def log_data_access(
        self, 
        requesting_user: User, 
        target_user: User, 
        data_type: str, 
        access_granted: bool
    ):
        """Log data access attempts for security monitoring"""
        
        if requesting_user.id != target_user.id:  # Don't log self-access
            if access_granted:
                logger.info(
                    f"Data access granted: User {requesting_user.id} accessed {data_type} "
                    f"for user {target_user.id}"
                )
            else:
                logger.warning(
                    f"Data access denied: User {requesting_user.id} attempted to access {data_type} "
                    f"for user {target_user.id}"
                )
    
    def audit_data_exposure(self, user_data: Dict[str, Any], user_id: str) -> List[str]:
        """
        Audit user data for potential privacy leaks
        Returns list of privacy concerns
        """
        
        concerns = []
        
        # Check for sensitive information in public fields
        if "email" in user_data:
            concerns.append("Email address is exposed")
        
        if "hashed_password" in user_data:
            concerns.append("CRITICAL: Password hash is exposed")
        
        if "last_login" in user_data:
            concerns.append("Last login timestamp is exposed")
        
        # Check for personal information in descriptions/notes
        text_fields = ["notes", "description", "bio"]
        for field in text_fields:
            if field in user_data and user_data[field]:
                text = user_data[field].lower()
                # Basic PII detection
                if any(pattern in text for pattern in ["ssn", "social security", "credit card"]):
                    concerns.append(f"Potential PII detected in {field}")
        
        if concerns:
            logger.warning(f"Privacy audit found concerns for user {user_id}: {concerns}")
        
        return concerns
    
    def create_default_privacy_settings(self, user_id: str, db: Session) -> PrivacySettings:
        """Create secure default privacy settings for new users"""
        
        default_settings = PrivacySettings(
            user_id=user_id,
            # Default to friends-only for most settings
            profile_visibility="friends",
            stats_visibility="friends", 
            achievements_visibility="friends",
            activity_visibility="friends",
            online_status_visibility="friends",
            
            # Default sharing preferences (secure defaults)
            share_application_stats=True,
            share_achievements=True,
            share_activity=False,  # Default to private
            share_email=False,  # Default to private
            show_online_status=True,
            allow_friend_requests=True
        )
        
        db.add(default_settings)
        db.commit()
        db.refresh(default_settings)
        
        logger.info(f"Created default privacy settings for user {user_id}")
        return default_settings

# Global privacy manager instance
privacy_manager = PrivacySecurityManager()

def get_privacy_manager() -> PrivacySecurityManager:
    """Get privacy manager instance"""
    return privacy_manager

def check_data_access_permission(
    requesting_user: User, 
    target_user: User, 
    data_type: str, 
    db: Session
) -> bool:
    """Convenience function to check data access permission"""
    return privacy_manager.can_access_user_data(requesting_user, target_user, data_type, db)