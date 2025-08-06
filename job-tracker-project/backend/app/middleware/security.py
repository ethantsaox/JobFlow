from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from collections import defaultdict
from typing import Dict
import logging
import re
import os

# Setup security logging
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.WARNING)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - SECURITY - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
security_logger.addHandler(handler)

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Rate limiting storage (in production, use Redis)
        self.rate_limit_storage: Dict[str, list] = defaultdict(list)
        self.failed_login_attempts: Dict[str, list] = defaultdict(list)
        
        # Security patterns to detect attacks
        self.sql_injection_patterns = [
            r"(\bunion\b.*\bselect\b)",
            r"(\bselect\b.*\bfrom\b)",
            r"(\binsert\b.*\binto\b)",
            r"(\bdelete\b.*\bfrom\b)",
            r"(\bdrop\b.*\btable\b)",
            r"(\bexec\b.*\()",
            r"(\bscript\b.*\balert\b)",
            r"(<script[^>]*>.*?</script>)",
            r"(javascript:)",
            r"(on\w+\s*=)",
            r"(\b0x[0-9a-f]+)",
            r"(\'\s*or\s*\'\w*\'\s*=\s*\'\w*)",
            r"(\'\s*or\s*1\s*=\s*1)",
            r"(\'\s*or\s*\"\"=\"\")",
            r"(\'\s*or\s*1=1\s*--)",
            r"(\'\s*or\s*1=1\s*#)",
            r"(\bunion\s+all\s+select)",
            r"(\bwaitfor\b.*\bdelay\b)"
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"vbscript:",
            r"expression\s*\(",
            r"<link[^>]*>",
            r"<meta[^>]*>"
        ]

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = self.get_client_ip(request)
        
        # Skip security checks for health check endpoints
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            response = await call_next(request)
            return response
            
        # 1. Rate limiting
        if self.is_rate_limited(client_ip, request.url.path):
            security_logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        # 2. Check for malicious patterns in query parameters and body
        if await self.contains_malicious_patterns(request):
            security_logger.error(f"Malicious request detected from IP {client_ip}: {request.url}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request format"}
            )
        
        # 3. Validate content length
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                security_logger.warning(f"Large request rejected from IP {client_ip}: {content_length} bytes")
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large"}
                )
        
        # Process request
        response = await call_next(request)
        
        # 4. Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
        
        # Force HTTPS in production
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # 5. Log failed login attempts
        if request.url.path == "/api/auth/login" and response.status_code == 401:
            self.record_failed_login(client_ip)
            if self.is_login_brute_force(client_ip):
                security_logger.error(f"Brute force login attempt detected from IP {client_ip}")
        
        # 6. Log suspicious activity
        process_time = time.time() - start_time
        if process_time > 5.0:  # Slow requests might indicate attacks
            security_logger.warning(f"Slow request from IP {client_ip}: {request.url.path} took {process_time:.2f}s")
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP, handling proxies safely"""
        # Check for forwarded headers (be careful with these in production)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP (leftmost) as it's usually the original client
            ip = forwarded_for.split(",")[0].strip()
            # Validate it's a proper IP
            if self.is_valid_ip(ip):
                return ip
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip and self.is_valid_ip(real_ip):
            return real_ip
            
        return request.client.host if request.client else "unknown"
    
    def is_valid_ip(self, ip: str) -> bool:
        """Basic IP validation"""
        try:
            parts = ip.split(".")
            if len(parts) != 4:
                return False
            for part in parts:
                if not (0 <= int(part) <= 255):
                    return False
            return True
        except:
            return False
    
    def is_rate_limited(self, ip: str, endpoint: str) -> bool:
        """Implement rate limiting per IP per endpoint"""
        current_time = time.time()
        key = f"{ip}:{endpoint}"
        
        # Clean old requests (older than 1 minute)
        self.rate_limit_storage[key] = [
            timestamp for timestamp in self.rate_limit_storage[key]
            if current_time - timestamp < 60
        ]
        
        # Different limits for different endpoints
        if endpoint.startswith("/api/auth/login"):
            limit = 5  # 5 login attempts per minute
        elif endpoint.startswith("/api/auth/"):
            limit = 10  # 10 auth requests per minute
        else:
            limit = 100  # 100 general requests per minute
        
        if len(self.rate_limit_storage[key]) >= limit:
            return True
        
        self.rate_limit_storage[key].append(current_time)
        return False
    
    def record_failed_login(self, ip: str):
        """Record failed login attempt"""
        current_time = time.time()
        # Keep only attempts from last 15 minutes
        self.failed_login_attempts[ip] = [
            timestamp for timestamp in self.failed_login_attempts[ip]
            if current_time - timestamp < 900  # 15 minutes
        ]
        self.failed_login_attempts[ip].append(current_time)
    
    def is_login_brute_force(self, ip: str) -> bool:
        """Check if IP is attempting brute force login"""
        return len(self.failed_login_attempts[ip]) >= 10  # 10 failed attempts in 15 minutes
    
    async def contains_malicious_patterns(self, request: Request) -> bool:
        """Check request for SQL injection, XSS, and other attacks"""
        # Check query parameters
        query_string = str(request.query_params).lower()
        for pattern in self.sql_injection_patterns + self.xss_patterns:
            if re.search(pattern, query_string, re.IGNORECASE):
                return True
        
        # Skip body checking for now to avoid interfering with FastAPI's body handling
        # TODO: Implement proper body scanning using receive() method or at route level
        
        return False

class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """Optional: Restrict access to admin endpoints by IP"""
    def __init__(self, app):
        super().__init__(app)
        # Add your trusted IPs here for admin endpoints
        self.admin_whitelist = set(os.getenv("ADMIN_IPS", "").split(","))
    
    async def dispatch(self, request: Request, call_next):
        # Only apply to admin endpoints
        if request.url.path.startswith("/admin/"):
            client_ip = request.client.host if request.client else "unknown"
            if client_ip not in self.admin_whitelist:
                security_logger.error(f"Unauthorized admin access attempt from IP {client_ip}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access forbidden"}
                )
        
        response = await call_next(request)
        return response