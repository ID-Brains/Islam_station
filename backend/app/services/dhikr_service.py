"""
Dhikr Service - Business logic for dhikr and dua operations
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
from ..database import execute_query, execute_query_single


class DhikrService:
    """Service class for dhikr and dua related business logic"""

    @staticmethod
    async def get_daily_dhikr(category_id: int = 1) -> Optional[Dict[str, Any]]:
        """
        Get a random dhikr for daily practice

        Args:
            category_id: Category of dhikr (default: general)

        Returns:
            Random dhikr from category
        """
        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = $1
            ORDER BY (dhikr_id % 365) = EXTRACT(DOY FROM NOW())::int DESC,
                     dhikr_id
            LIMIT 1
        """

        return await execute_query_single(sql, category_id)

    @staticmethod
    async def get_dhikr_by_time_of_day() -> List[Dict[str, Any]]:
        """
        Get appropriate dhikr based on current time of day

        Returns:
            List of time-appropriate dhikr
        """
        now = datetime.now()
        hour = now.hour

        # Determine time category
        # Morning: 5am - 12pm (category 1)
        # Evening: 5pm - 8pm (category 2)
        # Night: 8pm - 5am (category 3)
        # General: 12pm - 5pm (category 4)

        if 5 <= hour < 12:
            category_id = 1  # Morning adhkar
        elif 17 <= hour < 20:
            category_id = 2  # Evening adhkar
        elif hour >= 20 or hour < 5:
            category_id = 3  # Night adhkar
        else:
            category_id = 4  # General adhkar

        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = $1
            ORDER BY "dhikr_id" ASC
            LIMIT 10
        """

        return await execute_query(sql, category_id)

    @staticmethod
    async def get_dhikr_by_category(
        category_id: int, limit: int = 20, offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get all dhikr from a specific category with pagination

        Args:
            category_id: Category ID
            limit: Maximum results
            offset: Pagination offset

        Returns:
            Dhikr list with metadata
        """
        # Get total count
        count_sql = """
            SELECT COUNT(*) as total
            FROM "dhikr"
            WHERE "category_id" = $1
        """
        count_result = await execute_query_single(count_sql, category_id)
        total = count_result.get("total", 0) if count_result else 0

        # Get dhikr
        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = $1
            ORDER BY "dhikr_id" ASC
            LIMIT $2 OFFSET $3
        """

        dhikr_list = await execute_query(sql, category_id, limit, offset)

        return {
            "results": dhikr_list,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(dhikr_list)) < total,
        }

    @staticmethod
    async def search_dhikr(
        query: str, language: str = "both", limit: int = 20, offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search dhikr by text content

        Args:
            query: Search term
            language: 'arabic', 'english', or 'both'
            limit: Maximum results
            offset: Pagination offset

        Returns:
            Search results with metadata
        """
        search_pattern = f"%{query}%"

        # Build query based on language
        if language == "arabic":
            sql = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_ar" ILIKE $1 OR "benefits_ar" ILIKE $1
                ORDER BY "dhikr_id" ASC
            """
            params = [search_pattern]
        elif language == "english":
            sql = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_en" ILIKE $1 OR "benefits_en" ILIKE $1
                ORDER BY "dhikr_id" ASC
            """
            params = [search_pattern]
        else:  # both
            sql = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "text_ar" ILIKE $1 OR "text_en" ILIKE $1
                   OR "benefits_ar" ILIKE $1 OR "benefits_en" ILIKE $1
                ORDER BY "dhikr_id" ASC
            """
            params = [search_pattern]

        # Get count
        count_sql = sql.replace(
            'SELECT "dhikr_id", "category_id", "text_ar", "text_en", "benefits_ar", "benefits_en", "reference"',
            "SELECT COUNT(*) as total",
        ).replace('ORDER BY "dhikr_id" ASC', "")

        count_result = await execute_query_single(count_sql, *params)
        total = count_result.get("total", 0) if count_result else 0

        # Add pagination
        sql += f" LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
        params.extend([limit, offset])

        results = await execute_query(sql, *params)

        return {
            "results": results,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(results)) < total,
            "query": query,
            "language": language,
        }

    @staticmethod
    async def get_dhikr_with_benefits() -> List[Dict[str, Any]]:
        """
        Get all dhikr that have documented benefits

        Returns:
            List of dhikr with benefits
        """
        sql = """
            SELECT d."dhikr_id", d."category_id", d."text_ar", d."text_en",
                   d."benefits_ar", d."benefits_en", d."reference",
                   c."name_ar" as category_name_ar, c."name_en" as category_name_en
            FROM "dhikr" d
            JOIN "categories" c ON d."category_id" = c."category_id"
            WHERE (d."benefits_ar" IS NOT NULL AND d."benefits_ar" != '')
               OR (d."benefits_en" IS NOT NULL AND d."benefits_en" != '')
            ORDER BY d."category_id" ASC, d."dhikr_id" ASC
        """

        return await execute_query(sql)

    @staticmethod
    async def get_dhikr_by_reference(reference: str) -> List[Dict[str, Any]]:
        """
        Get dhikr from a specific hadith or Quran reference

        Args:
            reference: Reference source (e.g., "Sahih Muslim", "Quran 2:255")

        Returns:
            List of dhikr with matching reference
        """
        search_pattern = f"%{reference}%"

        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "reference" ILIKE $1
            ORDER BY "dhikr_id" ASC
        """

        return await execute_query(sql, search_pattern)

    @staticmethod
    async def get_all_categories() -> List[Dict[str, Any]]:
        """
        Get all dhikr categories with counts

        Returns:
            List of categories with dhikr counts
        """
        sql = """
            SELECT c."category_id", c."name_ar", c."name_en",
                   COUNT(d."dhikr_id") as dhikr_count
            FROM "categories" c
            LEFT JOIN "dhikr" d ON c."category_id" = d."category_id"
            GROUP BY c."category_id", c."name_ar", c."name_en"
            ORDER BY c."category_id" ASC
        """

        return await execute_query(sql)

    @staticmethod
    async def get_morning_adhkar(limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get morning adhkar (azkar al-sabah)

        Args:
            limit: Number of adhkar to return

        Returns:
            List of morning adhkar
        """
        # Assuming category_id 1 is for morning adhkar
        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = 1
            ORDER BY "dhikr_id" ASC
            LIMIT $1
        """

        return await execute_query(sql, limit)

    @staticmethod
    async def get_evening_adhkar(limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get evening adhkar (azkar al-masa)

        Args:
            limit: Number of adhkar to return

        Returns:
            List of evening adhkar
        """
        # Assuming category_id 2 is for evening adhkar
        sql = """
            SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                   "benefits_ar", "benefits_en", "reference"
            FROM "dhikr"
            WHERE "category_id" = 2
            ORDER BY "dhikr_id" ASC
            LIMIT $1
        """

        return await execute_query(sql, limit)

    @staticmethod
    async def get_random_dhikr(
        category_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a random dhikr, optionally from a specific category

        Args:
            category_id: Optional category filter

        Returns:
            Random dhikr
        """
        if category_id:
            sql = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                WHERE "category_id" = $1
                ORDER BY (dhikr_id % 365) = EXTRACT(DOY FROM NOW())::int DESC,
                         dhikr_id
                LIMIT 1
            """
            return await execute_query_single(sql, category_id)
        else:
            sql = """
                SELECT "dhikr_id", "category_id", "text_ar", "text_en",
                       "benefits_ar", "benefits_en", "reference"
                FROM "dhikr"
                ORDER BY (dhikr_id % 365) = EXTRACT(DOY FROM NOW())::int DESC,
                         dhikr_id
                LIMIT 1
            """
            return await execute_query_single(sql)

    @staticmethod
    async def get_dhikr_collection(dhikr_ids: List[int]) -> List[Dict[str, Any]]:
        """
        Get multiple dhikr by their IDs (useful for saved collections)

        Args:
            dhikr_ids: List of dhikr IDs to retrieve

        Returns:
            List of dhikr matching the IDs
        """
        if not dhikr_ids:
            return []

        # Create parameter placeholders
        placeholders = ",".join([f"${i+1}" for i in range(len(dhikr_ids))])

        sql = f"""
            SELECT d."dhikr_id", d."category_id", d."text_ar", d."text_en",
                   d."benefits_ar", d."benefits_en", d."reference",
                   c."name_ar" as category_name_ar, c."name_en" as category_name_en
            FROM "dhikr" d
            JOIN "categories" c ON d."category_id" = c."category_id"
            WHERE d."dhikr_id" IN ({placeholders})
            ORDER BY d."dhikr_id" ASC
        """

        return await execute_query(sql, *dhikr_ids)

    @staticmethod
    async def get_dhikr_statistics() -> Dict[str, Any]:
        """
        Get overall dhikr statistics

        Returns:
            Statistics about dhikr in database
        """
        sql = """
            SELECT
                COUNT(*) as total_dhikr,
                COUNT(DISTINCT "category_id") as total_categories,
                COUNT(CASE WHEN "benefits_ar" IS NOT NULL THEN 1 END) as dhikr_with_benefits,
                COUNT(CASE WHEN "reference" IS NOT NULL THEN 1 END) as dhikr_with_references
            FROM "dhikr"
        """

        stats = await execute_query_single(sql)

        # Get category breakdown
        category_sql = """
            SELECT c."name_en", c."name_ar", COUNT(d."dhikr_id") as count
            FROM "categories" c
            LEFT JOIN "dhikr" d ON c."category_id" = d."category_id"
            GROUP BY c."category_id", c."name_en", c."name_ar"
            ORDER BY count DESC
        """
        category_breakdown = await execute_query(category_sql)

        return {"overview": stats, "category_breakdown": category_breakdown}

    @staticmethod
    def get_dhikr_of_the_day_deterministic(date_obj: Optional[date] = None) -> int:
        """
        Get a deterministic dhikr ID based on the date
        (same dhikr for the same date across all users)

        Args:
            date_obj: Date for calculation (defaults to today)

        Returns:
            Dhikr ID that should be featured for this date
        """
        if date_obj is None:
            date_obj = date.today()

        # Use day of year to select dhikr (cycles through year)
        day_of_year = date_obj.timetuple().tm_yday

        # Assuming we have at least 365 dhikr entries
        # This creates a deterministic selection based on date
        # Can be adjusted based on actual dhikr count
        return (day_of_year % 100) + 1

    @staticmethod
    async def get_featured_dhikr() -> Optional[Dict[str, Any]]:
        """
        Get the featured dhikr of the day (deterministic based on date)

        Returns:
            Featured dhikr for today
        """
        dhikr_id = DhikrService.get_dhikr_of_the_day_deterministic()

        sql = """
            SELECT d."dhikr_id", d."category_id", d."text_ar", d."text_en",
                   d."benefits_ar", d."benefits_en", d."reference",
                   c."name_ar" as category_name_ar, c."name_en" as category_name_en
            FROM "dhikr" d
            JOIN "categories" c ON d."category_id" = c."category_id"
            WHERE d."dhikr_id" = $1
        """

        result = await execute_query_single(sql, dhikr_id)

        # If specific dhikr not found, return a random one
        if not result:
            return await DhikrService.get_random_dhikr()

        return result
