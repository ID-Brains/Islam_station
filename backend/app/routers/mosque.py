"""
Mosque API Router for The Islamic Guidance Station
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict

from ..database import execute_query, execute_query_single
from ..queries.mosque_queries import (
    get_nearby_mosques_query,
    get_mosque_by_id_query,
    search_mosques_by_name_query,
    get_mosques_in_bbox_query,
)

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
) -> Dict[str, Any]:
    """
    Find mosques near your location using geospatial search

    Args:
        latitude: Your current latitude
        longitude: Your current longitude
        radius: Search radius in meters (default 5km)

    Returns:
        List of nearby mosques with distance information
    """
    try:
        # Get optimized spatial query
        query = get_nearby_mosques_query()

        # Execute spatial search
        mosques = await execute_query(query, latitude, longitude, radius)

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
    limit: int = Query(default=20, description="Maximum number of results", le=100),
    offset: int = Query(default=0, description="Offset for pagination", ge=0),
) -> Dict[str, Any]:
    """
    Search mosques by name with optional city/country filters

    Args:
        q: Search term for mosque name
        city: Optional city filter
        country: Optional country filter
        limit: Maximum results to return
        offset: Pagination offset

    Returns:
        List of matching mosques
    """
    try:
        # Get search query
        query = search_mosques_by_name_query()

        # Build search pattern
        search_pattern = f"%{q}%"

        # Execute search with filters
        params = [search_pattern]

        # Add optional filters to query
        if city:
            query += ' AND LOWER("city") = LOWER($2)'
            params.append(city)
        if country:
            if city:
                query += ' AND LOWER("country") = LOWER($3)'
            else:
                query += ' AND LOWER("country") = LOWER($2)'
            params.append(country)

        # Add ordering and pagination
        param_count = len(params)
        query += (
            f' ORDER BY "name" ASC LIMIT ${param_count + 1} OFFSET ${param_count + 2}'
        )
        params.extend([limit, offset])

        # Execute query
        mosques = await execute_query(query, *params)

        return {
            "query": q,
            "filters": {
                "city": city,
                "country": country,
            },
            "results": mosques,
            "limit": limit,
            "offset": offset,
            "count": len(mosques),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mosque search failed: {str(e)}")


@router.get("/{mosque_id}")
async def get_mosque_by_id(
    mosque_id: int,
) -> Dict[str, Any]:
    """
    Get detailed information about a specific mosque

    Args:
        mosque_id: Unique identifier of the mosque

    Returns:
        Mosque details
    """
    try:
        # Validate mosque ID
        if mosque_id < 1:
            raise HTTPException(status_code=400, detail="Invalid mosque ID")

        # Get mosque query
        query = get_mosque_by_id_query()

        # Execute query
        mosque = await execute_query_single(query, mosque_id)

        if not mosque:
            raise HTTPException(status_code=404, detail="Mosque not found")

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
) -> Dict[str, Any]:
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
        # Validate bounding box
        if min_lat >= max_lat:
            raise HTTPException(
                status_code=400, detail="min_lat must be less than max_lat"
            )
        if min_lng >= max_lng:
            raise HTTPException(
                status_code=400, detail="min_lng must be less than max_lng"
            )

        # Get bounding box query
        query = get_mosques_in_bbox_query()

        # Execute spatial query
        mosques = await execute_query(query, min_lng, min_lat, max_lng, max_lat)

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


@router.get("/cities")
async def get_mosque_cities() -> Dict[str, Any]:
    """
    Get list of cities with mosques for filtering

    Returns:
        List of unique cities
    """
    try:
        query = """
            SELECT DISTINCT "city", "country", COUNT(*) as mosque_count
            FROM "mosques"
            WHERE "city" IS NOT NULL AND "city" != ''
            GROUP BY "city", "country"
            ORDER BY mosque_count DESC, "city" ASC
            LIMIT 100
        """

        cities = await execute_query(query)

        return {
            "cities": cities,
            "count": len(cities),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cities: {str(e)}")


@router.get("/countries")
async def get_mosque_countries() -> Dict[str, Any]:
    """
    Get list of countries with mosques for filtering

    Returns:
        List of unique countries
    """
    try:
        query = """
            SELECT DISTINCT "country", COUNT(*) as mosque_count
            FROM "mosques"
            WHERE "country" IS NOT NULL AND "country" != ''
            GROUP BY "country"
            ORDER BY mosque_count DESC, "country" ASC
        """

        countries = await execute_query(query)

        return {
            "countries": countries,
            "count": len(countries),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch countries: {str(e)}"
        )
