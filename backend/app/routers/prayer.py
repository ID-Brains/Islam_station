"""
Quran API Router for The Islamic Guidance Station
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from adhan import Client
import datetime

router = APIRouter()


@router.get("/pTimes")
async def find_time_with_geolocation(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location")
):
    """
    Get prayer times for a specific location and date
    """
    try:
        client = Client(latitude, longitude)
        prayer_times = client.get_day()

        return {
            "prayer_times": prayer_times
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get prayer times: {str(e)}")
