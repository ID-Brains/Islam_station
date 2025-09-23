"""
Quran query management for optimized SQL operations
"""

from pathlib import Path


# Path to query files (provided by DB engineer)
QUERIES_DIR = (
    Path(__file__).parent.parent.parent.parent / "database" / "queries" / "quran"
)


def _load_query(filename: str) -> str:
    """Load SQL query from file"""
    query_path = QUERIES_DIR / filename
    if not query_path.exists():
        raise FileNotFoundError(f"Query file not found: {query_path}")

    with open(query_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def get_search_query() -> str:
    """
    Get optimized full-text search query for Quran verses

    Expected parameters: query_text, limit, offset
    Returns: verse results with highlighting
    """
    try:
        return _load_query("search.sql")
    except FileNotFoundError:
        # Fallback placeholder query
        return """
        SELECT
            v.surah_number,
            v.verse_number,
            v.text_uthmani,
            v.translation_en,
            ts_headline(v.translation_en, plainto_tsquery(%s)) as highlighted_text,
            s.name_arabic,
            s.name_english
        FROM verses v
        JOIN surahs s ON v.surah_id = s.id
        WHERE v.fts_vector @@ plainto_tsquery(%s)
        ORDER BY ts_rank(v.fts_vector, plainto_tsquery(%s)) DESC
        LIMIT %s OFFSET %s
        """


def get_surah_query() -> str:
    """
    Get query to fetch complete Surah with all verses

    Expected parameters: surah_number
    Returns: all verses for the surah with metadata
    """
    try:
        return _load_query("get_surah.sql")
    except FileNotFoundError:
        # Fallback placeholder query
        return """
        SELECT
            v.verse_number,
            v.text_uthmani,
            v.text_indopak,
            v.text_simple,
            v.transliteration,
            v.translation_en,
            s.name_arabic,
            s.name_english,
            s.revelation_place,
            s.verses_count
        FROM verses v
        JOIN surahs s ON v.surah_id = s.id
        WHERE s.number = %s
        ORDER BY v.verse_number
        """


def get_verse_query() -> str:
    """
    Get query to fetch specific verse

    Expected parameters: surah_number, verse_number
    Returns: single verse with context
    """
    try:
        return _load_query("get_verse.sql")
    except FileNotFoundError:
        # Fallback placeholder query
        return """
        SELECT
            v.verse_number,
            v.text_uthmani,
            v.text_indopak,
            v.text_simple,
            v.transliteration,
            v.translation_en,
            s.name_arabic,
            s.name_english,
            s.number as surah_number
        FROM verses v
        JOIN surahs s ON v.surah_id = s.id
        WHERE s.number = %s AND v.verse_number = %s
        """


def get_random_verse_query() -> str:
    """
    Get query to fetch random verse for daily feature

    Returns: random verse
    """
    try:
        return _load_query("random_verse.sql")
    except FileNotFoundError:
        # Fallback placeholder query
        return """
        SELECT
            v.verse_number,
            v.text_uthmani,
            v.translation_en,
            s.name_arabic,
            s.name_english,
            s.number as surah_number
        FROM verses v
        JOIN surahs s ON v.surah_id = s.id
        ORDER BY RANDOM()
        LIMIT 1
        """
