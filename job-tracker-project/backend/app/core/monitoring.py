"""
Application monitoring and metrics for JobFlow
Provides health checks, metrics collection, and performance monitoring
"""

import time
import logging
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    psutil = None
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger('monitoring')

class HealthChecker:
    """Application health checker"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.last_check = None
        self.check_results = {}
    
    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        try:
            start_time = time.time()
            db = SessionLocal()
            
            # Test basic connectivity
            result = db.execute(text("SELECT 1"))
            result.fetchone()
            
            # Check database metrics
            db_stats = db.execute(text("""
                SELECT 
                    numbackends as active_connections,
                    xact_commit as transactions_committed,
                    xact_rollback as transactions_rolled_back,
                    blks_read as blocks_read,
                    blks_hit as blocks_hit
                FROM pg_stat_database 
                WHERE datname = current_database()
            """)).fetchone()
            
            db.close()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': response_time,
                'active_connections': db_stats[0] if db_stats else 0,
                'cache_hit_ratio': (
                    db_stats[4] / (db_stats[3] + db_stats[4]) * 100 
                    if db_stats and (db_stats[3] + db_stats[4]) > 0 
                    else 0
                )
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance"""
        try:
            import redis
            start_time = time.time()
            
            # Parse Redis URL
            redis_client = redis.from_url(settings.redis_url)
            
            # Test basic connectivity
            redis_client.ping()
            
            # Get Redis info
            info = redis_client.info()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': response_time,
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_mb': info.get('used_memory', 0) / 1024 / 1024,
                'hit_rate': info.get('keyspace_hits', 0) / (
                    info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1)
                ) * 100
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        if not HAS_PSUTIL:
            return {
                'status': 'warning',
                'message': 'psutil not available - install for detailed system monitoring'
            }
            
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            return {
                'status': 'healthy' if cpu_percent < 80 and memory.percent < 80 else 'warning',
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_mb': memory.available / 1024 / 1024,
                'disk_percent': disk.percent,
                'disk_free_gb': disk.free / 1024 / 1024 / 1024
            }
        except Exception as e:
            logger.error(f"System resource check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get overall application health status"""
        self.last_check = datetime.utcnow()
        
        # Run all health checks
        checks = {
            'database': await self.check_database(),
            'redis': await self.check_redis(),
            'system': self.check_system_resources()
        }
        
        # Determine overall status
        statuses = [check['status'] for check in checks.values()]
        if 'unhealthy' in statuses:
            overall_status = 'unhealthy'
        elif 'warning' in statuses:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        # Calculate uptime
        uptime = datetime.utcnow() - self.start_time
        
        health_report = {
            'status': overall_status,
            'timestamp': self.last_check.isoformat(),
            'uptime_seconds': uptime.total_seconds(),
            'environment': settings.environment,
            'version': '1.0.0',
            'checks': checks
        }
        
        self.check_results = health_report
        return health_report

class MetricsCollector:
    """Application metrics collector"""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.response_times = []
        self.endpoint_metrics = {}
        self.start_time = datetime.utcnow()
    
    def record_request(self, method: str, path: str, status_code: int, response_time_ms: float):
        """Record request metrics"""
        self.request_count += 1
        self.total_response_time += response_time_ms
        self.response_times.append(response_time_ms)
        
        # Keep only last 1000 response times for memory efficiency
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]
        
        if status_code >= 400:
            self.error_count += 1
        
        # Track per-endpoint metrics
        endpoint_key = f"{method} {path}"
        if endpoint_key not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint_key] = {
                'count': 0,
                'total_time': 0.0,
                'errors': 0
            }
        
        self.endpoint_metrics[endpoint_key]['count'] += 1
        self.endpoint_metrics[endpoint_key]['total_time'] += response_time_ms
        if status_code >= 400:
            self.endpoint_metrics[endpoint_key]['errors'] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics summary"""
        uptime = datetime.utcnow() - self.start_time
        
        # Calculate percentiles
        if self.response_times:
            sorted_times = sorted(self.response_times)
            percentiles = {
                'p50': sorted_times[int(len(sorted_times) * 0.5)],
                'p90': sorted_times[int(len(sorted_times) * 0.9)],
                'p95': sorted_times[int(len(sorted_times) * 0.95)],
                'p99': sorted_times[int(len(sorted_times) * 0.99)]
            }
        else:
            percentiles = {'p50': 0, 'p90': 0, 'p95': 0, 'p99': 0}
        
        return {
            'uptime_seconds': uptime.total_seconds(),
            'requests_total': self.request_count,
            'errors_total': self.error_count,
            'error_rate': self.error_count / max(self.request_count, 1) * 100,
            'avg_response_time_ms': self.total_response_time / max(self.request_count, 1),
            'response_time_percentiles': percentiles,
            'requests_per_second': self.request_count / max(uptime.total_seconds(), 1),
            'endpoint_metrics': {
                endpoint: {
                    'count': metrics['count'],
                    'avg_response_time_ms': metrics['total_time'] / max(metrics['count'], 1),
                    'error_rate': metrics['errors'] / max(metrics['count'], 1) * 100
                }
                for endpoint, metrics in self.endpoint_metrics.items()
            }
        }

class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for monitoring requests and responses"""
    
    def __init__(self, app, metrics_collector: MetricsCollector):
        super().__init__(app)
        self.metrics = metrics_collector
        self.logger = get_logger('requests')
    
    async def dispatch(self, request: Request, call_next):
        # Skip monitoring for health checks
        if request.url.path in ['/health', '/metrics']:
            return await call_next(request)
        
        start_time = time.time()
        
        # Generate request ID for tracing
        request_id = f"req_{int(time.time() * 1000000)}"
        
        try:
            response = await call_next(request)
            response_time_ms = (time.time() - start_time) * 1000
            
            # Record metrics
            self.metrics.record_request(
                request.method,
                request.url.path,
                response.status_code,
                response_time_ms
            )
            
            # Log request
            self.logger.info(
                f"{request.method} {request.url.path}",
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'path': request.url.path,
                    'status_code': response.status_code,
                    'duration_ms': response_time_ms,
                    'ip_address': request.client.host if request.client else 'unknown',
                    'user_agent': request.headers.get('user-agent', ''),
                    'content_length': response.headers.get('content-length', 0)
                }
            )
            
            # Add response headers
            response.headers['X-Request-ID'] = request_id
            response.headers['X-Response-Time'] = f"{response_time_ms:.2f}ms"
            
            return response
            
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            
            # Record error metrics
            self.metrics.record_request(
                request.method,
                request.url.path,
                500,
                response_time_ms
            )
            
            # Log error
            self.logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'path': request.url.path,
                    'duration_ms': response_time_ms,
                    'error': str(e),
                    'ip_address': request.client.host if request.client else 'unknown'
                }
            )
            
            raise

# Global instances
health_checker = HealthChecker()
metrics_collector = MetricsCollector()

def setup_monitoring():
    """Setup monitoring and metrics collection"""
    logger.info("Monitoring system initialized")
    return health_checker, metrics_collector