"""
Prayer API Router for The Islamic Guidance Station
"""

import httpx
from datetime import date
from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict

from ..services.prayer_service import PrayerService

router = APIRouter()


@router.get("/times")
async def find_time_with_geolocation(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
    method: str = Query(default="Egyptian", description="Calculation method"),
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
