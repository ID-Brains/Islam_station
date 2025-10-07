"""
Exception handlers for The Islamic Guidance Station
"""

import logging
import traceback
from typing import Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .custom import (
    IslamicStationException,
    ValidationError,
    NotFoundError,
    DatabaseError,
    ExternalServiceError,
    RateLimitError,
    AuthenticationError,
    AuthorizationError,
)

logger = logging.getLogger(__name__)


def get_correlation_id(request: Request) -> str:
    """Get correlation ID from request or generate one"""
    return getattr(request.state, "correlation_id", "unknown")


def log_exception(request: Request, exc: Exception, level: str = "error") -> None:
    """Log exception with context"""
    correlation_id = get_correlation_id(request)

    log_data = {
        "correlation_id": correlation_id,
        "exception_type": type(exc).__name__,
        "message": str(exc),
        "path": str(request.url),
        "method": request.method,
        "client_ip": request.client.host if request.client else None,
    }

    # Add specific details for custom exceptions
    if isinstance(exc, IslamicStationException):
        log_data.update(
            {
                "error_code": getattr(exc, "error_code", None),
                "status_code": getattr(exc, "status_code", None),
                "details": getattr(exc, "details", {}),
            }
        )

    # Add traceback for unexpected exceptions
    if not isinstance(exc, IslamicStationException):
        log_data["traceback"] = traceback.format_exc()

    # Log with appropriate level
    if level == "error":
        logger.error(
            f"Exception: {log_data['exception_type']} - {log_data['message']}",
            extra=log_data,
        )
    elif level == "warning":
        logger.warning(
            f"Warning: {log_data['exception_type']} - {log_data['message']}",
            extra=log_data,
        )
    elif level == "info":
        logger.info(
            f"Info: {log_data['exception_type']} - {log_data['message']}",
            extra=log_data,
        )


async def islamic_station_exception_handler(
    request: Request, exc: IslamicStationException
) -> JSONResponse:
    """Handler for custom Islamic Station exceptions"""

    # Set correlation ID if not already set
    if not hasattr(request.state, "correlation_id"):
        request.state.correlation_id = exc.correlation_id or "unknown"

    # Log the exception
    log_exception(request, exc, "error")

    # Create response
    response_data = exc.to_dict()

    # Add rate limit headers for rate limit errors
    if isinstance(exc, RateLimitError):
        headers = {}
        if "retry_after" in exc.details:
            headers["Retry-After"] = str(exc.details["retry_after"])
        if "limit" in exc.details:
            headers["X-RateLimit-Limit"] = str(exc.details["limit"])
        if "reset_time" in exc.details:
            headers["X-RateLimit-Reset"] = str(exc.details["reset_time"])

        return JSONResponse(
            status_code=exc.status_code,
            content=response_data,
            headers=headers,
        )

    return JSONResponse(
        status_code=exc.status_code,
        content=response_data,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handler for FastAPI validation errors"""

    correlation_id = get_correlation_id(request)

    # Convert to custom validation error
    validation_error = ValidationError(
        message="Request validation failed",
        details={
            "validation_errors": exc.errors(),
            "field_count": len(exc.errors()),
        },
        correlation_id=correlation_id,
    )

    # Log the exception
    log_exception(request, validation_error, "warning")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=validation_error.to_dict(),
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handler for Starlette HTTP exceptions"""

    correlation_id = get_correlation_id(request)

    # Convert to custom exception
    if exc.status_code == 404:
        custom_exc = NotFoundError(
            resource="resource",
            identifier=str(request.url),
            correlation_id=correlation_id,
        )
    elif exc.status_code == 401:
        custom_exc = AuthenticationError(
            message=exc.detail or "Authentication required",
            correlation_id=correlation_id,
        )
    elif exc.status_code == 403:
        custom_exc = AuthorizationError(
            message=exc.detail or "Access denied",
            correlation_id=correlation_id,
        )
    elif exc.status_code == 429:
        custom_exc = RateLimitError(
            message=exc.detail or "Rate limit exceeded",
            correlation_id=correlation_id,
        )
    else:
        custom_exc = IslamicStationException(
            message=exc.detail or "HTTP error",
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
            correlation_id=correlation_id,
        )

    # Log the exception
    log_exception(request, custom_exc, "warning")

    return JSONResponse(
        status_code=custom_exc.status_code,
        content=custom_exc.to_dict(),
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for general/unhandled exceptions"""

    correlation_id = get_correlation_id(request)

    # Create generic error
    generic_error = IslamicStationException(
        message="An unexpected error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        details={
            "exception_type": type(exc).__name__,
            "original_message": (
                str(exc) if not isinstance(exc, Exception) else "Internal error"
            ),
        },
        correlation_id=correlation_id,
    )

    # Log the exception with full traceback
    log_exception(request, exc, "error")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=generic_error.to_dict(),
    )


async def database_exception_handler(
    request: Request, exc: DatabaseError
) -> JSONResponse:
    """Handler for database-specific exceptions"""

    # Set correlation ID if not already set
    if not hasattr(request.state, "correlation_id"):
        request.state.correlation_id = exc.correlation_id or "unknown"

    # Log the exception
    log_exception(request, exc, "error")

    # Don't expose internal database details in production
    response_data = exc.to_dict()
    if "details" in response_data and "operation" in response_data["details"]:
        # Keep operation but remove any sensitive details
        response_data["details"] = {"operation": response_data["details"]["operation"]}

    return JSONResponse(
        status_code=exc.status_code,
        content=response_data,
    )


def create_error_response(
    status_code: int,
    message: str,
    error_code: str | None = None,
    details: Dict[str, Any] | None = None,
    correlation_id: str | None = None,
) -> JSONResponse:
    """Create a standardized error response"""

    response_data = {
        "error": True,
        "message": message,
        "status_code": status_code,
    }

    if error_code:
        response_data["error_code"] = error_code

    if details:
        response_data["details"] = details

    if correlation_id:
        response_data["correlation_id"] = correlation_id

    return JSONResponse(status_code=status_code, content=response_data)


# Utility function to handle common database errors
def handle_database_error(operation: str, error: Exception) -> DatabaseError:
    """Convert database exceptions to DatabaseError"""

    error_message = str(error)

    # Common database error patterns
    if "connection" in error_message.lower():
        return DatabaseError("Connection failed", operation)
    elif "timeout" in error_message.lower():
        return DatabaseError("Operation timed out", operation)
    elif "syntax" in error_message.lower():
        return DatabaseError("Invalid query syntax", operation)
    elif "duplicate" in error_message.lower():
        return DatabaseError("Duplicate entry", operation)
    elif "foreign key" in error_message.lower():
        return DatabaseError("Foreign key constraint violation", operation)
    else:
        return DatabaseError(error_message, operation)


# Utility function to handle external service errors
def handle_external_service_error(
    service: str, error: Exception
) -> ExternalServiceError:
    """Convert external service exceptions to ExternalServiceError"""

    error_message = str(error)

    # Common external service error patterns
    if "timeout" in error_message.lower():
        return ExternalServiceError(service, "Service timeout")
    elif "connection" in error_message.lower():
        return ExternalServiceError(service, "Connection failed")
    elif "401" in error_message.lower() or "unauthorized" in error_message.lower():
        return ExternalServiceError(service, "Authentication failed")
    elif "403" in error_message.lower() or "forbidden" in error_message.lower():
        return ExternalServiceError(service, "Access denied")
    elif "404" in error_message.lower() or "not found" in error_message.lower():
        return ExternalServiceError(service, "Service endpoint not found")
    elif "500" in error_message.lower() or "internal" in error_message.lower():
        return ExternalServiceError(service, "Service internal error")
    else:
        return ExternalServiceError(service, error_message)
