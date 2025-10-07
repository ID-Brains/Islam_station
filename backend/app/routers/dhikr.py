"""
Dhikr & Dua API Router for The Islamic Guidance Station
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict

from ..database import execute_query, execute_query_single
from ..queries.dhikr_queries import (
    get_daily_dhikr_query,
    get_random_dhikr_query,
)

router = APIRouter()


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
            query = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                ORDER BY RANDOM()
                LIMIT 1
            """
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
            status_code=500, detail=f"Failed to fetch random dhikr: {str(e)}"
        )
