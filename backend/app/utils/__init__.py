"""
Utils package for The Islamic Guidance Station
"""

from .error_handler import (
    IslamicStationException,
    ValidationError,
    NotFoundError,
    DatabaseError,
    ExternalServiceError,
    create_error_response,
    islamic_station_exception_handler,
    general_exception_handler,
    handle_database_error,
    validate_pagination_params,
    log_api_request,
    log_api_response,
)
from .arabic_text import (
    remove_diacritics,
    normalize_arabic_search,
    normalize_arabic_for_display,
    is_arabic_text,
    clean_search_query,
    create_search_variants,
    is_pyarabic_available,
)

__all__ = [
    "IslamicStationException",
    "ValidationError",
    "NotFoundError",
    "DatabaseError",
    "ExternalServiceError",
    "create_error_response",
    "islamic_station_exception_handler",
    "general_exception_handler",
    "handle_database_error",
    "validate_pagination_params",
    "log_api_request",
    "log_api_response",
    "remove_diacritics",
    "normalize_arabic_search",
    "normalize_arabic_for_display",
    "is_arabic_text",
    "clean_search_query",
    "create_search_variants",
    "is_pyarabic_available",
]
