from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password endpoint"""
    email: EmailStr = Field(..., description="User's email address")

class ForgotPasswordResponse(BaseModel):
    """Response schema for forgot password endpoint"""
    message: str = Field(..., description="Success message")
    
class ResetPasswordRequest(BaseModel):
    """Request schema for reset password endpoint"""
    token: str = Field(..., description="Password reset token from email")
    new_password: str = Field(
        ..., 
        min_length=8, 
        description="New password (minimum 8 characters)"
    )

class ResetPasswordResponse(BaseModel):
    """Response schema for reset password endpoint"""
    message: str = Field(..., description="Success message")