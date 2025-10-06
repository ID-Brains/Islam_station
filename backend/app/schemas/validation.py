"""
Pydantic schemas for input validation across all API endpoints
"""

from typing import Optional
from pydantic import BaseModel, Field, validator
import re


class QuranSearchRequest(BaseModel):
    """Schema for Quran search request validation"""

    q: str = Field(..., min_length=1, max_length=500, description="Search query")
    type: str = Field(default="fulltext", description="Search type")
    language: str = Field(default="both", description="Language filter")
    page: int = Field(default=1, ge=1, le=1000)
    limit: int = Field(default=10, ge=1, le=100)
    surah: str = Field(default="all", description="Surah filter")

    @validator("type")
    def validate_type(cls, v):
        if v not in ["fulltext", "exact", "translation", "arabic"]:
            raise ValueError("Invalid search type")
        return v

    @validator("language")
    def validate_language(cls, v):
        if v not in ["both", "arabic", "english"]:
            raise ValueError("Invalid language filter")
        return v

    @validator("surah")
    def validate_surah(cls, v):
        if v != "all":
            try:
                surah_num = int(v)
                if not 1 <= surah_num <= 114:
                    raise ValueError("Surah number must be between 1 and 114")
            except ValueError:
                raise ValueError("Invalid surah format")
        return v


class SurahRequest(BaseModel):
    """Schema for surah request validation"""

    surah_number: int = Field(..., ge=1, le=114, description="Surah number (1-114)")


class VerseRequest(BaseModel):
    """Schema for verse request validation"""

    surah_number: int = Field(..., ge=1, le=114, description="Surah number (1-114)")
    verse_number: int = Field(..., ge=1, le=286, description="Verse number (1-286)")


class VerseRangeRequest(BaseModel):
    """Schema for verse range request validation"""

    surah_number: int = Field(..., ge=1, le=114, description="Surah number (1-114)")
    start_verse: int = Field(..., ge=1, le=286, description="Starting verse number")
    end_verse: int = Field(..., ge=1, le=286, description="Ending verse number")

    @validator("end_verse")
    def validate_verse_range(cls, v, values):
        if "start_verse" in values and v < values["start_verse"]:
            raise ValueError("End verse must be greater than or equal to start verse")
        return v


class MosqueSearchRequest(BaseModel):
    """Schema for mosque search request validation"""

    latitude: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    longitude: float = Field(
        ..., ge=-180, le=180, description="Longitude (-180 to 180)"
    )
    radius: int = Field(
        default=5000, ge=100, le=50000, description="Search radius in meters"
    )
    limit: int = Field(default=10, ge=1, le=50)


class PrayerTimesRequest(BaseModel):
    """Schema for prayer times request validation"""

    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    method: str = Field(default="Egyptian", description="Calculation method")
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")

    @validator("method")
    def validate_method(cls, v):
        if v not in ["Egyptian", "MWL", "Karachi", "Tehran", "Jafari"]:
            raise ValueError("Invalid calculation method")
        return v

    @validator("date")
    def validate_date(cls, v):
        if v:
            try:
                from datetime import datetime

                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class DhikrRequest(BaseModel):
    """Schema for dhikr request validation"""

    category: Optional[str] = Field(None, description="Dhikr category")
    language: str = Field(default="both", description="Language filter")
    limit: int = Field(default=1, ge=1, le=10)

    @validator("category")
    def validate_category(cls, v):
        if v and v not in ["morning", "evening", "general", "daily"]:
            raise ValueError("Invalid category")
        return v

    @validator("language")
    def validate_language(cls, v):
        if v not in ["both", "arabic", "english"]:
            raise ValueError("Invalid language filter")
        return v


class LocationRequest(BaseModel):
    """Schema for location-based requests"""

    address: str = Field(..., min_length=3, max_length=500)

    @validator("address")
    def validate_address(cls, v):
        # Basic validation to prevent injection
        if any(char in v for char in ["<", ">", '"', "'", "&", "script"]):
            raise ValueError("Invalid characters in address")
        return v


# Common validation functions
def sanitize_search_query(query: str) -> str:
    """Sanitize search query to prevent injection"""
    # Remove potentially harmful characters
    sanitized = re.sub(r'[<>"\'&]', "", query)
    # Limit length
    return sanitized[:500]


def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate latitude and longitude coordinates"""
    return -90 <= lat <= 90 and -180 <= lng <= 180


def validate_pagination(page: int, limit: int) -> tuple[int, int]:
    """Validate and normalize pagination parameters"""
    page = max(1, min(page, 1000))
    limit = max(1, min(limit, 100))
    return page, limit
