"""
Structured logging configuration for JobFlow
Provides JSON logging for production with proper security filtering
"""

import logging
import logging.config
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Try to import pythonjsonlogger, fallback to standard logging if not available
try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False
    jsonlogger = None

from app.core.config import settings

class SecurityFilter(logging.Filter):
    """Filter to remove sensitive information from logs"""
    
    SENSITIVE_KEYS = {
        'password', 'token', 'secret', 'key', 'authorization', 
        'jwt', 'cookie', 'session', 'auth', 'api_key',
        'client_secret', 'access_token', 'refresh_token'
    }
    
    def filter(self, record):
        """Filter out sensitive information from log records"""
        # Filter message content
        if hasattr(record, 'msg') and isinstance(record.msg, str):
            for sensitive in self.SENSITIVE_KEYS:
                if sensitive in record.msg.lower():
                    # Replace with placeholder if contains sensitive data
                    record.msg = record.msg.replace(
                        record.msg, 
                        f"[FILTERED: contains {sensitive}]"
                    )
        
        # Filter extra data
        if hasattr(record, '__dict__'):
            for key, value in list(record.__dict__.items()):
                if any(sens in key.lower() for sens in self.SENSITIVE_KEYS):
                    record.__dict__[key] = "[FILTERED]"
                elif isinstance(value, str):
                    for sensitive in self.SENSITIVE_KEYS:
                        if sensitive in value.lower() and len(value) > 10:
                            record.__dict__[key] = "[FILTERED]"
        
        return True

class CustomJSONFormatter(jsonlogger.JsonFormatter if HAS_JSON_LOGGER else logging.Formatter):
    """Custom JSON formatter with additional context"""
    
    def __init__(self, *args, **kwargs):
        if HAS_JSON_LOGGER:
            super().__init__(*args, **kwargs)
        else:
            # Fallback to standard formatter
            super().__init__('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    def add_fields(self, log_record, record, message_dict):
        if HAS_JSON_LOGGER:
            super().add_fields(log_record, record, message_dict)
            
            # Add standard fields
            log_record['timestamp'] = datetime.utcnow().isoformat()
            log_record['level'] = record.levelname
            log_record['logger'] = record.name
            log_record['environment'] = settings.environment
            
            # Add process information
            log_record['process_id'] = os.getpid()
            
            # Add request context if available
            if hasattr(record, 'request_id'):
                log_record['request_id'] = record.request_id
            if hasattr(record, 'user_id'):
                log_record['user_id'] = record.user_id
            if hasattr(record, 'ip_address'):
                log_record['ip_address'] = record.ip_address
            
            # Add performance metrics if available
            if hasattr(record, 'duration'):
                log_record['duration_ms'] = record.duration
            if hasattr(record, 'status_code'):
                log_record['status_code'] = record.status_code

def get_logging_config() -> Dict[str, Any]:
    """Get logging configuration based on environment"""
    
    log_level = settings.log_level.upper()
    
    # Base configuration
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': CustomJSONFormatter,
                'format': '%(timestamp)s %(level)s %(name)s %(message)s' if HAS_JSON_LOGGER else '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
            'console': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'filters': {
            'security_filter': {
                '()': SecurityFilter,
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'json' if (settings.environment == 'production' and HAS_JSON_LOGGER) else 'console',
                'filters': ['security_filter'],
                'stream': sys.stdout
            }
        },
        'loggers': {
            'app': {
                'level': log_level,
                'handlers': ['console'],
                'propagate': False
            },
            'fastapi': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'uvicorn': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'sqlalchemy.engine': {
                'level': 'WARNING' if settings.environment == 'production' else 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'alembic': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            },
            'security': {
                'level': 'WARNING',
                'handlers': ['console'],
                'propagate': False
            }
        },
        'root': {
            'level': log_level,
            'handlers': ['console']
        }
    }
    
    # Add file logging for production
    if settings.environment == 'production':
        # Create logs directory
        log_dir = '/app/logs'
        os.makedirs(log_dir, exist_ok=True)
        
        # Add file handlers
        config['handlers'].update({
            'file_app': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'json',
                'filters': ['security_filter'],
                'filename': f'{log_dir}/app.log',
                'maxBytes': 100 * 1024 * 1024,  # 100MB
                'backupCount': 5,
                'encoding': 'utf-8'
            },
            'file_security': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'WARNING',
                'formatter': 'json',
                'filters': ['security_filter'],
                'filename': f'{log_dir}/security.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            },
            'file_error': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json',
                'filters': ['security_filter'],
                'filename': f'{log_dir}/error.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            }
        })
        
        # Update loggers to use file handlers
        for logger_name in ['app', 'fastapi', 'uvicorn', 'sqlalchemy.engine', 'alembic']:
            config['loggers'][logger_name]['handlers'].extend(['file_app', 'file_error'])
        
        config['loggers']['security']['handlers'].extend(['file_security', 'file_error'])
    
    return config

def setup_logging():
    """Setup logging configuration"""
    config = get_logging_config()
    logging.config.dictConfig(config)
    
    # Log startup message
    logger = logging.getLogger('app.startup')
    logger.info(
        "Logging configured successfully",
        extra={
            'environment': settings.environment,
            'log_level': settings.log_level,
            'json_logging': settings.environment == 'production'
        }
    )

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(f'app.{name}')

# Performance monitoring context manager
class LogExecutionTime:
    """Context manager to log execution time of operations"""
    
    def __init__(self, logger: logging.Logger, operation: str, level: int = logging.INFO):
        self.logger = logger
        self.operation = operation
        self.level = level
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.log(self.level, f"Starting {self.operation}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration = (datetime.utcnow() - self.start_time).total_seconds() * 1000
            
            if exc_type:
                self.logger.error(
                    f"Failed {self.operation}",
                    extra={'duration_ms': duration, 'error': str(exc_val)}
                )
            else:
                self.logger.log(
                    self.level,
                    f"Completed {self.operation}",
                    extra={'duration_ms': duration}
                )

# Request logging middleware helper
def log_request(logger: logging.Logger, request, response, duration_ms: float):
    """Log HTTP request with proper context"""
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            'method': request.method,
            'path': request.url.path,
            'status_code': response.status_code,
            'duration_ms': duration_ms,
            'ip_address': request.client.host if request.client else 'unknown',
            'user_agent': request.headers.get('user-agent', ''),
            'request_size': request.headers.get('content-length', 0)
        }
    )