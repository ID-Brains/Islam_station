"""
Mosque query management for optimized SQL operations
"""

from pathlib import Path


# Path to query files
QUERIES_DIR = (
    Path(__file__).parent.parent.parent.parent / "database" / "queries" / "mosque"
)


def _load_query(filename: str) -> str:
    """Load SQL query from file"""
    query_path = QUERIES_DIR / filename
    if not query_path.exists():
        raise FileNotFoundError(f"Query file not found: {query_path}")

    with open(query_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def get_nearby_mosques_query() -> str:
    """
    Simple query for mosques - spatial functionality moved to OpenStreetMap API

    Expected parameters: None (nearby search handled by OpenStreetMap API)
    Returns: basic mosque listing
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        ORDER BY "name" ASC
        LIMIT 100
    """


def get_mosque_by_id_query() -> str:
    """
    Get query to fetch specific mosque by ID

    Expected parameters: mosque_id
    Returns: single mosque with all details
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        WHERE "mosque_id" = $1
    """


def search_mosques_by_name_query() -> str:
    """
    Get query to search mosques by name

    Expected parameters: search_pattern (with % wildcards)
    Returns: mosques matching the search term
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        WHERE "name" ILIKE $1
    """


def get_mosques_in_bbox_query() -> str:
    """
    Get query to fetch mosques - bbox functionality moved to OpenStreetMap API

    Expected parameters: None (spatial search handled by OpenStreetMap API)
    Returns: basic mosque listing
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        ORDER BY "name" ASC
        LIMIT 100
    """


def get_mosques_by_city_query() -> str:
    """
    Get query to fetch all mosques in a specific city

    Expected parameters: city_name
    Returns: mosques in the specified city
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        WHERE LOWER("city") = LOWER($1)
        ORDER BY "name" ASC
    """


def get_mosques_by_country_query() -> str:
    """
    Get query to fetch all mosques in a specific country

    Expected parameters: country_name
    Returns: mosques in the specified country
    """
    return """
        SELECT "mosque_id", "name", "address", "city", "country",
               latitude, longitude
        FROM "mosques"
        WHERE LOWER("country") = LOWER($1)
        ORDER BY "city" ASC, "name" ASC
    """
