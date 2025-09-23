"""
Configuration settings for The Islamic Guidance Station
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic"""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/islam_station"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour

    # External APIs
    QURAN_API_KEY: str = ""  # If needed
    ALADHAN_API_BASE: str = "https://api.aladhan.com/v1"
    NOMINATIM_API_BASE: str = "https://nominatim.openstreetmap.org"

    # Application
    APP_NAME: str = "The Islamic Guidance Station"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-here"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:4321"]

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
