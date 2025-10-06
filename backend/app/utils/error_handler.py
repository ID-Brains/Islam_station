"""
Standardized error handling utilities for The Islamic Guidance Station
"""

import logging
from typing import Any, Dict, Optional
from fastapi import status
from fastapi.responses import JSONResponse
from fastapi.requests import Request

logger = logging.getLogger(__name__)


class IslamicStationException(Exception):
    """Base exception for The Islamic Guidance Station"""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(IslamicStationException):
    """Exception for validation errors"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class NotFoundError(IslamicStationException):
    """Exception for resource not found errors"""

    def __init__(self, resource: str, identifier: str = ""):
        message = f"{resource} not found"
        if identifier:
            message += f" with identifier: {identifier}"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
        )


class DatabaseError(IslamicStationException):
    """Exception for database-related errors"""

    def __init__(self, message: str, operation: Optional[str] = None):
        super().__init__(
            message=f"Database error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details={"operation": operation} if operation else {},
        )


class ExternalServiceError(IslamicStationException):
    """Exception for external service errors"""

    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"External service error ({service}): {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service},
        )


def create_error_response(
    status_code: int,
    message: str,
    error_code: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
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

    return JSONResponse(status_code=status_code, content=response_data)


async def islamic_station_exception_handler(
    request: Request, exc: IslamicStationException
) -> JSONResponse:
    """Handler for custom Islamic Station exceptions"""

    logger.error(
        f"Islamic Station Exception: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "details": exc.details,
            "path": str(request.url),
            "method": request.method,
        },
    )

    return create_error_response(
        status_code=exc.status_code,
        message=exc.message,
        error_code=exc.error_code,
        details=exc.details,
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for general exceptions"""

    logger.error(
        f"Unhandled exception: {type(exc).__name__} - {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "path": str(request.url),
            "method": request.method,
        },
        exc_info=True,
    )

    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="An unexpected error occurred. Please try again later.",
        error_code="INTERNAL_SERVER_ERROR",
    )


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
    else:
        return DatabaseError(error_message, operation)


def validate_pagination_params(page: int, limit: int) -> tuple[int, int]:
    """Validate and normalize pagination parameters"""

    if page < 1:
        raise ValidationError("Page number must be greater than 0")

    if page > 1000:
        raise ValidationError("Page number cannot exceed 1000")

    if limit < 1:
        raise ValidationError("Limit must be greater than 0")

    if limit > 100:
        raise ValidationError("Limit cannot exceed 100")

    return page, limit


def log_api_request(request: Request, user_id: Optional[str] = None):
    """Log API request for monitoring"""

    logger.info(
        f"API Request: {request.method} {request.url}",
        extra={
            "method": request.method,
            "path": str(request.url),
            "user_id": user_id,
            "client_ip": request.client.host if request.client else None,
        },
    )


def log_api_response(request: Request, status_code: int, response_time: float):
    """Log API response for monitoring"""

    logger.info(
        f"API Response: {request.method} {request.url} - {status_code} - {response_time:.3f}s",
        extra={
            "method": request.method,
            "path": str(request.url),
            "status_code": status_code,
            "response_time": response_time,
            "client_ip": request.client.host if request.client else None,
        },
    )
