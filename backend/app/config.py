"""
Configuration settings for The Islamic Guidance Station
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings using Pydantic"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 25
    DATABASE_MAX_OVERFLOW: int = 30

    # # Redis
    # REDIS_URL: str = "redis://localhost:6379"
    # CACHE_TTL: int = 3600  # 1 hour

    NOMINATIM_API_BASE: str = "https://nominatim.openstreetmap.org"

    # Application
    APP_NAME: str = "The Islamic Guidance Station"
    DEBUG: bool = False
    SECRET_KEY: str  # Required from environment, no default for security

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:4321", "http://127.0.0.1:4321"]

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Logging
    LOG_LEVEL: str = "INFO"


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate critical security settings
        if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-here":
            raise ValueError("SECRET_KEY must be set in environment variables and cannot be the default placeholder")
        
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in environment variables")


settings = Settings()
