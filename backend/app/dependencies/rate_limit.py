"""
Rate limiting dependencies for The Islamic Guidance Station
"""

from typing import Callable
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
from collections import defaultdict
from threading import Lock

from ..config import settings


# Initialize slowapi limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds"],
    storage_uri="memory://",  # Use memory storage (upgrade to Redis in production)
)


# In-memory rate limit storage (for simple implementation)
# In production, use Redis for distributed rate limiting
class InMemoryRateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = Lock()

    def is_allowed(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> bool:
        """
        Check if request is allowed based on rate limit

        Args:
            key: Unique identifier (IP address, user ID, etc.)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            True if request is allowed, False otherwise
        """
        current_time = time.time()
        cutoff_time = current_time - window_seconds

        with self.lock:
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > cutoff_time
            ]

            # Check if limit exceeded
            if len(self.requests[key]) >= max_requests:
                return False

            # Add current request
            self.requests[key].append(current_time)
            return True

    def get_remaining(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> dict:
        """
        Get remaining requests and reset time

        Args:
            key: Unique identifier
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            Dictionary with remaining requests and reset time
        """
        current_time = time.time()
        cutoff_time = current_time - window_seconds

        with self.lock:
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > cutoff_time
            ]

            remaining = max_requests - len(self.requests[key])
            oldest_request = min(self.requests[key]) if self.requests[key] else current_time
            reset_time = oldest_request + window_seconds

            return {
                "remaining": max(0, remaining),
                "reset": int(reset_time),
                "limit": max_requests,
                "used": len(self.requests[key])
            }

    def reset(self, key: str):
        """Reset rate limit for a key"""
        with self.lock:
            if key in self.requests:
                del self.requests[key]


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()


async def rate_limit_dependency(
    request: Request,
    max_requests: int = settings.RATE_LIMIT_REQUESTS,
    window_seconds: int = settings.RATE_LIMIT_WINDOW,
) -> None:
    """
    Rate limit dependency for FastAPI routes

    Args:
        request: FastAPI request object
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds

    Raises:
        HTTPException: If rate limit exceeded
    """
    # Get identifier (IP address or user ID if authenticated)
    identifier = request.client.host if request.client else "unknown"

    # Check if user is authenticated and use user ID instead
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from .auth import verify_token
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            identifier = f"user:{payload.get('sub')}"
        except Exception:
            pass  # Use IP if token verification fails

    # Check rate limit
    if not rate_limiter.is_allowed(identifier, max_requests, window_seconds):
        rate_info = rate_limiter.get_remaining(identifier, max_requests, window_seconds)

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": rate_info["limit"],
                "remaining": rate_info["remaining"],
                "reset": rate_info["reset"],
                "retry_after": rate_info["reset"] - int(time.time())
            },
            headers={
                "X-RateLimit-Limit": str(rate_info["limit"]),
                "X-RateLimit-Remaining": str(rate_info["remaining"]),
                "X-RateLimit-Reset": str(rate_info["reset"]),
                "Retry-After": str(max(0, rate_info["reset"] - int(time.time())))
            }
        )

    # Add rate limit headers to response
    rate_info = rate_limiter.get_remaining(identifier, max_requests, window_seconds)
    request.state.rate_limit_info = rate_info


def create_rate_limiter(max_requests: int, window_seconds: int) -> Callable:
    """
    Create a custom rate limiter dependency

    Args:
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds

    Returns:
        Rate limiter dependency function
    """
    async def custom_rate_limit(request: Request):
        await rate_limit_dependency(request, max_requests, window_seconds)

    return custom_rate_limit


# Preset rate limiters for different use cases
strict_rate_limit = create_rate_limiter(max_requests=10, window_seconds=60)  # 10 req/min
moderate_rate_limit = create_rate_limiter(max_requests=60, window_seconds=60)  # 60 req/min
relaxed_rate_limit = create_rate_limiter(max_requests=200, window_seconds=60)  # 200 req/min


class RateLimitMiddleware:
    """
    Middleware to add rate limit headers to all responses
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Get request to access state
                from starlette.requests import Request
                request = Request(scope, receive)

                # Add rate limit headers if available
                if hasattr(request.state, "rate_limit_info"):
                    rate_info = request.state.rate_limit_info
                    headers = dict(message.get("headers", []))

                    headers[b"x-ratelimit-limit"] = str(rate_info["limit"]).encode()
                    headers[b"x-ratelimit-remaining"] = str(rate_info["remaining"]).encode()
                    headers[b"x-ratelimit-reset"] = str(rate_info["reset"]).encode()

                    message["headers"] = list(headers.items())

            await send(message)

        await self.app(scope, receive, send_wrapper)


# Helper function to get rate limit info for client
def get_rate_limit_status(identifier: str) -> dict:
    """
    Get current rate limit status for an identifier

    Args:
        identifier: Unique identifier (IP, user ID, etc.)

    Returns:
        Dictionary with rate limit status
    """
    return rate_limiter.get_remaining(
        identifier,
        settings.RATE_LIMIT_REQUESTS,
        settings.RATE_LIMIT_WINDOW
    )


# Helper function to reset rate limit (admin use)
def reset_rate_limit(identifier: str) -> None:
    """
    Reset rate limit for an identifier (admin function)

    Args:
        identifier: Unique identifier to reset
    """
    rate_limiter.reset(identifier)


# IP whitelist for bypassing rate limits (admin, monitoring services, etc.)
RATE_LIMIT_WHITELIST = [
    "127.0.0.1",  # localhost
    "::1",  # localhost IPv6
]


async def rate_limit_with_whitelist(request: Request) -> None:
    """
    Rate limit dependency that respects whitelist

    Args:
        request: FastAPI request object

    Raises:
        HTTPException: If rate limit exceeded and not whitelisted
    """
    if request.client and request.client.host in RATE_LIMIT_WHITELIST:
        return  # Skip rate limiting for whitelisted IPs

    await rate_limit_dependency(request)
