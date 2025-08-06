from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.models.online_status import OnlineStatus
from app.models.privacy_settings import PrivacySettings
from app.models.job_application import JobApplication
from app.models.streak import Streak
from app.models.achievement import Achievement

router = APIRouter(prefix="/social", tags=["Social"])

# Pydantic schemas for social features
from pydantic import BaseModel, Field
from typing import Dict, Any

class FriendRequestCreate(BaseModel):
    user_id: str = Field(..., description="User ID to send friend request to")

class OnlineStatusUpdate(BaseModel):
    session_id: Optional[str] = None
    device_info: Optional[str] = None

class FriendRequestResponse(BaseModel):
    id: str
    requester: Dict[str, Any]
    addressee: Dict[str, Any] 
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None

class UserSearchResult(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    is_online: bool
    last_seen: Optional[datetime] = None
    friendship_status: Optional[str] = None
    can_send_request: bool

class FriendProfile(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    is_online: bool
    last_seen: Optional[datetime] = None
    status_text: str
    
    # Stats (based on privacy settings)
    total_applications: Optional[int] = None
    interview_count: Optional[int] = None
    offer_count: Optional[int] = None
    current_streak: Optional[int] = None
    longest_streak: Optional[int] = None
    achievements: List[Dict[str, Any]] = []
    goal_progress: Optional[Dict[str, Any]] = None

class FriendsList(BaseModel):
    friends: List[FriendProfile]
    pending_sent: List[FriendRequestResponse]
    pending_received: List[FriendRequestResponse]

# Friend Management Endpoints

@router.post("/friend-request")
async def send_friend_request(
    request: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a friend request to another user"""
    
    # Get the target user
    target_user = db.query(User).filter(User.id == request.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if target user allows friend requests
    if target_user.privacy_settings and not target_user.privacy_settings.allow_friend_requests:
        raise HTTPException(status_code=403, detail="User does not accept friend requests")
    
    # Check if friendship already exists
    existing_friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == target_user.id),
            and_(Friendship.requester_id == target_user.id, Friendship.addressee_id == current_user.id)
        )
    ).first()
    
    if existing_friendship:
        if existing_friendship.status == FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Already friends")
        elif existing_friendship.status == FriendshipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Friend request already pending")
        elif existing_friendship.status == FriendshipStatus.BLOCKED:
            raise HTTPException(status_code=403, detail="Cannot send friend request")
    
    # Create new friend request
    friendship = Friendship(
        requester_id=current_user.id,
        addressee_id=target_user.id,
        status=FriendshipStatus.PENDING
    )
    
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    
    return {"message": "Friend request sent", "friendship_id": str(friendship.id)}

@router.post("/friend-request/{friendship_id}/accept")
async def accept_friend_request(
    friendship_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a friend request"""
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    friendship.accept()
    db.commit()
    
    return {"message": "Friend request accepted"}

@router.post("/friend-request/{friendship_id}/decline")
async def decline_friend_request(
    friendship_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a friend request"""
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    friendship.decline()
    db.commit()
    
    return {"message": "Friend request declined"}

@router.delete("/friend/{user_id}")
async def remove_friend(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a friend (unfriend)"""
    
    friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == user_id),
            and_(Friendship.requester_id == user_id, Friendship.addressee_id == current_user.id)
        ),
        Friendship.status == FriendshipStatus.ACCEPTED
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    db.delete(friendship)
    db.commit()
    
    return {"message": "Friend removed"}

@router.get("/friends")
async def get_friends_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FriendsList:
    """Get user's friends list and pending requests"""
    
    # Get accepted friendships
    accepted_friendships = db.query(Friendship).filter(
        or_(
            Friendship.requester_id == current_user.id,
            Friendship.addressee_id == current_user.id
        ),
        Friendship.status == FriendshipStatus.ACCEPTED
    ).all()
    
    friends = []
    for friendship in accepted_friendships:
        friend_user = friendship.addressee if friendship.requester_id == current_user.id else friendship.requester
        friend_profile = await _build_friend_profile(friend_user, current_user, db)
        friends.append(friend_profile)
    
    # Get pending sent requests
    pending_sent = db.query(Friendship).filter(
        Friendship.requester_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING
    ).all()
    
    # Get pending received requests
    pending_received = db.query(Friendship).filter(
        Friendship.addressee_id == current_user.id,
        Friendship.status == FriendshipStatus.PENDING
    ).all()
    
    return FriendsList(
        friends=friends,
        pending_sent=[_build_friend_request_response(fr) for fr in pending_sent],
        pending_received=[_build_friend_request_response(fr) for fr in pending_received]
    )

@router.get("/search")
async def search_users(
    query: str = Query(..., min_length=2, description="Search query (name or email)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[UserSearchResult]:
    """Search for users to add as friends"""
    
    # Search by name or email
    users = db.query(User).filter(
        User.id != current_user.id,  # Exclude current user
        or_(
            func.concat(User.first_name, ' ', User.last_name).ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        )
    ).limit(20).all()
    
    results = []
    for user in users:
        # Check privacy settings (create default if missing)
        if not user.privacy_settings:
            # Create default privacy settings for user
            from app.models.privacy_settings import PrivacySettings
            default_privacy = PrivacySettings.create_default_settings(user.id)
            db.add(default_privacy)
            db.commit()
            user.privacy_settings = default_privacy
        
        privacy = user.privacy_settings
        if not privacy.discoverable_by_name and not privacy.discoverable_by_email:
            continue
        
        # Check specific discoverability
        searching_by_email = "@" in query and query.lower() in user.email.lower()
        searching_by_name = query.lower() in user.full_name.lower()
        
        if searching_by_email and not privacy.discoverable_by_email:
            continue
        if searching_by_name and not privacy.discoverable_by_name:
            continue
        
        # Get friendship status
        friendship_status = current_user.get_friendship_status(user.id, db)
        status_text = friendship_status['status'].value if friendship_status else None
        
        # Check if can send friend request
        can_send_request = (
            not friendship_status and 
            privacy.allow_friend_requests
        )
        
        # Get online status
        is_online = False
        last_seen = None
        if user.online_status and privacy.show_online_status:
            is_online = user.online_status.is_online
            if privacy.show_last_seen:
                last_seen = user.online_status.last_seen
        
        results.append(UserSearchResult(
            id=str(user.id),
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            is_online=is_online,
            last_seen=last_seen,
            friendship_status=status_text,
            can_send_request=can_send_request
        ))
    
    return results

@router.get("/profile/{user_id}")
async def get_friend_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FriendProfile:
    """Get a friend's profile with stats"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if they're friends
    if not current_user.is_friends_with(user_id, db):
        raise HTTPException(status_code=403, detail="Can only view friends' profiles")
    
    return await _build_friend_profile(user, current_user, db)

@router.get("/achievements/me")
async def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's achievements with progress"""
    from app.services.achievement_service import AchievementService
    
    # Get all achievements for the current user
    achievements_data = await AchievementService.get_user_achievements(str(current_user.id), db, unlocked_only=False)
    
    return achievements_data

# Helper functions

async def _build_friend_profile(friend_user: User, current_user: User, db: Session) -> FriendProfile:
    """Build a friend profile with stats based on privacy settings"""
    
    # Get online status
    is_online = False
    last_seen = None
    status_text = "Offline"
    
    if friend_user.online_status:
        if friend_user.privacy_settings and friend_user.privacy_settings.show_online_status:
            is_online = friend_user.online_status.is_online
            status_text = friend_user.online_status.status_text
            
        if friend_user.privacy_settings and friend_user.privacy_settings.show_last_seen:
            last_seen = friend_user.online_status.last_seen
    
    # Initialize stats as None (hidden by default)
    total_applications = None
    interview_count = None
    offer_count = None
    current_streak = None
    longest_streak = None
    achievements = []
    goal_progress = None
    
    # Get stats based on privacy settings
    if friend_user.privacy_settings:
        privacy = friend_user.privacy_settings
        
        if privacy.share_application_stats:
            # Get application stats
            if privacy.show_total_applications:
                total_applications = db.query(JobApplication).filter(
                    JobApplication.user_id == friend_user.id
                ).count()
            
            if privacy.show_interview_count:
                interview_count = db.query(JobApplication).filter(
                    JobApplication.user_id == friend_user.id,
                    JobApplication.status == "interview"
                ).count()
            
            if privacy.show_offer_count:
                offer_count = db.query(JobApplication).filter(
                    JobApplication.user_id == friend_user.id,
                    JobApplication.status == "offer"
                ).count()
        
        if privacy.share_streak_data:
            # Calculate current streak from daily streak data
            from datetime import date, timedelta
            
            # Get current streak by counting consecutive days from today backwards
            current_date = date.today()
            current_streak = 0
            
            # Check each day backwards until we find a gap
            for i in range(365):  # Maximum look back of 1 year
                check_date = current_date - timedelta(days=i)
                streak_entry = db.query(Streak).filter(
                    Streak.user_id == friend_user.id,
                    Streak.date == check_date,
                    Streak.goal_met == True
                ).first()
                
                if streak_entry:
                    current_streak = i + 1
                else:
                    break
            
            # Calculate longest streak by looking at all goal_met entries
            all_streaks = db.query(Streak).filter(
                Streak.user_id == friend_user.id,
                Streak.goal_met == True
            ).order_by(Streak.date.asc()).all()
            
            # Find longest consecutive streak
            longest_streak = 0
            temp_streak = 0
            last_date = None
            
            for streak_entry in all_streaks:
                if last_date is None or (streak_entry.date - last_date).days == 1:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
                last_date = streak_entry.date
            
            longest_streak = max(longest_streak, temp_streak)  # Don't forget the last streak
        
        if privacy.share_achievement_data:
            # Get achievements (only unlocked ones)
            user_achievements = db.query(Achievement).filter(
                Achievement.user_id == friend_user.id,
                Achievement.unlocked == True
            ).all()
            
            achievements = [
                {
                    "type": ach.achievement_type,
                    "title": ach.title,
                    "description": ach.description,
                    "icon": ach.icon,
                    "category": ach.category,
                    "rarity": ach.rarity,
                    "unlocked_at": ach.unlocked_at.isoformat() if ach.unlocked_at else None
                }
                for ach in user_achievements
            ]
        
        if privacy.share_goal_progress:
            goal_progress = {
                "daily_goal": friend_user.daily_goal,
                "weekly_goal": friend_user.weekly_goal,
                # Could add progress calculations here
            }
    
    return FriendProfile(
        id=str(friend_user.id),
        first_name=friend_user.first_name,
        last_name=friend_user.last_name,
        email=friend_user.email,
        is_online=is_online,
        last_seen=last_seen,
        status_text=status_text,
        total_applications=total_applications,
        interview_count=interview_count,
        offer_count=offer_count,
        current_streak=current_streak,
        longest_streak=longest_streak,
        achievements=achievements,
        goal_progress=goal_progress
    )

def _build_friend_request_response(friendship: Friendship) -> FriendRequestResponse:
    """Build a friend request response object"""
    return FriendRequestResponse(
        id=str(friendship.id),
        requester={
            "id": str(friendship.requester.id),
            "name": friendship.requester.full_name,
            "email": friendship.requester.email
        },
        addressee={
            "id": str(friendship.addressee.id),
            "name": friendship.addressee.full_name,
            "email": friendship.addressee.email
        },
        status=friendship.status.value,
        created_at=friendship.created_at,
        accepted_at=friendship.accepted_at
    )

# Online Status Endpoints
@router.post("/status/online")
async def mark_online(
    status_data: OnlineStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark user as online and update presence"""
    # Get or create online status for user
    online_status = db.query(OnlineStatus).filter(OnlineStatus.user_id == current_user.id).first()
    
    if not online_status:
        online_status = OnlineStatus(user_id=current_user.id)
        db.add(online_status)
    
    # Mark user as online
    online_status.mark_online(
        session_id=status_data.session_id,
        device_info=status_data.device_info
    )
    
    db.commit()
    
    return {"message": "Marked as online", "status": "online"}

@router.post("/status/offline")
async def mark_offline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark user as offline"""
    online_status = db.query(OnlineStatus).filter(OnlineStatus.user_id == current_user.id).first()
    
    if online_status:
        online_status.mark_offline()
        db.commit()
    
    return {"message": "Marked as offline", "status": "offline"}

@router.post("/status/activity")
async def update_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user activity timestamp (heartbeat)"""
    online_status = db.query(OnlineStatus).filter(OnlineStatus.user_id == current_user.id).first()
    
    if not online_status:
        online_status = OnlineStatus(user_id=current_user.id)
        db.add(online_status)
    
    online_status.update_activity()
    db.commit()
    
    return {"message": "Activity updated", "last_activity": online_status.last_activity}

@router.get("/status/me")
async def get_my_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's online status"""
    online_status = db.query(OnlineStatus).filter(OnlineStatus.user_id == current_user.id).first()
    
    if not online_status:
        return {
            "is_online": False,
            "status_text": "Offline",
            "last_seen": None
        }
    
    return {
        "is_online": online_status.is_online,
        "status_text": online_status.status_text,
        "last_seen": online_status.last_seen,
        "last_activity": online_status.last_activity
    }