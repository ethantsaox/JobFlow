import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending password reset and other emails"""
    
    def __init__(self):
        # For development, we'll use console logging instead of real email
        # In production, you would configure SMTP settings
        self.smtp_server = getattr(settings, 'smtp_server', None)
        self.smtp_port = getattr(settings, 'smtp_port', 587)
        self.smtp_username = getattr(settings, 'smtp_username', None)
        self.smtp_password = getattr(settings, 'smtp_password', None)
        self.from_email = getattr(settings, 'from_email', 'noreply@jobflow.com')
        
    async def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str = "User") -> bool:
        """Send password reset email with reset link"""
        try:
            # Create reset link (in production, this would be your frontend URL)
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
            
            subject = "Reset Your JobFlow Password"
            
            # HTML email template
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reset Your Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">JobFlow</h1>
                </div>
                
                <h2 style="color: #374151;">Reset Your Password</h2>
                
                <p>Hi {user_name},</p>
                
                <p>We received a request to reset your password for your JobFlow account. Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                        Reset Password
                    </a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{reset_link}</p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                    <strong>Security Note:</strong> This link will expire in 15 minutes for your security. If you didn't request this password reset, you can safely ignore this email.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    The JobFlow Team
                </p>
            </body>
            </html>
            """
            
            # Plain text version
            text_body = f"""
            Reset Your JobFlow Password
            
            Hi {user_name},
            
            We received a request to reset your password for your JobFlow account.
            
            Click this link to reset your password: {reset_link}
            
            This link will expire in 15 minutes for your security.
            
            If you didn't request this password reset, you can safely ignore this email.
            
            Best regards,
            The JobFlow Team
            """
            
            # For development, log the email instead of sending
            if not self.smtp_server:
                logger.info(f"=== PASSWORD RESET EMAIL ===")
                logger.info(f"To: {to_email}")
                logger.info(f"Subject: {subject}")
                logger.info(f"Reset Link: {reset_link}")
                logger.info(f"=== END EMAIL ===")
                return True
            
            # In production, actually send the email
            return await self._send_email(to_email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {e}")
            return False
    
    async def send_password_change_confirmation(self, to_email: str, user_name: str = "User") -> bool:
        """Send confirmation email after password is successfully changed"""
        try:
            subject = "Your JobFlow Password Has Been Changed"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Password Changed</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">JobFlow</h1>
                </div>
                
                <h2 style="color: #374151;">Password Successfully Changed</h2>
                
                <p>Hi {user_name},</p>
                
                <p>Your JobFlow password has been successfully changed. If you made this change, no further action is needed.</p>
                
                <p>If you did not make this change, please contact our support team immediately and consider securing your account.</p>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    The JobFlow Team
                </p>
            </body>
            </html>
            """
            
            text_body = f"""
            Password Successfully Changed
            
            Hi {user_name},
            
            Your JobFlow password has been successfully changed. If you made this change, no further action is needed.
            
            If you did not make this change, please contact our support team immediately.
            
            Best regards,
            The JobFlow Team
            """
            
            # For development, log the email
            if not self.smtp_server:
                logger.info(f"=== PASSWORD CHANGE CONFIRMATION ===")
                logger.info(f"To: {to_email}")
                logger.info(f"Subject: {subject}")
                logger.info(f"=== END EMAIL ===")
                return True
            
            return await self._send_email(to_email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"Failed to send password change confirmation to {to_email}: {e}")
            return False
    
    async def _send_email(self, to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        """Actually send email via SMTP (for production)"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Attach both plain text and HTML versions
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

# Global email service instance
email_service = EmailService()