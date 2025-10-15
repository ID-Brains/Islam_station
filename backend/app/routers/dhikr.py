"""
Dhikr & Dua API Router for The Islamic Guidance Station
"""

import logfire
from fastapi import APIRouter, Query, HTTPException
from typing import Any, Dict

from ..services.dhikr_service import DhikrService

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
        dhikr = await DhikrService.get_random_dhikr(category_id)

        if not dhikr:
            raise HTTPException(status_code=404, detail="No dhikr found")

        return {
            "dhikr": dhikr,
        }
    except HTTPException:
        raise
    except Exception:
        logfire.exception(
            "Failed to fetch random dhikr",
            category_id=category_id,
        )
        raise HTTPException(status_code=500, detail="Failed to fetch random dhikr")
