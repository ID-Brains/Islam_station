"""
Configuration settings for The Islamic Guidance Station.
"""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


_DEFAULT_ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
    "*",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        case_sensitive=True,
        extra="ignore",
        populate_by_name=True,
    )

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 25
    DATABASE_MAX_OVERFLOW: int = 30

    # External APIs
    NOMINATIM_API_BASE: str = "https://nominatim.openstreetmap.org"

    # Application
    APP_NAME: str = "The Islamic Guidance Station"
    DEBUG: bool = False
    SECRET_KEY: str  # Required

    # Internal raw env capture (string form). If present, overrides ALLOWED_ORIGINS.
    ALLOWED_ORIGINS_RAW: str | None = Field(
        default=None,
        alias="ALLOWED_ORIGINS",
        description="Raw ALLOWED_ORIGINS env var before parsing",
        repr=False,
    )

    # Computed property for processed origins (no direct field to avoid early JSON parsing)
    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        if self.ALLOWED_ORIGINS_RAW is None:
            return list(_DEFAULT_ALLOWED_ORIGINS)
        return self._parse_allowed_origins(self.ALLOWED_ORIGINS_RAW)

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    RATE_LIMIT_ENABLED: bool = True

    # Monitoring
    METRICS_ENABLED: bool = True
    HEALTH_CHECK_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    CORRELATION_ID_HEADER: str = "X-Correlation-ID"

    @staticmethod
    def _parse_allowed_origins(raw: str) -> list[str]:
        """
        Parse the raw ALLOWED_ORIGINS value.

        Accepted forms:
          - JSON array string: ["http://a","http://b"]
          - Comma list: http://a,http://b
          - Empty string -> []
        """
        s = raw.strip()
        if s == "":
            return []
        if s.startswith("["):
            # Try JSON first
            try:
                loaded = json.loads(s)
                if isinstance(loaded, list) and all(isinstance(x, str) for x in loaded):
                    return loaded
            except Exception:
                # Fall back to comma split if JSON fails
                pass
        # Comma separated fallback
        return [p.strip() for p in s.split(",") if p.strip()]

    @model_validator(mode="after")
    def _finalize(self) -> "Settings":
        # Validate ALLOWED_ORIGINS if raw provided (property computes value)
        if self.ALLOWED_ORIGINS_RAW is not None:
            try:
                _ = self._parse_allowed_origins(self.ALLOWED_ORIGINS_RAW)
            except Exception as e:
                raise ValueError(f"Failed to parse ALLOWED_ORIGINS: {e}") from e

        # Security validations
        insecure_markers = {
            "changeme",
            "your-secret-key-here",
            "placeholder",
            "default",
            "",
        }
        if not self.SECRET_KEY or self.SECRET_KEY.lower() in insecure_markers:
            raise ValueError(
                "SECRET_KEY must be set to a strong, non-default value in the environment."
            )

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be provided in the environment.")

        return self


# Singleton instance
settings = Settings()
