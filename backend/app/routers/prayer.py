"""
Quran API Router for The Islamic Guidance Station
"""

import httpx
import datetime
from fastapi import APIRouter, Query, HTTPException
from praytimes import PrayTimes

router = APIRouter()


async def get_country_from_coords(latitude: float, longitude: float) -> str:
    """
    Get country name from latitude and longitude using Nominatim API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
            )
            response.raise_for_status()
            data = response.json()
            address = data.get("address", {})
            country = address.get("country", "Unknown")
            return country
    except Exception as e:
        return "Unknown"


@router.get("/pTimes")
async def find_time_with_geolocation(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location"),
):
    """
    Get prayer times for a specific location and date
    """
    try:
        country = await get_country_from_coords(latitude, longitude)

        # Create PrayTimes object
        pt = PrayTimes()

        # Get current date
        now = datetime.datetime.now()
        year = now.year
        month = now.month
        day = now.day

        # Calculate prayer times
        prayer_times = pt.getTimes((year, month, day), (latitude, longitude), +3)  # UTC+3 for Saudi Arabia

        return {
            "location": {"latitude": latitude, "longitude": longitude, "country": country},
            "prayer_times": prayer_times
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get prayer times: {str(e)}"
        )
