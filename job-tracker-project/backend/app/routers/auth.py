from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user

# Import security systems with fallback
try:
    from app.core.password_security import get_password_security, validate_and_hash_password
    from app.core.secure_jwt import get_jwt_handler
    from app.core.privacy_security import get_privacy_manager
    SECURITY_AVAILABLE = True
except ImportError as e:
    import logging
    logging.warning(f"Security systems not available, falling back to basic auth: {e}")
    # Fallback imports
    from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
    SECURITY_AVAILABLE = False
from app.core.password_reset import PasswordResetService
from app.core.email import email_service
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.schemas.password_reset import ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate and hash password 
    if SECURITY_AVAILABLE:
        try:
            hashed_password = validate_and_hash_password(user_data.password)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    else:
        # Basic password hashing
        hashed_password = get_password_hash(user_data.password)
    
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        is_active=True,
        is_verified=False  # Email verification can be added later
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default privacy settings for new user if security is available
    if SECURITY_AVAILABLE:
        privacy_manager = get_privacy_manager()
        privacy_manager.create_default_privacy_settings(str(db_user.id), db)
    
    return UserResponse.model_validate(db_user)

@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    
    # Simple authentication without rate limiting
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try secure password verification first, fallback to basic
    if SECURITY_AVAILABLE:
        password_security = get_password_security()
        password_valid = password_security.verify_password(user_credentials.password, user.hashed_password)
    else:
        password_valid = verify_password(user_credentials.password, user.hashed_password)
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Create tokens
    if SECURITY_AVAILABLE:
        jwt_handler = get_jwt_handler()
        access_token = jwt_handler.create_access_token(data={"sub": str(user.id)})
        refresh_token = jwt_handler.create_refresh_token(str(user.id))
    else:
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id)}, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60  # Convert to seconds
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user"""
    # In a more sophisticated system, you would invalidate the token
    # For now, we just return a success message
    # Token invalidation would require a token blacklist or shorter expiry
    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    from app.core.security import verify_token
    
    try:
        # Verify refresh token
        payload = verify_token(refresh_token)
        
        # Check if it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("3/15minutes")  # 3 requests per 15 minutes per IP
async def forgot_password(
    request: Request,
    forgot_request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == forgot_request.email).first()
        
        # Always return success message for security (don't reveal if email exists)
        success_message = "If an account with that email exists, we've sent a password reset link."
        
        if user and user.is_active:
            # Generate reset token
            reset_token = PasswordResetService.create_reset_token(db, user)
            
            # For production, tokens should only be sent via email
            # In development, you can add temporary logging here if needed
            
            # Send email
            email_sent = await email_service.send_password_reset_email(
                to_email=user.email,
                reset_token=reset_token,
                user_name=user.first_name
            )
            
            if not email_sent:
                # Log error but don't reveal to user
                import logging
                logging.error(f"Failed to send password reset email to {user.email}")
        
        return ForgotPasswordResponse(message=success_message)
        
    except Exception as e:
        import logging
        logging.error(f"Error in forgot password: {e}")
        # Don't reveal internal errors
        return ForgotPasswordResponse(
            message="If an account with that email exists, we've sent a password reset link."
        )

@router.post("/reset-password", response_model=ResetPasswordResponse)
@limiter.limit("5/minute")  # 5 attempts per minute
async def reset_password(
    request: Request,
    reset_request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using token from email"""
    try:
        # Verify the reset token
        user = PasswordResetService.verify_reset_token(db, reset_request.token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Validate new password (basic validation - could be enhanced)
        if len(reset_request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Hash new password
        new_password_hash = get_password_hash(reset_request.new_password)
        
        # Update user's password
        user.hashed_password = new_password_hash
        user.updated_at = datetime.utcnow()
        
        # Mark token as used
        PasswordResetService.use_reset_token(db, reset_request.token)
        
        # Commit changes
        db.commit()
        
        # Send confirmation email
        await email_service.send_password_change_confirmation(
            to_email=user.email,
            user_name=user.first_name
        )
        
        return ResetPasswordResponse(
            message="Password reset successful. You can now log in with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error in reset password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting your password. Please try again."
        )