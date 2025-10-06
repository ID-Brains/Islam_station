"""
Prayer API Router for The Islamic Guidance Station
"""

import httpx
from datetime import date, datetime
from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict, Optional

from ..services.prayer_service import PrayerService

router = APIRouter()


@router.get("/times")
async def get_prayer_times(
    latitude: float = Query(..., description="Latitude of the location", ge=-90, le=90),
    longitude: float = Query(
        ..., description="Longitude of the location", ge=-180, le=180
    ),
    date_str: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    method: str = Query(default="MuslimWorldLeague", description="Calculation method"),
) -> Dict[str, Any]:
    """
    Get prayer times for a specific location and date

    Args:
        latitude: Location latitude
        longitude: Location longitude
        date_str: Date for calculation (defaults to today)
        method: Calculation method name

    Returns:
        Prayer times for the location and date
    """
    try:
        # Parse date if provided
        if date_str:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
                )
        else:
            date_obj = date.today()

        # Validate method
        if method not in PrayerService.CALCULATION_METHODS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid calculation method. Available: {list(PrayerService.CALCULATION_METHODS.keys())}",
            )

        # Calculate prayer times
        prayer_times = PrayerService.calculate_prayer_times(
            latitude=latitude,
            longitude=longitude,
            date_obj=date_obj,
            method=method,
        )

        # Get next prayer info
        next_prayer = PrayerService.get_next_prayer(prayer_times["times"])

        return {
            **prayer_times,
            "next_prayer": next_prayer,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate prayer times: {str(e)}"
        )


@router.get("/pTimes")
async def find_time_with_geolocation(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    method: str = Query(default="MuslimWorldLeague", description="Calculation method"),
) -> Dict[str, Any]:
    """
    Get prayer times for a specific location (backward compatible endpoint)

    Args:
        latitude: Location latitude
        longitude: Location longitude
        method: Calculation method

    Returns:
        Prayer times with location information
    """
    try:
        # Get country from coordinates
        country = await get_country_from_coords(latitude, longitude)

        # Try API first, fallback to local calculation
        try:
            prayer_times = await PrayerService.get_prayer_times_from_api(
                latitude=latitude, longitude=longitude, method=method
            )
        except Exception:
            # Fallback to local calculation
            prayer_times = PrayerService.calculate_prayer_times(
                latitude=latitude,
                longitude=longitude,
                date_obj=date.today(),
                method=method,
            )

        # Get next prayer
        next_prayer = PrayerService.get_next_prayer(prayer_times["times"])

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "country": country,
            },
            "prayer_times": prayer_times["times"],
            "next_prayer": next_prayer,
            "method": method,
            "date": prayer_times.get("date", date.today().isoformat()),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get prayer times: {str(e)}"
        )


@router.get("/next")
async def get_next_prayer(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    method: str = Query(default="MuslimWorldLeague", description="Calculation method"),
) -> Dict[str, Any]:
    """
    Get the next prayer time and countdown

    Args:
        latitude: Location latitude
        longitude: Location longitude
        method: Calculation method

    Returns:
        Next prayer information with countdown
    """
    try:
        # Calculate today's prayer times
        prayer_times = PrayerService.calculate_prayer_times(
            latitude=latitude,
            longitude=longitude,
            date_obj=date.today(),
            method=method,
        )

        # Get next prayer
        next_prayer = PrayerService.get_next_prayer(prayer_times["times"])

        if not next_prayer:
            raise HTTPException(
                status_code=404, detail="Could not determine next prayer"
            )

        return {
            "next_prayer": next_prayer,
            "location": {"latitude": latitude, "longitude": longitude},
            "all_times": prayer_times["times"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get next prayer: {str(e)}"
        )


@router.get("/monthly")
async def get_monthly_prayer_times(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    year: int = Query(..., description="Year", ge=2000, le=2100),
    month: int = Query(..., description="Month", ge=1, le=12),
    method: str = Query(default="MuslimWorldLeague", description="Calculation method"),
) -> Dict[str, Any]:
    """
    Get prayer times for an entire month

    Args:
        latitude: Location latitude
        longitude: Location longitude
        year: Year for calculation
        month: Month for calculation (1-12)
        method: Calculation method

    Returns:
        Prayer times for each day of the month
    """
    try:
        monthly_times = PrayerService.get_monthly_prayer_times(
            latitude=latitude,
            longitude=longitude,
            year=year,
            month=month,
            method=method,
        )

        return {
            "year": year,
            "month": month,
            "location": {"latitude": latitude, "longitude": longitude},
            "method": method,
            "prayer_times": monthly_times,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate monthly prayer times: {str(e)}",
        )


@router.get("/qibla")
async def get_qibla_direction(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
) -> Dict[str, Any]:
    """
    Get Qibla direction (towards Kaaba in Makkah)

    Args:
        latitude: Current location latitude
        longitude: Current location longitude

    Returns:
        Qibla direction in degrees from North and distance to Kaaba
    """
    try:
        qibla_info = PrayerService.get_qibla_direction(latitude, longitude)

        return {
            "location": {"latitude": latitude, "longitude": longitude},
            **qibla_info,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate Qibla direction: {str(e)}"
        )


@router.get("/methods")
async def get_calculation_methods() -> Dict[str, Any]:
    """
    Get list of available prayer time calculation methods

    Returns:
        List of calculation methods with descriptions
    """
    methods = []
    for key, value in PrayerService.CALCULATION_METHODS.items():
        methods.append(
            {
                "code": key,
                "name": value["name"],
                "fajr_angle": value.get("fajr_angle"),
                "isha_angle": value.get("isha_angle"),
                "isha_interval": value.get("isha_interval"),
                "maghrib_angle": value.get("maghrib_angle"),
            }
        )

    return {
        "methods": methods,
        "count": len(methods),
    }


async def get_country_from_coords(latitude: float, longitude: float) -> str:
    """
    Get country name from latitude and longitude using Nominatim API

    Args:
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        Country name or "Unknown" if not found
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": latitude, "lon": longitude, "format": "json"},
                headers={"User-Agent": "IslamStation/1.0"},
            )
            response.raise_for_status()
            data = response.json()
            address = data.get("address", {})
            country = address.get("country", "Unknown")
            return country
    except Exception:
        return "Unknown"
