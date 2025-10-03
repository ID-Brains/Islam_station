"""
Mosque query management for optimized SQL operations
"""

from pathlib import Path


# Path to query files
QUERIES_DIR = Path(__file__).parent.parent.parent.parent / "database" / "queries" / "mosque"


def _load_query(filename: str) -> str:
    """Load SQL query from file"""
    query_path = QUERIES_DIR / filename
    if not query_path.exists():
        raise FileNotFoundError(f"Query file not found: {query_path}")

    with open(query_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def get_nearby_mosques_query() -> str:
    """
    Get optimized spatial query for finding nearby mosques

    Expected parameters: latitude, longitude, radius_meters
    Returns: mosques within radius with distance
    """
    return _load_query("nearby_search.sql")


def get_mosque_by_id_query() -> str:
    """
    Get query to fetch specific mosque by ID

    Expected parameters: mosque_id
    Returns: single mosque with all details
    """
    return '''
        SELECT "mosque_id", "name", "address", "city", "country",
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude
        FROM "mosques"
        WHERE "mosque_id" = $1
    '''


def search_mosques_by_name_query() -> str:
    """
    Get query to search mosques by name

    Expected parameters: search_pattern (with % wildcards)
    Returns: mosques matching the search term
    """
    return '''
        SELECT "mosque_id", "name", "address", "city", "country",
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude
        FROM "mosques"
        WHERE "name" ILIKE $1
    '''


def get_mosques_in_bbox_query() -> str:
    """
    Get query to fetch mosques within a bounding box

    Expected parameters: min_lng, min_lat, max_lng, max_lat
    Returns: all mosques within the rectangular area
    """
    return '''
        SELECT "mosque_id", "name", "address", "city", "country",
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude
        FROM "mosques"
        WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY "name" ASC
    '''


def get_mosques_by_city_query() -> str:
    """
    Get query to fetch all mosques in a specific city

    Expected parameters: city_name
    Returns: mosques in the specified city
    """
    return '''
        SELECT "mosque_id", "name", "address", "city", "country",
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude
        FROM "mosques"
        WHERE LOWER("city") = LOWER($1)
        ORDER BY "name" ASC
    '''


def get_mosques_by_country_query() -> str:
    """
    Get query to fetch all mosques in a specific country

    Expected parameters: country_name
    Returns: mosques in the specified country
    """
    return '''
        SELECT "mosque_id", "name", "address", "city", "country",
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude
        FROM "mosques"
        WHERE LOWER("country") = LOWER($1)
        ORDER BY "city" ASC, "name" ASC
    '''
