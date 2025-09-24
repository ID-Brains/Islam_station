"""
Quran query management for optimized SQL operations
"""

import os
from pathlib import Path
from typing import Optional


# Path to query files
QUERIES_DIR = Path(__file__).parent.parent.parent.parent / "database" / "queries" / "quran"


def _load_query(filename: str) -> str:
    """Load SQL query from file"""
    query_path = QUERIES_DIR / filename
    if not query_path.exists():
        raise FileNotFoundError(f"Query file not found: {query_path}")

    with open(query_path, 'r', encoding='utf-8') as f:
        return f.read().strip()


def get_search_query() -> str:
    """
    Get optimized full-text search query for Quran verses

    Expected parameters: query_text, limit, offset
    Returns: verse results with highlighting
    """
    return _load_query("full_text_search.sql")


def get_surah_query() -> str:
    """
    Get query to fetch complete Surah with all verses

    Expected parameters: surah_number
    Returns: all verses for the surah with metadata
    """
    return _load_query("get_surah.sql")


def get_verse_query() -> str:
    """
    Get query to fetch specific verse

    Expected parameters: surah_number, verse_number
    Returns: single verse with context
    """
    return _load_query("get_verse.sql")


def get_random_verse_query() -> str:
    """
    Get query to fetch random verse for daily feature

    Returns: random verse
    """
    return _load_query("random_verse.sql")
