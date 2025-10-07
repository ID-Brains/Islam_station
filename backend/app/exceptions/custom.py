"""
Custom exception classes for The Islamic Guidance Station
"""

import logging
from typing import Any, Dict, Optional
from fastapi import status

logger = logging.getLogger(__name__)


class IslamicStationException(Exception):
    """Base exception for The Islamic Guidance Station"""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.correlation_id = correlation_id
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response"""
        response = {
            "error": True,
            "message": self.message,
            "status_code": self.status_code,
        }

        if self.error_code:
            response["error_code"] = self.error_code

        if self.details:
            response["details"] = self.details

        if self.correlation_id:
            response["correlation_id"] = self.correlation_id

        return response


class ValidationError(IslamicStationException):
    """Exception for validation errors"""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


class NotFoundError(IslamicStationException):
    """Exception for resource not found errors"""

    def __init__(
        self,
        resource: str,
        identifier: str = "",
        correlation_id: Optional[str] = None,
    ):
        message = f"{resource} not found"
        if identifier:
            message += f" with identifier: {identifier}"

        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
            correlation_id=correlation_id,
        )


class DatabaseError(IslamicStationException):
    """Exception for database-related errors"""

    def __init__(
        self,
        message: str,
        operation: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {"operation": operation} if operation else {}

        super().__init__(
            message=f"Database error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


class ExternalServiceError(IslamicStationException):
    """Exception for external service errors"""

    def __init__(
        self,
        service: str,
        message: str,
        correlation_id: Optional[str] = None,
    ):
        super().__init__(
            message=f"External service error ({service}): {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service},
            correlation_id=correlation_id,
        )


class RateLimitError(IslamicStationException):
    """Exception for rate limiting errors"""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        limit: Optional[int] = None,
        reset_time: Optional[int] = None,
        retry_after: Optional[int] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {}
        if limit is not None:
            details["limit"] = limit
        if reset_time is not None:
            details["reset_time"] = reset_time
        if retry_after is not None:
            details["retry_after"] = retry_after

        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
            correlation_id=correlation_id,
        )


class AuthenticationError(IslamicStationException):
    """Exception for authentication errors"""

    def __init__(
        self,
        message: str = "Authentication failed",
        correlation_id: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR",
            correlation_id=correlation_id,
        )


class AuthorizationError(IslamicStationException):
    """Exception for authorization errors"""

    def __init__(
        self,
        message: str = "Access denied",
        resource: Optional[str] = None,
        action: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {}
        if resource:
            details["resource"] = resource
        if action:
            details["action"] = action

        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


class ConfigurationError(IslamicStationException):
    """Exception for configuration errors"""

    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {"config_key": config_key} if config_key else {}

        super().__init__(
            message=f"Configuration error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="CONFIGURATION_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


class SearchError(IslamicStationException):
    """Exception for search-related errors"""

    def __init__(
        self,
        message: str,
        query: Optional[str] = None,
        search_type: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {}
        if query:
            details["query"] = query
        if search_type:
            details["search_type"] = search_type

        super().__init__(
            message=f"Search error: {message}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="SEARCH_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


class ProcessingError(IslamicStationException):
    """Exception for data processing errors"""

    def __init__(
        self,
        message: str,
        process_type: Optional[str] = None,
        input_data: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ):
        details = {}
        if process_type:
            details["process_type"] = process_type
        if input_data:
            details["input_data"] = (
                input_data[:100] + "..." if len(input_data) > 100 else input_data
            )

        super().__init__(
            message=f"Processing error: {message}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="PROCESSING_ERROR",
            details=details,
            correlation_id=correlation_id,
        )


# Utility functions for creating exceptions
def create_validation_error(
    field: str,
    value: Any,
    constraint: str,
    correlation_id: Optional[str] = None,
) -> ValidationError:
    """Create a validation error for a specific field"""
    return ValidationError(
        message=f"Invalid value for {field}: {value}. {constraint}",
        details={"field": field, "value": str(value), "constraint": constraint},
        correlation_id=correlation_id,
    )


def create_not_found_error(
    resource_type: str,
    resource_id: Any,
    correlation_id: Optional[str] = None,
) -> NotFoundError:
    """Create a not found error for a specific resource"""
    return NotFoundError(
        resource=resource_type,
        identifier=str(resource_id),
        correlation_id=correlation_id,
    )


def create_database_error(
    operation: str,
    original_error: Exception,
    correlation_id: Optional[str] = None,
) -> DatabaseError:
    """Create a database error from an original exception"""
    return DatabaseError(
        message=str(original_error),
        operation=operation,
        correlation_id=correlation_id,
    )


def create_external_service_error(
    service_name: str,
    original_error: Exception,
    correlation_id: Optional[str] = None,
) -> ExternalServiceError:
    """Create an external service error from an original exception"""
    return ExternalServiceError(
        service=service_name,
        message=str(original_error),
        correlation_id=correlation_id,
    )
