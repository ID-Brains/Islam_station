"""
Custom exceptions for The Islamic Guidance Station
"""

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

from .handlers import (
    islamic_station_exception_handler,
    general_exception_handler,
    validation_exception_handler,
    database_exception_handler,
)

__all__ = [
    "IslamicStationException",
    "ValidationError",
    "NotFoundError",
    "DatabaseError",
    "ExternalServiceError",
    "RateLimitError",
    "AuthenticationError",
    "AuthorizationError",
    "islamic_station_exception_handler",
    "general_exception_handler",
    "validation_exception_handler",
    "database_exception_handler",
]
