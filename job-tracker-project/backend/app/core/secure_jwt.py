import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import logging
from fastapi import HTTPException, status
from app.core.security_config import get_security_settings
import hashlib
import hmac

logger = logging.getLogger(__name__)

class SecureJWTHandler:
    """Secure JWT token management with additional security features"""
    
    def __init__(self):
        self.settings = get_security_settings()
        # Token blacklist (in production, use Redis with TTL)
        self.blacklisted_tokens = set()
        self.refresh_tokens = {}  # Store refresh tokens securely
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a secure access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=self.settings.jwt_expiration_hours)
        
        # Add security claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "iss": "jobflow-api",  # Issuer
            "aud": "jobflow-client",  # Audience
            "jti": secrets.token_hex(16),  # JWT ID for tracking/blacklisting
            "token_type": "access"
        })
        
        # Add a signature of critical data to prevent tampering
        if "sub" in to_encode:  # subject (user ID)
            to_encode["sig"] = self._create_data_signature(to_encode["sub"])
        
        try:
            encoded_jwt = jwt.encode(
                to_encode, 
                self.settings.jwt_secret_key, 
                algorithm=self.settings.jwt_algorithm
            )
            
            logger.info(f"Access token created for user: {data.get('sub', 'unknown')}")
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"Failed to create access token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create access token"
            )
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create a secure refresh token"""
        refresh_data = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(days=self.settings.jwt_refresh_expiration_days),
            "iat": datetime.utcnow(),
            "iss": "jobflow-api",
            "aud": "jobflow-client",
            "jti": secrets.token_hex(16),
            "token_type": "refresh",
            "sig": self._create_data_signature(user_id)
        }
        
        try:
            refresh_token = jwt.encode(
                refresh_data,
                self.settings.jwt_secret_key,
                algorithm=self.settings.jwt_algorithm
            )
            
            # Store refresh token securely (in production, use encrypted storage)
            token_id = refresh_data["jti"]
            self.refresh_tokens[token_id] = {
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "last_used": datetime.utcnow()
            }
            
            logger.info(f"Refresh token created for user: {user_id}")
            return refresh_token
            
        except Exception as e:
            logger.error(f"Failed to create refresh token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create refresh token"
            )
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode a JWT token with comprehensive security checks"""
        try:
            # First check if token is blacklisted
            if self._is_token_blacklisted(token):
                logger.warning(f"Attempted use of blacklisted token")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            # Decode and verify token
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
                audience="jobflow-client",
                issuer="jobflow-api"
            )
            
            # Verify token type
            if payload.get("token_type") != token_type:
                logger.warning(f"Token type mismatch. Expected: {token_type}, Got: {payload.get('token_type')}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            # Verify data signature
            if "sub" in payload and "sig" in payload:
                expected_sig = self._create_data_signature(payload["sub"])
                if not hmac.compare_digest(payload["sig"], expected_sig):
                    logger.error(f"Token signature verification failed for user: {payload['sub']}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token signature invalid"
                    )
            
            # Additional checks for refresh tokens
            if token_type == "refresh":
                jti = payload.get("jti")
                if jti not in self.refresh_tokens:
                    logger.warning(f"Unknown refresh token used: {jti}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid refresh token"
                    )
                
                # Update last used timestamp
                self.refresh_tokens[jti]["last_used"] = datetime.utcnow()
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.info("Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed"
            )
    
    def blacklist_token(self, token: str) -> bool:
        """Add token to blacklist (for logout)"""
        try:
            # Decode without verification to get JTI
            payload = jwt.decode(token, options={"verify_signature": False})
            jti = payload.get("jti")
            
            if jti:
                self.blacklisted_tokens.add(jti)
                
                # If it's a refresh token, remove from storage
                if payload.get("token_type") == "refresh" and jti in self.refresh_tokens:
                    del self.refresh_tokens[jti]
                
                logger.info(f"Token blacklisted: {jti}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
        
        return False
    
    def revoke_all_user_tokens(self, user_id: str) -> int:
        """Revoke all tokens for a specific user"""
        revoked_count = 0
        
        # Remove all refresh tokens for this user
        to_remove = []
        for jti, token_data in self.refresh_tokens.items():
            if token_data["user_id"] == user_id:
                to_remove.append(jti)
                self.blacklisted_tokens.add(jti)
                revoked_count += 1
        
        for jti in to_remove:
            del self.refresh_tokens[jti]
        
        logger.info(f"Revoked {revoked_count} tokens for user: {user_id}")
        return revoked_count
    
    def refresh_access_token(self, refresh_token: str) -> str:
        """Create new access token from valid refresh token"""
        # Verify refresh token
        payload = self.verify_token(refresh_token, "refresh")
        user_id = payload["sub"]
        
        # Create new access token
        access_token_data = {
            "sub": user_id,
            # Add any additional claims here
        }
        
        return self.create_access_token(access_token_data)
    
    def get_token_info(self, token: str) -> Dict[str, Any]:
        """Get information about a token without fully validating it"""
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return {
                "user_id": payload.get("sub"),
                "token_type": payload.get("token_type"),
                "expires_at": datetime.fromtimestamp(payload.get("exp", 0)),
                "issued_at": datetime.fromtimestamp(payload.get("iat", 0)),
                "is_expired": datetime.fromtimestamp(payload.get("exp", 0)) < datetime.utcnow(),
                "jti": payload.get("jti")
            }
        except Exception:
            return {}
    
    def _create_data_signature(self, data: str) -> str:
        """Create HMAC signature for critical data"""
        return hmac.new(
            self.settings.jwt_secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def _is_token_blacklisted(self, token: str) -> bool:
        """Check if token is in blacklist"""
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            jti = payload.get("jti")
            return jti in self.blacklisted_tokens
        except:
            return True  # If we can't decode, assume it's invalid
    
    def cleanup_expired_tokens(self):
        """Clean up expired refresh tokens and blacklist entries"""
        current_time = datetime.utcnow()
        
        # Clean up expired refresh tokens
        expired_refresh_tokens = []
        for jti, token_data in self.refresh_tokens.items():
            # Remove tokens older than expiration period
            if (current_time - token_data["created_at"]).days > self.settings.jwt_refresh_expiration_days:
                expired_refresh_tokens.append(jti)
        
        for jti in expired_refresh_tokens:
            del self.refresh_tokens[jti]
            self.blacklisted_tokens.discard(jti)
        
        logger.info(f"Cleaned up {len(expired_refresh_tokens)} expired refresh tokens")

# Global JWT handler instance
jwt_handler = SecureJWTHandler()

def get_jwt_handler() -> SecureJWTHandler:
    """Get JWT handler instance"""
    return jwt_handler

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Convenience function to create access token"""
    return jwt_handler.create_access_token(data, expires_delta)

def verify_token(token: str) -> Dict[str, Any]:
    """Convenience function to verify token"""
    return jwt_handler.verify_token(token)