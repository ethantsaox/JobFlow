from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from starlette.responses import PlainTextResponse
import re
import logging
from typing import List
from app.core.security_config import get_security_settings

logger = logging.getLogger(__name__)

class SecureCORSMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS middleware with additional security checks"""
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_security_settings()
        
        # Compile allowed origins patterns for efficiency
        self.allowed_origin_patterns = []
        for origin in self.settings.get_cors_origins():
            if "*" in origin:
                # Convert wildcard to regex
                pattern = origin.replace("*", r"[^/]*").replace(".", r"\.")
                self.allowed_origin_patterns.append(re.compile(f"^{pattern}$"))
            else:
                # Exact match
                self.allowed_origin_patterns.append(re.compile(f"^{re.escape(origin)}$"))
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Pre-flight request handling
        if request.method == "OPTIONS":
            return await self._handle_preflight(request, origin)
        
        # Process the actual request
        response = await call_next(request)
        
        # Add CORS headers to response
        if origin and self._is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Expose-Headers"] = "Content-Range, X-Content-Range"
        else:
            # Log suspicious origins
            if origin:
                logger.warning(f"Blocked CORS request from unauthorized origin: {origin}")
        
        return response
    
    async def _handle_preflight(self, request: Request, origin: str) -> Response:
        """Handle CORS preflight requests"""
        if not origin or not self._is_origin_allowed(origin):
            logger.warning(f"Blocked CORS preflight from unauthorized origin: {origin}")
            return PlainTextResponse("Forbidden", status_code=403)
        
        # Get requested method and headers
        requested_method = request.headers.get("access-control-request-method")
        requested_headers = request.headers.get("access-control-request-headers", "")
        
        # Validate requested method
        allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        if requested_method not in allowed_methods:
            logger.warning(f"Blocked CORS request with unauthorized method: {requested_method}")
            return PlainTextResponse("Method not allowed", status_code=405)
        
        # Validate requested headers
        if not self._are_headers_allowed(requested_headers):
            logger.warning(f"Blocked CORS request with unauthorized headers: {requested_headers}")
            return PlainTextResponse("Headers not allowed", status_code=403)
        
        # Return successful preflight response
        response = PlainTextResponse("OK", status_code=200)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = ", ".join(allowed_methods)
        response.headers["Access-Control-Allow-Headers"] = self._get_allowed_headers()
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
        
        return response
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed"""
        if not origin:
            return False
        
        # Check against all allowed origin patterns
        for pattern in self.allowed_origin_patterns:
            if pattern.match(origin):
                return True
        
        return False
    
    def _are_headers_allowed(self, requested_headers: str) -> bool:
        """Validate requested headers"""
        if not requested_headers:
            return True
        
        allowed_headers = {
            "accept",
            "accept-language",
            "content-language",
            "content-type",
            "authorization",
            "x-requested-with",
            "x-api-key",
            "cache-control",
            "pragma"
        }
        
        headers = [h.strip().lower() for h in requested_headers.split(",")]
        
        for header in headers:
            if header not in allowed_headers:
                return False
        
        return True
    
    def _get_allowed_headers(self) -> str:
        """Get comma-separated list of allowed headers"""
        return "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-API-Key, Cache-Control, Pragma"

def setup_cors_middleware(app):
    """Setup CORS middleware with security configurations"""
    settings = get_security_settings()
    
    if not settings.enable_cors:
        logger.info("CORS disabled by configuration")
        return
    
    # Add our secure CORS middleware
    app.add_middleware(SecureCORSMiddleware)
    
    # Also add FastAPI's CORS middleware for additional features
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400  # 24 hours
    )
    
    logger.info(f"CORS configured for origins: {settings.get_cors_origins()}")

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_security_settings()
        self.csrf_exempt_paths = {
            "/health",
            "/docs",
            "/openapi.json",
            "/api/auth/login",  # Login needs to work without CSRF token initially
        }
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF protection for safe methods
        if request.method in ["GET", "HEAD", "OPTIONS", "TRACE"]:
            return await call_next(request)
        
        # Skip for exempt paths
        if request.url.path in self.csrf_exempt_paths:
            return await call_next(request)
        
        # Skip CSRF if disabled
        if not self.settings.enable_csrf_protection:
            return await call_next(request)
        
        # Check for CSRF token
        csrf_token = request.headers.get("x-csrf-token")
        
        # For authenticated requests, validate CSRF token
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            if not csrf_token:
                logger.warning(f"CSRF token missing for authenticated request: {request.url.path}")
                return PlainTextResponse("CSRF token required", status_code=403)
            
            # Here you would validate the CSRF token against the session
            # For now, we'll accept any non-empty token
            if not self._validate_csrf_token(csrf_token, request):
                logger.warning(f"Invalid CSRF token for request: {request.url.path}")
                return PlainTextResponse("Invalid CSRF token", status_code=403)
        
        return await call_next(request)
    
    def _validate_csrf_token(self, token: str, request: Request) -> bool:
        """Validate CSRF token"""
        # In a real implementation, you would:
        # 1. Extract user session from JWT
        # 2. Compare token against stored session token
        # 3. Check token expiration
        # For now, just check it's not empty
        return bool(token and len(token) > 10)

def setup_csrf_protection(app):
    """Setup CSRF protection middleware"""
    settings = get_security_settings()
    
    if settings.enable_csrf_protection:
        app.add_middleware(CSRFProtectionMiddleware)
        logger.info("CSRF protection enabled")
    else:
        logger.info("CSRF protection disabled")