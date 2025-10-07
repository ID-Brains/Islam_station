"""
Quran API Router for The Islamic Guidance Station
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict

from ..database import execute_query, execute_query_single
from ..queries.quran_queries import (
    get_advanced_search_query,
    get_surah_query,
    get_random_verse_query,
)

# Import Arabic text processing utilities
try:
    import pyarabic.araby as araby

    PYARABIC_AVAILABLE = True
except ImportError:
    PYARABIC_AVAILABLE = False
    araby = None


def remove_diacritics(text: str) -> str:
    """Remove Arabic diacritics from text"""
    if PYARABIC_AVAILABLE and araby:
        return araby.strip_diacritics(text)
    else:
        # Fallback: basic diacritic removal
        diacritics = "\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0670\u0640"
        return "".join(c for c in text if c not in diacritics)


def normalize_arabic_search(text: str) -> str:
    """Normalize Arabic text for search"""
    # Remove diacritics
    text = remove_diacritics(text)
    # Normalize alef variations
    alef_variants = "\u0627\u0623\u0625\u0622"
    text = "".join("\u0627" if c in alef_variants else c for c in text)
    # Normalize teh marbuta
    text = text.replace("\u0629", "\u0647")
    return text.strip()


def is_arabic_text(text: str) -> bool:
    """Check if text contains Arabic characters"""
    return any("\u0600" <= c <= "\u06ff" for c in text)


router = APIRouter()


@router.get("/search")
async def search_quran(
    q: str = Query(
        ..., description="Search query for Quran verses", min_length=1, max_length=500
    ),
    type: str = Query(
        default="fulltext",
        description="Search type: fulltext, exact, translation, arabic",
        regex="^(fulltext|exact|translation|arabic)$",
    ),
    language: str = Query(
        default="both",
        description="Language filter: both, arabic, english",
        regex="^(both|arabic|english)$",
    ),
    page: int = Query(
        default=1, description="Page number for pagination", ge=1, le=1000
    ),
    limit: int = Query(
        default=10, description="Maximum number of results per page", ge=1, le=100
    ),
    surah: str = Query(
        default="all",
        description="Surah filter: all or surah number",
        regex="^(all|[1-9][0-9]?|1[0-4][0-4])$",
    ),
) -> dict[str, Any]:
    """
    Search Quran verses with advanced filtering
    """
    try:
        # Validate inputs
        if not q or len(q.strip()) == 0:
            raise HTTPException(status_code=400, detail="Search query cannot be empty")

        if len(q) > 500:
            raise HTTPException(
                status_code=400, detail="Search query too long (max 500 characters)"
            )

        # Enhance search query with Arabic text processing
        if is_arabic_text(q):
            # For Arabic text, remove diacritics and normalize for better search
            normalized_query = normalize_arabic_search(q)
            # Use both original and normalized for better matching
            q = f"{q} OR {normalized_query}"

        # Validate surah number if provided
        if surah != "all":
            try:
                surah_num = int(surah)
                if not 1 <= surah_num <= 114:
                    raise HTTPException(
                        status_code=400, detail="Surah number must be between 1 and 114"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid surah number format"
                )

        # Calculate offset from page
        offset = (page - 1) * limit

        # Get advanced search query with filtering
        query = get_advanced_search_query()

        # Execute query with all filtering parameters
        results = await execute_query(query, q, limit, offset, type, language, surah)

        # Get total count for pagination (execute count query)
        count_query = """
        SELECT COUNT(*) as total
        FROM "ayahs" a
        JOIN "surahs" s ON a."surah_id" = s."surah_id"
        WHERE 
            (
                ($2 = 'arabic' OR $2 = 'both') 
                AND a."ayah_ar_tsv" @@ plainto_tsquery('arabic', $1)
            ) OR (
                ($2 = 'english' OR $2 = 'both') 
                AND to_tsvector('english', a."ayah_en") @@ plainto_tsquery('english', $1)
            )
            AND ($3 = 'all' OR s."surah_no"::text = $3)
            AND (
                $4 = 'fulltext' OR
                ($4 = 'exact' AND (
                    a."ayah_ar" LIKE '%' || $1 || '%' OR a."ayah_en" ILIKE '%' || $1 || '%'
                )) OR
                ($4 = 'arabic' AND a."ayah_ar" LIKE '%' || $1 || '%') OR
                ($4 = 'translation' AND a."ayah_en" ILIKE '%' || $1 || '%')
            )
        """

        count_result = await execute_query_single(count_query, q, language, surah, type)
        total_results = count_result.get("total", 0) if count_result else 0
        total_pages = (total_results + limit - 1) // limit  # Ceiling division

        return {
            "query": q,
            "type": type,
            "language": language,
            "page": page,
            "limit": limit,
            "surah": surah,
            "results": results,
            "totalResults": total_results,
            "totalPages": total_pages,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/surah/{surah_number}")
async def get_surah(
    surah_number: int,
) -> dict[str, Any]:
    """
    Get complete Surah by number
    """
    try:
        # Validate surah number
        if not isinstance(surah_number, int) or not 1 <= surah_number <= 114:
            raise HTTPException(
                status_code=400,
                detail="Invalid surah number. Must be between 1 and 114.",
            )

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
                "name_arabic": surah_info.get("surah_name_ar"),
                "name_english": surah_info.get("surah_name_en"),
                "verses_count": surah_info.get("total_ayah_surah"),
            },
            "verses": verses,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch surah: {str(e)}")


@router.get("/surahs")
async def get_all_surahs() -> Dict[str, Any]:
    """
    Get list of all Surahs with basic information
    """
    try:
        query = """
            SELECT 
                s."surah_no" as number,
                s."surah_name_ar" as name_arabic,
                s."surah_name_en" as name_english,
                s."total_ayah_surah" as verses_count,
                s."place_of_revelation" as revelation_place
            FROM "surahs" s
            ORDER BY s."surah_no" ASC
        """

        surahs = await execute_query(query)

        return {
            "surahs": surahs,
            "count": len(surahs),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch surahs list: {str(e)}"
        )


@router.get("/random")
async def get_random_verse() -> Dict[str, Any]:
    """
    Get a random Quran verse
    """
    try:
        # Get optimized query from DB engineer
        query = get_random_verse_query()

        # Execute query
        verse = await execute_query_single(query)

        if not verse:
            raise HTTPException(status_code=404, detail="No verse found")

        return {"verse": verse}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch random verse: {str(e)}"
        )
