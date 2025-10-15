"""
Enhanced rate limiting middleware for The Islamic Guidance Station
"""

import time
from typing import Callable, Dict, List
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from ..config import settings
from ..dependencies.rate_limit import rate_limiter


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to all requests"""

    def __init__(self, app, default_limits: Dict[str, int] = None):
        super().__init__(app)
        self.default_limits = default_limits or {
            "requests": settings.RATE_LIMIT_REQUESTS,
            "window": settings.RATE_LIMIT_WINDOW,
        }

        # Define rate limits for different endpoint patterns
        self.endpoint_limits = {
            # Health checks - more lenient
            r"/health.*": {"requests": 1000, "window": 60},
            # Search endpoints - moderate
            r"/api/.*search": {"requests": 60, "window": 60},
            r"/api/quran/search": {"requests": 60, "window": 60},
            # Data endpoints - standard
            r"/api/quran/surah": {"requests": 100, "window": 60},
            r"/api/quran/random": {"requests": 30, "window": 60},
            r"/api/mosque/nearby": {"requests": 50, "window": 60},
            r"/api/prayer/pTimes": {"requests": 30, "window": 60},
            # Dhikr endpoints - moderate
            r"/api/dhikr/daily": {"requests": 20, "window": 60},
            r"/api/dhikr/random": {"requests": 30, "window": 60},
            # Static assets - very lenient
            r"/static.*": {"requests": 1000, "window": 60},
            r"/favicon.*": {"requests": 1000, "window": 60},
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting if disabled
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Get client identifier
        identifier = self._get_identifier(request)

        # Get rate limit for this endpoint
        limit_config = self._get_limit_config(request)

        # Check rate limit
        if not rate_limiter.is_allowed(
            identifier, limit_config["requests"], limit_config["window"]
        ):
            # Get rate limit info for headers
            rate_info = rate_limiter.get_remaining(
                identifier, limit_config["requests"], limit_config["window"]
            )

            # Raise HTTP exception with rate limit headers
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": rate_info["limit"],
                    "remaining": rate_info["remaining"],
                    "reset": rate_info["reset"],
                    "retry_after": max(0, rate_info["reset"] - int(time.time())),
                    "window": limit_config["window"],
                },
                headers={
                    "X-RateLimit-Limit": str(rate_info["limit"]),
                    "X-RateLimit-Remaining": str(rate_info["remaining"]),
                    "X-RateLimit-Reset": str(rate_info["reset"]),
                    "X-RateLimit-Window": str(limit_config["window"]),
                    "Retry-After": str(max(0, rate_info["reset"] - int(time.time()))),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers to successful responses
        rate_info = rate_limiter.get_remaining(
            identifier, limit_config["requests"], limit_config["window"]
        )

        response.headers["X-RateLimit-Limit"] = str(rate_info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(rate_info["reset"])
        response.headers["X-RateLimit-Window"] = str(limit_config["window"])

        return response

    def _get_identifier(self, request: Request) -> str:
        """Get identifier for rate limiting (IP-based only - no authentication)"""
        # Use IP address as identifier (open access platform)
        client_ip = self._get_client_ip(request)
        return f"ip:{client_ip}"

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded IP addresses
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the list
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"

    def _get_limit_config(self, request: Request) -> Dict[str, int]:
        """Get rate limit configuration for the current endpoint"""
        import re

        path = request.url.path

        # Check against endpoint patterns
        for pattern, config in self.endpoint_limits.items():
            if re.match(pattern, path):
                return config

        # Return default limits
        return self.default_limits


class AdvancedRateLimitingMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting with multiple strategies"""

    def __init__(self, app):
        super().__init__(app)
        self.request_counts: Dict[str, List[float]] = {}
        self.blocked_ips: Dict[str, float] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting if disabled
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()

        # Check if IP is temporarily blocked
        if client_ip in self.blocked_ips:
            if current_time < self.blocked_ips[client_ip]:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="IP address temporarily blocked due to excessive requests",
                )
            else:
                # Unblock after timeout
                del self.blocked_ips[client_ip]

        # Apply rate limiting
        if not self._check_rate_limit(client_ip, current_time):
            # Block IP for 5 minutes if rate limit exceeded
            self.blocked_ips[client_ip] = current_time + 300

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. IP temporarily blocked.",
            )

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _check_rate_limit(self, client_ip: str, current_time: float) -> bool:
        """Check if client has exceeded rate limit"""
        window_size = settings.RATE_LIMIT_WINDOW
        max_requests = settings.RATE_LIMIT_REQUESTS

        # Initialize client tracking if needed
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = []

        # Clean old requests outside the window
        self.request_counts[client_ip] = [
            req_time
            for req_time in self.request_counts[client_ip]
            if current_time - req_time < window_size
        ]

        # Check if under limit
        if len(self.request_counts[client_ip]) < max_requests:
            self.request_counts[client_ip].append(current_time)
            return True

        return False


class RateLimitHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add rate limit headers to responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add rate limit headers if rate limiting is enabled
        if settings.RATE_LIMIT_ENABLED and hasattr(request.state, "rate_limit_info"):
            rate_info = request.state.rate_limit_info

            response.headers["X-RateLimit-Limit"] = str(rate_info.get("limit", ""))
            response.headers["X-RateLimit-Remaining"] = str(
                rate_info.get("remaining", "")
            )
            response.headers["X-RateLimit-Reset"] = str(rate_info.get("reset", ""))

        return response
