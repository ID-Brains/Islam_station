"""
Request/Response logging middleware for The Islamic Guidance Station
"""

import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..config import settings

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        # Get request start time
        start_time = time.time()

        # Extract request information
        method = request.method
        url = str(request.url)
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        content_length = request.headers.get("content-length", "0")

        # Log request
        logger.info(
            f"Request started: {method} {url}",
            extra={
                "event": "request_started",
                "correlation_id": correlation_id,
                "method": method,
                "url": url,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "content_length": content_length,
                "timestamp": start_time,
            },
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Extract response information
            status_code = response.status_code
            response_size = response.headers.get("content-length", "0")

            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id

            # Log response
            log_level = (
                "info"
                if status_code < 400
                else "warning" if status_code < 500 else "error"
            )
            getattr(logger, log_level)(
                f"Request completed: {method} {url} - {status_code} - {process_time:.3f}s",
                extra={
                    "event": "request_completed",
                    "correlation_id": correlation_id,
                    "method": method,
                    "url": url,
                    "status_code": status_code,
                    "process_time": process_time,
                    "response_size": response_size,
                    "client_ip": client_ip,
                    "timestamp": time.time(),
                },
            )

            return response

        except Exception as e:
            # Calculate processing time for failed requests
            process_time = time.time() - start_time

            # Log error
            logger.error(
                f"Request failed: {method} {url} - {str(e)} - {process_time:.3f}s",
                extra={
                    "event": "request_failed",
                    "correlation_id": correlation_id,
                    "method": method,
                    "url": url,
                    "error": str(e),
                    "process_time": process_time,
                    "client_ip": client_ip,
                    "timestamp": time.time(),
                },
                exc_info=True,
            )

            # Re-raise the exception
            raise

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


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured JSON logging"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only apply structured logging if enabled
        if not getattr(settings, "LOG_FORMAT", "text") == "json":
            return await call_next(request)

        correlation_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id

        # Add structured context to logger
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.correlation_id = correlation_id
            return record

        logging.setLogRecordFactory(record_factory)

        try:
            response = await call_next(request)
            return response
        finally:
            # Restore original record factory
            logging.setLogRecordFactory(old_factory)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Add CORS headers if not already set
        if "access-control-allow-origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = "*"

        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request size"""

    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Request too large. Maximum size is {self.max_size} bytes",
            )

        return await call_next(request)
