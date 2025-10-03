"""
Dhikr & Dua API Router for The Islamic Guidance Station
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict, List

from ..database import execute_query, execute_query_single
from ..queries.dhikr_queries import (
    get_daily_dhikr_query,
    get_dhikr_by_category_query,
    get_dhikr_by_id_query,
    get_random_dhikr_query,
)

router = APIRouter()


@router.get("/daily")
async def get_daily_dhikr(
    category_id: int = Query(default=1, description="Category ID for daily dhikr", ge=1),
) -> Dict[str, Any]:
    """
    Get a random dhikr/dua for daily spiritual practice

    Args:
        category_id: Category of dhikr (morning, evening, general, etc.)

    Returns:
        Random dhikr from the specified category
    """
    try:
        # Get daily dhikr query
        query = get_daily_dhikr_query()

        # Execute query
        dhikr = await execute_query_single(query, category_id)

        if not dhikr:
            raise HTTPException(
                status_code=404,
                detail=f"No dhikr found for category {category_id}"
            )

        return {
            "dhikr": dhikr,
            "category_id": category_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch daily dhikr: {str(e)}"
        )


@router.get("/category/{category_id}")
async def get_dhikr_by_category(
    category_id: int,
    limit: int = Query(default=20, description="Maximum number of results", le=100),
    offset: int = Query(default=0, description="Offset for pagination", ge=0),
) -> Dict[str, Any]:
    """
    Get all dhikr/dua from a specific category

    Args:
        category_id: Category ID to filter by
        limit: Maximum results to return
        offset: Pagination offset

    Returns:
        List of dhikr from the category
    """
    try:
        # Validate category ID
        if category_id < 1:
            raise HTTPException(status_code=400, detail="Invalid category ID")

        # Get category query
        query = get_dhikr_by_category_query()

        # Add pagination
        query += f' LIMIT ${2} OFFSET ${3}'

        # Execute query
        dhikr_list = await execute_query(query, category_id, limit, offset)

        return {
            "category_id": category_id,
            "dhikr": dhikr_list,
            "limit": limit,
            "offset": offset,
            "count": len(dhikr_list),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dhikr by category: {str(e)}"
        )


@router.get("/random")
async def get_random_dhikr(
    category_id: int = Query(None, description="Optional category filter"),
) -> Dict[str, Any]:
    """
    Get a random dhikr/dua, optionally filtered by category

    Args:
        category_id: Optional category to filter random selection

    Returns:
        Random dhikr
    """
    try:
        # Get random dhikr query
        query = get_random_dhikr_query()

        # Add category filter if provided
        if category_id:
            dhikr = await execute_query_single(query, category_id)
        else:
            # Get random from all categories
            query = '''
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                ORDER BY RANDOM()
                LIMIT 1
            '''
            dhikr = await execute_query_single(query)

        if not dhikr:
            raise HTTPException(status_code=404, detail="No dhikr found")

        return {
            "dhikr": dhikr,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch random dhikr: {str(e)}"
        )


@router.get("/{dhikr_id}")
async def get_dhikr_by_id(
    dhikr_id: int,
) -> Dict[str, Any]:
    """
    Get specific dhikr/dua by ID

    Args:
        dhikr_id: Unique identifier of the dhikr

    Returns:
        Dhikr details
    """
    try:
        # Validate dhikr ID
        if dhikr_id < 1:
            raise HTTPException(status_code=400, detail="Invalid dhikr ID")

        # Get dhikr query
        query = get_dhikr_by_id_query()

        # Execute query
        dhikr = await execute_query_single(query, dhikr_id)

        if not dhikr:
            raise HTTPException(status_code=404, detail="Dhikr not found")

        return {"dhikr": dhikr}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dhikr: {str(e)}"
        )


@router.get("/categories")
async def get_dhikr_categories() -> Dict[str, Any]:
    """
    Get all available dhikr/dua categories

    Returns:
        List of categories with counts
    """
    try:
        query = '''
            SELECT c."category_id", c."name_ar", c."name_en",
                   COUNT(d."dhikr_id") as dhikr_count
            FROM "categories" c
            LEFT JOIN "dhikr" d ON c."category_id" = d."category_id"
            GROUP BY c."category_id", c."name_ar", c."name_en"
            ORDER BY c."category_id" ASC
        '''

        categories = await execute_query(query)

        return {
            "categories": categories,
            "count": len(categories),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/search")
async def search_dhikr(
    q: str = Query(..., description="Search query in Arabic or English", min_length=2),
    language: str = Query(default="both", description="Search language: 'arabic', 'english', or 'both'"),
    limit: int = Query(default=20, description="Maximum number of results", le=100),
    offset: int = Query(default=0, description="Offset for pagination", ge=0),
) -> Dict[str, Any]:
    """
    Search dhikr/dua by text content

    Args:
        q: Search term
        language: Which language to search in
        limit: Maximum results
        offset: Pagination offset

    Returns:
        List of matching dhikr
    """
    try:
        search_pattern = f"%{q}%"

        # Build query based on language
        if language == "arabic":
            query = '''
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_ar" ILIKE $1 OR "benefits_ar" ILIKE $1
                ORDER BY "dhikr_id" ASC
                LIMIT $2 OFFSET $3
            '''
        elif language == "english":
            query = '''
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_en" ILIKE $1 OR "benefits_en" ILIKE $1
                ORDER BY "dhikr_id" ASC
                LIMIT $2 OFFSET $3
            '''
        else:  # both
            query = '''
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_ar" ILIKE $1 OR "text_en" ILIKE $1
                   OR "benefits_ar" ILIKE $1 OR "benefits_en" ILIKE $1
                ORDER BY "dhikr_id" ASC
                LIMIT $2 OFFSET $3
            '''

        # Execute search
        results = await execute_query(query, search_pattern, limit, offset)

        return {
            "query": q,
            "language": language,
            "results": results,
            "limit": limit,
            "offset": offset,
            "count": len(results),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dhikr search failed: {str(e)}"
        )


@router.get("/morning")
async def get_morning_dhikr(
    limit: int = Query(default=10, description="Number of morning dhikr to return"),
) -> Dict[str, Any]:
    """
    Get morning adhkar (azkar al-sabah)

    Args:
        limit: Number of adhkar to return

    Returns:
        List of morning dhikr
    """
    try:
        # Assuming category_id 1 is for morning adhkar
        query = '''
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = $1
            ORDER BY "dhikr_id" ASC
            LIMIT $2
        '''

        morning_dhikr = await execute_query(query, 1, limit)

        return {
            "type": "morning",
            "dhikr": morning_dhikr,
            "count": len(morning_dhikr),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch morning dhikr: {str(e)}"
        )


@router.get("/evening")
async def get_evening_dhikr(
    limit: int = Query(default=10, description="Number of evening dhikr to return"),
) -> Dict[str, Any]:
    """
    Get evening adhkar (azkar al-masa)

    Args:
        limit: Number of adhkar to return

    Returns:
        List of evening dhikr
    """
    try:
        # Assuming category_id 2 is for evening adhkar
        query = '''
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = $2
            ORDER BY "dhikr_id" ASC
            LIMIT $1
        '''

        evening_dhikr = await execute_query(query, limit, 2)

        return {
            "type": "evening",
            "dhikr": evening_dhikr,
            "count": len(evening_dhikr),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch evening dhikr: {str(e)}"
        )
