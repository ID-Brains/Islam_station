"""
Configuration settings for The Islamic Guidance Station
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using Pydantic"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )

    # Database
    DATABASE_URL: str = "postgresql://islam:202520@192.168.1.11/quran"
    DATABASE_POOL_SIZE: int = 25
    DATABASE_MAX_OVERFLOW: int = 30

    # # Redis
    # REDIS_URL: str = "redis://localhost:6379"
    # CACHE_TTL: int = 3600  # 1 hour

    NOMINATIM_API_BASE: str = "https://nominatim.openstreetmap.org"

    # Application
    APP_NAME: str = "The Islamic Guidance Station"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-here"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:4321"]

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()
