"""
Logging configuration for The Islamic Guidance Station
Uses structlog for structured logging with built-in Python logging
"""

import logging
import structlog
import sys


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure structured logging with structlog and Python logging

    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """

    # Configure Python's standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level),
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.set_exc_info,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a configured logger instance

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)
