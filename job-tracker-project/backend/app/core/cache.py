from functools import wraps
import json
import hashlib
from typing import Any, Optional
from datetime import datetime, timedelta
import redis.asyncio as redis
import os
from app.core.config import settings

# In-memory cache as fallback
_memory_cache = {}

class CacheManager:
    def __init__(self):
        self.redis_client = None
        self.use_redis = False
        
    async def init_redis(self):
        """Initialize Redis connection if available"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.from_url(redis_url)
            await self.redis_client.ping()
            self.use_redis = True
            print("Redis cache initialized successfully")
        except Exception as e:
            print(f"Redis not available, using memory cache: {e}")
            self.use_redis = False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.use_redis and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                print(f"Redis get error: {e}")
                
        # Fallback to memory cache
        cache_item = _memory_cache.get(key)
        if cache_item and cache_item['expires'] > datetime.now():
            return cache_item['data']
        elif cache_item:
            # Expired, remove it
            del _memory_cache[key]
        
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL in seconds"""
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, json.dumps(value, default=str))
                return
            except Exception as e:
                print(f"Redis set error: {e}")
        
        # Fallback to memory cache
        _memory_cache[key] = {
            'data': value,
            'expires': datetime.now() + timedelta(seconds=ttl)
        }
    
    async def delete(self, key: str):
        """Delete value from cache"""
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception:
                pass
        
        # Remove from memory cache
        _memory_cache.pop(key, None)
    
    async def clear_user_cache(self, user_id: str):
        """Clear all cache entries for a user"""
        pattern = f"analytics:{user_id}:*"
        
        if self.use_redis and self.redis_client:
            try:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
            except Exception:
                pass
        
        # Clear from memory cache
        keys_to_delete = [k for k in _memory_cache.keys() if k.startswith(f"analytics:{user_id}:")]
        for key in keys_to_delete:
            del _memory_cache[key]

# Global cache instance
cache = CacheManager()

def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_data = {
                'func': func.__name__,
                'args': str(args),
                'kwargs': str(sorted(kwargs.items()))
            }
            key_hash = hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}" if key_prefix else key_hash
            
            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def analytics_cache(ttl: int = 300):
    """Specific cache decorator for analytics endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id from arguments
            user_id = None
            for arg in args:
                if hasattr(arg, 'id'):
                    user_id = str(arg.id)
                    break
            
            if not user_id:
                # If no user found, execute without caching
                return await func(*args, **kwargs)
            
            # Generate cache key
            func_name = func.__name__
            params_hash = hashlib.md5(str(sorted(kwargs.items())).encode()).hexdigest()
            cache_key = f"analytics:{user_id}:{func_name}:{params_hash}"
            
            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

# Initialize cache on startup
async def init_cache():
    """Initialize cache system"""
    await cache.init_redis()