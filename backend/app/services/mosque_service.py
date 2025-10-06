"""
Mosque Service - Business logic for mosque operations
"""

from typing import List, Dict, Any, Optional, Tuple
from ..database import execute_query, execute_query_single
import math


class MosqueService:
    """Service class for mosque-related business logic"""

    @staticmethod
    async def find_nearby_mosques(
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Find mosques near a location with distance calculation

        Args:
            latitude: Current location latitude
            longitude: Current location longitude
            radius_meters: Search radius in meters
            limit: Maximum number of results

        Returns:
            List of nearby mosques with distance
        """
        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude,
                   ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
            FROM "mosques"
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                $3
            )
            ORDER BY distance_meters ASC
            LIMIT $4
        """

        mosques = await execute_query(sql, latitude, longitude, radius_meters, limit)

        # Enrich with calculated bearing
        for mosque in mosques:
            bearing = MosqueService._calculate_bearing(
                latitude, longitude, mosque["latitude"], mosque["longitude"]
            )
            mosque["bearing"] = bearing
            mosque["distance_km"] = round(mosque["distance_meters"] / 1000, 2)

        return mosques

    @staticmethod
    async def search_mosques_by_name(
        name: str,
        city: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Search mosques by name with optional filters

        Args:
            name: Search term for mosque name
            city: Optional city filter
            country: Optional country filter
            limit: Maximum results
            offset: Pagination offset

        Returns:
            Search results with metadata
        """
        search_pattern = f"%{name}%"
        params = [search_pattern]

        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM "mosques"
            WHERE "name" ILIKE $1
        """

        # Add filters
        if city:
            sql += f' AND LOWER("city") = LOWER(${len(params) + 1})'
            params.append(city)

        if country:
            sql += f' AND LOWER("country") = LOWER(${len(params) + 1})'
            params.append(country)

        # Count total
        count_sql = sql.replace(
            'SELECT "mosque_id", "name", "address", "city", "country", ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude',
            "SELECT COUNT(*) as total",
        )
        count_result = await execute_query_single(count_sql, *params)
        total = count_result.get("total", 0) if count_result else 0

        # Add pagination
        sql += (
            f' ORDER BY "name" ASC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}'
        )
        params.extend([limit, offset])

        mosques = await execute_query(sql, *params)

        return {
            "results": mosques,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(mosques)) < total,
        }

    @staticmethod
    async def get_mosques_in_area(
        min_lat: float,
        min_lng: float,
        max_lat: float,
        max_lng: float,
    ) -> List[Dict[str, Any]]:
        """
        Get all mosques within a bounding box

        Args:
            min_lat: Southwest corner latitude
            min_lng: Southwest corner longitude
            max_lat: Northeast corner latitude
            max_lng: Northeast corner longitude

        Returns:
            List of mosques in the area
        """
        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM "mosques"
            WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
            ORDER BY "name" ASC
        """

        return await execute_query(sql, min_lng, min_lat, max_lng, max_lat)

    @staticmethod
    async def get_mosques_by_city(city: str) -> List[Dict[str, Any]]:
        """
        Get all mosques in a specific city

        Args:
            city: City name

        Returns:
            List of mosques in the city
        """
        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM "mosques"
            WHERE LOWER("city") = LOWER($1)
            ORDER BY "name" ASC
        """

        return await execute_query(sql, city)

    @staticmethod
    async def get_mosques_by_country(country: str) -> List[Dict[str, Any]]:
        """
        Get all mosques in a specific country

        Args:
            country: Country name

        Returns:
            List of mosques in the country
        """
        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM "mosques"
            WHERE LOWER("country") = LOWER($1)
            ORDER BY "city" ASC, "name" ASC
        """

        return await execute_query(sql, country)

    @staticmethod
    async def get_mosque_details(mosque_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific mosque

        Args:
            mosque_id: Mosque unique identifier

        Returns:
            Mosque details or None if not found
        """
        sql = """
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude
            FROM "mosques"
            WHERE "mosque_id" = $1
        """

        return await execute_query_single(sql, mosque_id)

    @staticmethod
    async def get_cities_with_mosques() -> List[Dict[str, Any]]:
        """
        Get list of cities that have mosques

        Returns:
            List of cities with mosque counts
        """
        sql = """
            SELECT DISTINCT "city", "country", COUNT(*) as mosque_count
            FROM "mosques"
            WHERE "city" IS NOT NULL AND "city" != ''
            GROUP BY "city", "country"
            ORDER BY mosque_count DESC, "city" ASC
            LIMIT 100
        """

        return await execute_query(sql)

    @staticmethod
    async def get_countries_with_mosques() -> List[Dict[str, Any]]:
        """
        Get list of countries that have mosques

        Returns:
            List of countries with mosque counts
        """
        sql = """
            SELECT DISTINCT "country", COUNT(*) as mosque_count
            FROM "mosques"
            WHERE "country" IS NOT NULL AND "country" != ''
            GROUP BY "country"
            ORDER BY mosque_count DESC, "country" ASC
        """

        return await execute_query(sql)

    @staticmethod
    async def get_mosques_along_route(
        waypoints: List[Tuple[float, float]],
        buffer_meters: int = 2000,
    ) -> List[Dict[str, Any]]:
        """
        Find mosques along a route defined by waypoints

        Args:
            waypoints: List of (latitude, longitude) tuples
            buffer_meters: Search buffer around the route

        Returns:
            List of mosques along the route
        """
        if not waypoints or len(waypoints) < 2:
            return []

        # Create LineString from waypoints
        ",".join([f"{lng} {lat}" for lat, lng in waypoints])

        sql = f"""
            WITH route AS (
                SELECT ST_Buffer(
                    ST_MakeLine(ARRAY[
                        {','.join([f"ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326)::geography" for lat, lng in waypoints])}
                    ])::geography,
                    $1
                ) as buffer_zone
            )
            SELECT "mosque_id", "name", "address", "city", "country",
                   ST_Y(location::geometry) as latitude,
                   ST_X(location::geometry) as longitude,
                   ST_Distance(
                       location::geography,
                       ST_MakeLine(ARRAY[
                           {','.join([f"ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326)::geography" for lat, lng in waypoints])}
                       ])::geography
                   ) as distance_from_route
            FROM "mosques", route
            WHERE ST_DWithin(location::geography, route.buffer_zone, 0)
            ORDER BY distance_from_route ASC
        """

        return await execute_query(sql, buffer_meters)

    @staticmethod
    def _calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate bearing from point 1 to point 2

        Args:
            lat1: Starting latitude
            lon1: Starting longitude
            lat2: Ending latitude
            lon2: Ending longitude

        Returns:
            Bearing in degrees from North
        """
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        delta_lon = lon2_rad - lon1_rad

        y = math.sin(delta_lon) * math.cos(lat2_rad)
        x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(
            lat2_rad
        ) * math.cos(delta_lon)

        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360

        return round(bearing, 2)

    @staticmethod
    def _calculate_distance(
        lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """
        Calculate distance between two points using Haversine formula

        Args:
            lat1: Starting latitude
            lon1: Starting longitude
            lat2: Ending latitude
            lon2: Ending longitude

        Returns:
            Distance in kilometers
        """
        earth_radius = 6371  # km

        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return earth_radius * c

    @staticmethod
    def get_compass_direction(bearing: float) -> str:
        """
        Convert bearing to compass direction

        Args:
            bearing: Bearing in degrees

        Returns:
            Compass direction (N, NE, E, SE, S, SW, W, NW)
        """
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        index = round(bearing / 45) % 8
        return directions[index]

    @staticmethod
    async def get_mosque_statistics() -> Dict[str, Any]:
        """
        Get overall mosque statistics

        Returns:
            Statistics about mosques in database
        """
        sql = """
            SELECT
                COUNT(*) as total_mosques,
                COUNT(DISTINCT "city") as unique_cities,
                COUNT(DISTINCT "country") as unique_countries
            FROM "mosques"
        """

        stats = await execute_query_single(sql)

        # Get top countries
        top_countries_sql = """
            SELECT "country", COUNT(*) as count
            FROM "mosques"
            WHERE "country" IS NOT NULL
            GROUP BY "country"
            ORDER BY count DESC
            LIMIT 10
        """
        top_countries = await execute_query(top_countries_sql)

        # Get top cities
        top_cities_sql = """
            SELECT "city", "country", COUNT(*) as count
            FROM "mosques"
            WHERE "city" IS NOT NULL
            GROUP BY "city", "country"
            ORDER BY count DESC
            LIMIT 10
        """
        top_cities = await execute_query(top_cities_sql)

        return {
            "overview": stats,
            "top_countries": top_countries,
            "top_cities": top_cities,
        }
