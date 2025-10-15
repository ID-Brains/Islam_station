"""
Mosque Service - Business logic for mosque operations using OpenStreetMap API
"""

import math
from typing import Any, Optional

import httpx
import logfire


class MosqueService:
    """Service class for mosque-related business logic using OpenStreetMap"""

    OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    TIMEOUT: float = 30.0

    @staticmethod
    async def find_nearby_mosques(
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Find mosques near a location using OpenStreetMap

        Args:
            latitude: Current location latitude
            longitude: Current location longitude
            radius_meters: Search radius in meters
            limit: Maximum number of results

        Returns:
            List of nearby mosques with distance
        """
        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:{radius_meters},{latitude},{longitude});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:{radius_meters},{latitude},{longitude});
          relation["amenity"="place_of_worship"]["religion"="muslim"](around:{radius_meters},{latitude},{longitude});
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            mosques = []
            for element in data.get("elements", []):
                mosque = MosqueService._parse_osm_element(element)
                if mosque:
                    # Calculate distance and bearing
                    distance_meters = MosqueService._calculate_distance_meters(
                        latitude,
                        longitude,
                        mosque["latitude"],
                        mosque["longitude"],
                    )
                    mosque["distance_meters"] = round(distance_meters, 2)
                    mosque["distance_km"] = round(distance_meters / 1000, 2)

                    bearing = MosqueService._calculate_bearing(
                        latitude,
                        longitude,
                        mosque["latitude"],
                        mosque["longitude"],
                    )
                    mosque["bearing"] = bearing
                    mosque["compass_direction"] = MosqueService.get_compass_direction(
                        bearing
                    )

                    mosques.append(mosque)

            # Sort by distance and limit results
            mosques.sort(key=lambda x: x["distance_meters"])
            return mosques[:limit]

        except Exception:
            logfire.exception(
                "Failed to find nearby mosques",
                latitude=latitude,
                longitude=longitude,
                radius_meters=radius_meters,
            )
            return []

    @staticmethod
    async def search_mosques_by_name(
        name: str,
        city: str | None = None,
        country: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
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
        # Build area filter
        area_filter = ""
        if country:
            area_filter = f'area["name:en"="{country}"]["admin_level"="2"];'
        elif city:
            area_filter = f'area["name"~"{city}",i];'

        query = f"""
        [out:json][timeout:25];
        {area_filter}
        (
          node["amenity"="place_of_worship"]["religion"="muslim"]["name"~"{name}",i](area);
          way["amenity"="place_of_worship"]["religion"="muslim"]["name"~"{name}",i](area);
          relation["amenity"="place_of_worship"]["religion"="muslim"]["name"~"{name}",i](area);
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            mosques = []
            for element in data.get("elements", []):
                mosque = MosqueService._parse_osm_element(element)
                if mosque:
                    mosques.append(mosque)

            total = len(mosques)
            paginated_results = mosques[offset : offset + limit]

            return {
                "results": paginated_results,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + len(paginated_results)) < total,
            }

        except Exception:
            logfire.exception(
                "Failed to search mosques by name",
                name=name,
                city=city,
                country=country,
            )
            return {
                "results": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "has_more": False,
            }

    @staticmethod
    async def get_mosques_in_area(
        min_lat: float,
        min_lng: float,
        max_lat: float,
        max_lng: float,
    ) -> list[dict[str, Any]]:
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
        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"]({min_lat},{min_lng},{max_lat},{max_lng});
          way["amenity"="place_of_worship"]["religion"="muslim"]({min_lat},{min_lng},{max_lat},{max_lng});
          relation["amenity"="place_of_worship"]["religion"="muslim"]({min_lat},{min_lng},{max_lat},{max_lng});
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            mosques = []
            for element in data.get("elements", []):
                mosque = MosqueService._parse_osm_element(element)
                if mosque:
                    mosques.append(mosque)

            return mosques

        except Exception:
            logfire.exception(
                "Failed to get mosques in area",
                min_lat=min_lat,
                min_lng=min_lng,
                max_lat=max_lat,
                max_lng=max_lng,
            )
            return []

    @staticmethod
    async def get_mosques_by_city(city: str) -> list[dict[str, Any]]:
        """
        Get all mosques in a specific city

        Args:
            city: City name

        Returns:
            List of mosques in the city
        """
        query = f"""
        [out:json][timeout:25];
        area["name"~"{city}",i]["admin_level"~"[4-8]"];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](area);
          way["amenity"="place_of_worship"]["religion"="muslim"](area);
          relation["amenity"="place_of_worship"]["religion"="muslim"](area);
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            mosques = []
            for element in data.get("elements", []):
                mosque = MosqueService._parse_osm_element(element)
                if mosque:
                    mosques.append(mosque)

            return mosques

        except Exception:
            logfire.exception(
                "Failed to get mosques by city",
                city=city,
            )
            return []

    @staticmethod
    async def get_mosques_by_country(country: str) -> list[dict[str, Any]]:
        """
        Get all mosques in a specific country

        Args:
            country: Country name

        Returns:
            List of mosques in the country
        """
        query = f"""
        [out:json][timeout:25];
        area["name:en"="{country}"]["admin_level"="2"];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](area);
          way["amenity"="place_of_worship"]["religion"="muslim"](area);
          relation["amenity"="place_of_worship"]["religion"="muslim"](area);
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            mosques = []
            for element in data.get("elements", []):
                mosque = MosqueService._parse_osm_element(element)
                if mosque:
                    mosques.append(mosque)

            return mosques

        except Exception:
            logfire.exception(
                "Failed to get mosques by country",
                country=country,
            )
            return []

    @staticmethod
    async def get_mosque_details(mosque_id: int) -> dict[str, Any] | None:
        """
        Get detailed information about a specific mosque from OSM

        Args:
            mosque_id: OpenStreetMap element ID

        Returns:
            Mosque details or None if not found
        """
        query = f"""
        [out:json][timeout:25];
        (
          node({mosque_id});
          way({mosque_id});
          relation({mosque_id});
        );
        out center tags;
        """

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                response = await client.post(
                    MosqueService.OVERPASS_URL,
                    data={"data": query},
                )
                response.raise_for_status()
                data = response.json()

            elements = data.get("elements", [])
            if elements:
                return MosqueService._parse_osm_element(elements[0])
            return None

        except Exception:
            logfire.exception(
                "Failed to get mosque details",
                mosque_id=mosque_id,
            )
            return None

    @staticmethod
    async def get_cities_with_mosques() -> list[dict[str, Any]]:
        """
        Get list of cities that have mosques
        Note: This is a simplified version as OSM doesn't aggregate this way easily

        Returns:
            List of cities with mosque counts
        """
        # This would require a more complex query or caching strategy
        # For now, return empty as it's computationally expensive
        return []

    @staticmethod
    async def get_countries_with_mosques() -> list[dict[str, Any]]:
        """
        Get list of countries that have mosques
        Note: This is a simplified version

        Returns:
            List of countries with mosque counts
        """
        # This would require a more complex query or caching strategy
        return []

    @staticmethod
    async def get_mosques_along_route(
        waypoints: list[tuple[float, float]],
        buffer_meters: int = 2000,
    ) -> list[dict[str, Any]]:
        """
        Find mosques along a route defined by waypoints

        Args:
            waypoints: List of (latitude, longitude) tuples
            buffer_meters: Search buffer around each waypoint

        Returns:
            List of mosques along the route
        """
        if not waypoints or len(waypoints) < 2:
            return []

        all_mosques = []
        seen_ids = set()

        try:
            async with httpx.AsyncClient(timeout=MosqueService.TIMEOUT) as client:
                for lat, lng in waypoints:
                    query = f"""
                    [out:json][timeout:25];
                    (
                      node["amenity"="place_of_worship"]["religion"="muslim"](around:{buffer_meters},{lat},{lng});
                      way["amenity"="place_of_worship"]["religion"="muslim"](around:{buffer_meters},{lat},{lng});
                      relation["amenity"="place_of_worship"]["religion"="muslim"](around:{buffer_meters},{lat},{lng});
                    );
                    out center tags;
                    """

                    response = await client.post(
                        MosqueService.OVERPASS_URL,
                        data={"data": query},
                    )
                    response.raise_for_status()
                    data = response.json()

                    for element in data.get("elements", []):
                        element_id = element.get("id")
                        if element_id not in seen_ids:
                            mosque = MosqueService._parse_osm_element(element)
                            if mosque:
                                seen_ids.add(element_id)
                                all_mosques.append(mosque)

            return all_mosques

        except Exception:
            logfire.exception(
                "Failed to get mosques along route",
                waypoints_count=len(waypoints),
                buffer_meters=buffer_meters,
            )
            return []

    @staticmethod
    def _parse_osm_element(element: dict[str, Any]) -> dict[str, Any] | None:
        """
        Parse OpenStreetMap element into mosque data structure

        Args:
            element: OSM element from Overpass API

        Returns:
            Parsed mosque dictionary or None
        """
        tags = element.get("tags", {})

        # Get coordinates
        if element.get("type") == "node":
            lat = element.get("lat")
            lon = element.get("lon")
        elif "center" in element:
            lat = element["center"].get("lat")
            lon = element["center"].get("lon")
        else:
            return None

        if lat is None or lon is None:
            return None

        # Extract address components
        address_parts = []
        if tags.get("addr:street"):
            address_parts.append(tags["addr:street"])
        if tags.get("addr:housenumber"):
            address_parts.append(tags["addr:housenumber"])

        address = (
            ", ".join(address_parts) if address_parts else tags.get("addr:full", "")
        )

        return {
            "mosque_id": element.get("id"),
            "name": tags.get("name", tags.get("name:en", "Unnamed Mosque")),
            "address": address,
            "city": tags.get(
                "addr:city", tags.get("addr:town", tags.get("addr:village", ""))
            ),
            "country": tags.get("addr:country", ""),
            "latitude": lat,
            "longitude": lon,
            "denomination": tags.get("denomination", ""),
            "website": tags.get("website", ""),
            "phone": tags.get("phone", ""),
            "opening_hours": tags.get("opening_hours", ""),
        }

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
    def _calculate_distance_meters(
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
            Distance in meters
        """
        earth_radius = 6371000  # meters

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
    async def get_mosque_statistics() -> dict[str, Any]:
        """
        Get overall mosque statistics
        Note: This is limited with OSM API

        Returns:
            Statistics about mosques
        """
        # OSM doesn't provide global statistics easily
        # This would require very expensive queries
        return {
            "overview": {
                "total_mosques": "N/A (Using OpenStreetMap)",
                "unique_cities": "N/A",
                "unique_countries": "N/A",
            },
            "top_countries": [],
            "top_cities": [],
            "note": "Statistics are not available when using OpenStreetMap API. Use location-based queries instead.",
        }
