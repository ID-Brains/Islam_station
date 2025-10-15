"""
Dependencies module for middleware and request dependencies (Open access - no auth)
"""

from .rate_limit import limiter, rate_limit_dependency

__all__ = [
    "limiter",
    "rate_limit_dependency",
]
