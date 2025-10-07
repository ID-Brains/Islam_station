"""
Mosque API Router for The Islamic Guidance Station
"""

from typing import Any

from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel

from ..services.mosque_service import MosqueService


class RouteRequest(BaseModel):
    """Request model for route mosque search"""
    waypoints: list[list[float]]
    buffer_meters: int = 2000

router = APIRouter()


@router.get("/nearby")
async def get_nearby_mosques(
    latitude: float = Query(
        ..., description="Latitude of your location", ge=-90, le=90
    ),
    longitude: float = Query(
        ..., description="Longitude of your location", ge=-180, le=180
    ),
    radius: int = Query(
        default=5000, description="Search radius in meters", ge=100, le=50000
    ),
    limit: int = Query(
        default=20, description="Maximum number of results", ge=1, le=100
    ),
) -> dict[str, Any]:
    """
    Find mosques near your location using OpenStreetMap

    Args:
        latitude: Your current latitude
        longitude: Your current longitude
        radius: Search radius in meters (default 5km)
        limit: Maximum number of results (default 20)

    Returns:
        List of nearby mosques with distance and bearing information
    """
    try:
        mosques = await MosqueService.find_nearby_mosques(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius,
            limit=limit,
        )

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "radius_meters": radius,
            "mosques": mosques,
            "count": len(mosques),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to search nearby mosques: {str(e)}"
        )


@router.get("/search")
async def search_mosques(
    q: str = Query(..., description="Search query for mosque name", min_length=2),
    city: str = Query(None, description="Filter by city"),
    country: str = Query(None, description="Filter by country"),
    limit: int = Query(default=20, description="Maximum number of results", ge=1, le=100),
    offset: int = Query(default=0, description="Offset for pagination", ge=0),
) -> dict[str, Any]:
    """
    Search mosques by name with optional city/country filters

    Args:
        q: Search term for mosque name
        city: Optional city filter
        country: Optional country filter
        limit: Maximum results to return
        offset: Pagination offset

    Returns:
        List of matching mosques with pagination metadata
    """
    try:
        results = await MosqueService.search_mosques_by_name(
            name=q,
            city=city,
            country=country,
            limit=limit,
            offset=offset,
        )

        return {
            "query": q,
            "filters": {
                "city": city,
                "country": country,
            },
            **results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mosque search failed: {str(e)}")


@router.get("/{mosque_id}")
async def get_mosque_by_id(
    mosque_id: int,
) -> dict[str, Any]:
    """
    Get detailed information about a specific mosque from OpenStreetMap

    Args:
        mosque_id: OpenStreetMap element ID of the mosque

    Returns:
        Mosque details
    """
    try:
        if mosque_id < 1:
            raise HTTPException(status_code=400, detail="Invalid mosque ID")

        mosque = await MosqueService.get_mosque_details(mosque_id)

        if not mosque:
            raise HTTPException(
                status_code=404,
                detail="Mosque not found. The ID may be invalid or the mosque may have been removed from OpenStreetMap.",
            )

        return {"mosque": mosque}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mosque: {str(e)}")


@router.get("/area/bbox")
async def get_mosques_in_area(
    min_lat: float = Query(..., description="Minimum latitude (south)", ge=-90, le=90),
    min_lng: float = Query(
        ..., description="Minimum longitude (west)", ge=-180, le=180
    ),
    max_lat: float = Query(..., description="Maximum latitude (north)", ge=-90, le=90),
    max_lng: float = Query(
        ..., description="Maximum longitude (east)", ge=-180, le=180
    ),
) -> dict[str, Any]:
    """
    Get all mosques within a bounding box (rectangular area)

    Args:
        min_lat: Southwest corner latitude
        min_lng: Southwest corner longitude
        max_lat: Northeast corner latitude
        max_lng: Northeast corner longitude

    Returns:
        List of mosques in the specified area
    """
    try:
        if min_lat >= max_lat:
            raise HTTPException(
                status_code=400, detail="min_lat must be less than max_lat"
            )
        if min_lng >= max_lng:
            raise HTTPException(
                status_code=400, detail="min_lng must be less than max_lng"
            )

        # Check bounding box size to prevent excessive queries
        lat_diff = max_lat - min_lat
        lng_diff = max_lng - min_lng
        if lat_diff > 10 or lng_diff > 10:
            raise HTTPException(
                status_code=400,
                detail="Bounding box too large. Please use a smaller area (max 10 degrees in each dimension).",
            )

        mosques = await MosqueService.get_mosques_in_area(
            min_lat=min_lat,
            min_lng=min_lng,
            max_lat=max_lat,
            max_lng=max_lng,
        )

        return {
            "bounding_box": {
                "southwest": {"latitude": min_lat, "longitude": min_lng},
                "northeast": {"latitude": max_lat, "longitude": max_lng},
            },
            "mosques": mosques,
            "count": len(mosques),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch mosques in area: {str(e)}"
        )


@router.get("/city/{city}")
async def get_mosques_by_city(
    city: str,
) -> dict[str, Any]:
    """
    Get all mosques in a specific city

    Args:
        city: City name

    Returns:
        List of mosques in the city
    """
    try:
        mosques = await MosqueService.get_mosques_by_city(city)

        return {
            "city": city,
            "mosques": mosques,
            "count": len(mosques),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch mosques by city: {str(e)}"
        )


@router.get("/country/{country}")
async def get_mosques_by_country(
    country: str,
) -> dict[str, Any]:
    """
    Get all mosques in a specific country

    Args:
        country: Country name (English)

    Returns:
        List of mosques in the country
    """
    try:
        mosques = await MosqueService.get_mosques_by_country(country)

        return {
            "country": country,
            "mosques": mosques,
            "count": len(mosques),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch mosques by country: {str(e)}"
        )


@router.post("/route")
async def get_mosques_along_route(
    request: RouteRequest = Body(
        ...,
        example={
            "waypoints": [[40.7128, -74.0060], [39.9526, -75.1652], [38.9072, -77.0369]],
            "buffer_meters": 2000
        }
    )
) -> dict[str, Any]:
    """
    Find mosques along a route defined by waypoints

    Args:
        waypoints: List of [lat, lng] coordinates defining the route
        buffer_meters: Search buffer around route (default 2km)

    Returns:
        List of mosques along the route

    Example body:
        {
            "waypoints": [[40.7128, -74.0060], [39.9526, -75.1652], [38.9072, -77.0369]],
            "buffer_meters": 2000
        }
    """
    try:
        waypoints = request.waypoints
        buffer_meters = request.buffer_meters

        # Validate buffer_meters
        if buffer_meters < 100 or buffer_meters > 10000:
            raise HTTPException(
                status_code=400,
                detail="buffer_meters must be between 100 and 10000"
            )

        # Validate waypoints
        if len(waypoints) < 2:
            raise HTTPException(
                status_code=400, detail="At least 2 waypoints are required"
            )

        for i, waypoint in enumerate(waypoints):
            if len(waypoint) != 2:
                raise HTTPException(
                    status_code=400,
                    detail=f"Waypoint {i} must have exactly 2 coordinates [lat, lng]",
                )

            lat, lng = waypoint
            if not (-90 <= lat <= 90):
                raise HTTPException(
                    status_code=400, detail=f"Invalid latitude in waypoint {i}: {lat}"
                )
            if not (-180 <= lng <= 180):
                raise HTTPException(
                    status_code=400, detail=f"Invalid longitude in waypoint {i}: {lng}"
                )

        # Convert to tuple format
        waypoint_tuples = [(lat, lng) for lat, lng in waypoints]

        mosques = await MosqueService.get_mosques_along_route(
            waypoints=waypoint_tuples,
            buffer_meters=buffer_meters,
        )

        return {
            "route": {
                "waypoints": waypoints,
                "buffer_meters": buffer_meters,
            },
            "mosques": mosques,
            "count": len(mosques),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to find mosques along route: {str(e)}"
        )


@router.get("/statistics")
async def get_mosque_statistics() -> dict[str, Any]:
    """
    Get statistics about mosques

    Note: When using OpenStreetMap, global statistics are not available.
    Use location-based queries instead.

    Returns:
        Limited statistics information
    """
    try:
        stats = await MosqueService.get_mosque_statistics()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch statistics: {str(e)}"
        )
