"""
API Routers for The Islamic Guidance Station
"""

from .quran import router as quran_router
from .prayer import router as prayer_router
from .mosque import router as mosque_router
from .dhikr import router as dhikr_router
from .health import router as health_router

__all__ = [
    "quran_router",
    "prayer_router",
    "mosque_router",
    "dhikr_router",
    "health_router",
]
