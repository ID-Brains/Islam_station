"""
Quran API Router for The Islamic Guidance Station
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional

from ..database import execute_query, execute_query_single
from ..queries.quran_queries import get_search_query, get_surah_query

router = APIRouter()


@router.get("/search")
async def search_quran(
    q: str = Query(..., description="Search query for Quran verses"),
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Offset for pagination")
) -> Dict[str, Any]:
    """
    Search Quran verses using full-text search
    """
    try:
        # Get optimized query from DB engineer
        query = get_search_query()

        # Execute search
        results = await execute_query(query, q, limit, offset)

        return {
            "query": q,
            "results": results,
            "limit": limit,
            "offset": offset,
            "total": len(results)  # TODO: Implement proper count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/surah/{surah_number}")
async def get_surah(
    surah_number: int,
    translation: Optional[str] = Query(None, description="Include translation")
) -> Dict[str, Any]:
    """
    Get complete Surah by number
    """
    try:
        # Validate surah number
        if not 1 <= surah_number <= 114:
            raise HTTPException(status_code=400, detail="Invalid surah number")

        # Get optimized query from DB engineer
        query = get_surah_query()

        # Execute query
        verses = await execute_query(query, surah_number)

        if not verses:
            raise HTTPException(status_code=404, detail="Surah not found")

        # Get surah metadata
        surah_info = verses[0] if verses else {}

        return {
            "surah": {
                "number": surah_number,
                "name_arabic": surah_info.get("name_arabic"),
                "name_english": surah_info.get("name_english"),
                "verses_count": len(verses)
            },
            "verses": verses
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch surah: {str(e)}")


@router.get("/verse/{surah_number}/{verse_number}")
async def get_verse(
    surah_number: int,
    verse_number: int,
    translation: Optional[str] = Query(None, description="Include translation")
) -> Dict[str, Any]:
    """
    Get specific verse by surah and verse number
    """
    try:
        # TODO: Implement verse retrieval
        raise HTTPException(status_code=501, detail="Verse endpoint not implemented yet")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch verse: {str(e)}")
