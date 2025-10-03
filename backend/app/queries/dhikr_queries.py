"""
Dhikr & Dua query management for optimized SQL operations
"""

from pathlib import Path


# Path to query files
QUERIES_DIR = Path(__file__).parent.parent.parent.parent / "database" / "queries" / "dhikr"


def _load_query(filename: str) -> str:
    """Load SQL query from file"""
    query_path = QUERIES_DIR / filename
    if not query_path.exists():
        raise FileNotFoundError(f"Query file not found: {query_path}")

    with open(query_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def get_daily_dhikr_query() -> str:
    """
    Get query for daily random dhikr from a category

    Expected parameters: category_id
    Returns: random dhikr from category
    """
    return _load_query("daily_random.sql")


def get_dhikr_by_category_query() -> str:
    """
    Get query to fetch all dhikr from a specific category

    Expected parameters: category_id
    Returns: all dhikr in the category
    """
    return _load_query("category_filter.sql")


def get_dhikr_by_id_query() -> str:
    """
    Get query to fetch specific dhikr by ID

    Expected parameters: dhikr_id
    Returns: single dhikr with all details
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE "dhikr_id" = $1
    '''


def get_random_dhikr_query() -> str:
    """
    Get query for random dhikr from a category

    Expected parameters: category_id
    Returns: random dhikr
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE "category_id" = $1
        ORDER BY RANDOM()
        LIMIT 1
    '''


def get_all_dhikr_query() -> str:
    """
    Get query to fetch all dhikr

    Returns: all dhikr ordered by category and ID
    """
    return '''
        SELECT d."dhikr_id", d."category_id", d."text_ar", d."text_en",
               d."benefits_ar", d."benefits_en", d."reference",
               c."name_ar" as category_name_ar, c."name_en" as category_name_en
        FROM "dhikr" d
        JOIN "categories" c ON d."category_id" = c."category_id"
        ORDER BY d."category_id" ASC, d."dhikr_id" ASC
    '''


def get_dhikr_with_benefits_query() -> str:
    """
    Get query to fetch dhikr that have benefits documented

    Returns: dhikr with non-null benefits
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE ("benefits_ar" IS NOT NULL AND "benefits_ar" != '')
           OR ("benefits_en" IS NOT NULL AND "benefits_en" != '')
        ORDER BY "dhikr_id" ASC
    '''


def get_dhikr_by_reference_query() -> str:
    """
    Get query to fetch dhikr from a specific source/reference

    Expected parameters: reference_pattern (with % wildcards)
    Returns: dhikr matching the reference
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE "reference" ILIKE $1
        ORDER BY "dhikr_id" ASC
    '''


def search_dhikr_arabic_query() -> str:
    """
    Get query to search dhikr by Arabic text

    Expected parameters: search_pattern (with % wildcards)
    Returns: matching dhikr
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE "text_ar" ILIKE $1 OR "benefits_ar" ILIKE $1
        ORDER BY "dhikr_id" ASC
    '''


def search_dhikr_english_query() -> str:
    """
    Get query to search dhikr by English translation

    Expected parameters: search_pattern (with % wildcards)
    Returns: matching dhikr
    """
    return '''
        SELECT "dhikr_id", "category_id", "text_ar", "text_en",
               "benefits_ar", "benefits_en", "reference"
        FROM "dhikr"
        WHERE "text_en" ILIKE $1 OR "benefits_en" ILIKE $1
        ORDER BY "dhikr_id" ASC
    '''
