"""
Quran Service - Business logic for Quran operations
"""

from typing import List, Dict, Any, Optional
from ..database import execute_query, execute_query_single


class QuranService:
    """Service class for Quran-related business logic"""

    @staticmethod
    async def search_verses(
        query: str,
        limit: int = 20,
        offset: int = 0,
        surah_filter: Optional[int] = None,
        language: str = "both"
    ) -> Dict[str, Any]:
        """
        Search Quran verses with advanced filtering

        Args:
            query: Search term
            limit: Maximum results
            offset: Pagination offset
            surah_filter: Optional surah number to filter
            language: Search in 'arabic', 'english', or 'both'

        Returns:
            Search results with metadata
        """
        # Build dynamic query based on language
        if language == "arabic":
            sql = '''
                SELECT
                    s."surah_no",
                    s."surah_name_ar",
                    s."surah_name_en",
                    a."ayah_no_surah",
                    a."ayah_ar",
                    a."ayah_en",
                    a."juz_no",
                    ts_rank(a."ayah_ar_tsv", websearch_to_tsquery('arabic', $1)) AS rank
                FROM "ayahs" a
                JOIN "surahs" s ON a."surah_id" = s."surah_id"
                WHERE a."ayah_ar_tsv" @@ websearch_to_tsquery('arabic', $1)
            '''
        elif language == "english":
            sql = '''
                SELECT
                    s."surah_no",
                    s."surah_name_ar",
                    s."surah_name_en",
                    a."ayah_no_surah",
                    a."ayah_ar",
                    a."ayah_en",
                    a."juz_no",
                    1.0 AS rank
                FROM "ayahs" a
                JOIN "surahs" s ON a."surah_id" = s."surah_id"
                WHERE a."ayah_en" ILIKE $1
            '''
            query = f"%{query}%"
        else:  # both
            sql = '''
                SELECT
                    s."surah_no",
                    s."surah_name_ar",
                    s."surah_name_en",
                    a."ayah_no_surah",
                    a."ayah_ar",
                    a."ayah_en",
                    a."juz_no",
                    GREATEST(
                        ts_rank(a."ayah_ar_tsv", websearch_to_tsquery('arabic', $1)),
                        CASE WHEN a."ayah_en" ILIKE $2 THEN 0.5 ELSE 0 END
                    ) AS rank
                FROM "ayahs" a
                JOIN "surahs" s ON a."surah_id" = s."surah_id"
                WHERE a."ayah_ar_tsv" @@ websearch_to_tsquery('arabic', $1)
                   OR a."ayah_en" ILIKE $2
            '''

        # Add surah filter if specified
        params = [query]
        if language == "both":
            params.append(f"%{query}%")

        if surah_filter:
            sql += f' AND s."surah_no" = ${len(params) + 1}'
            params.append(surah_filter)

        # Add ordering and pagination
        sql += f' ORDER BY rank DESC, a."ayah_no_quran" ASC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}'
        params.extend([limit, offset])

        results = await execute_query(sql, *params)

        # Get total count for pagination
        count_sql = '''
            SELECT COUNT(*) as total
            FROM "ayahs" a
            JOIN "surahs" s ON a."surah_id" = s."surah_id"
            WHERE a."ayah_ar_tsv" @@ websearch_to_tsquery('arabic', $1)
               OR a."ayah_en" ILIKE $2
        '''
        count_params = [query if language != "english" else f"%{query}%", f"%{query}%"]
        if surah_filter:
            count_sql += f' AND s."surah_no" = ${len(count_params) + 1}'
            count_params.append(surah_filter)

        count_result = await execute_query_single(count_sql, *count_params)
        total = count_result.get('total', 0) if count_result else 0

        return {
            "results": results,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(results)) < total
        }

    @staticmethod
    async def get_surah_info(surah_number: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a surah

        Args:
            surah_number: Surah number (1-114)

        Returns:
            Surah metadata or None if not found
        """
        sql = '''
            SELECT "surah_id", "surah_no", "surah_name_ar", "surah_name_en",
                   "surah_name_roman", "place_of_revelation", "total_ayah_surah"
            FROM "surahs"
            WHERE "surah_no" = $1
        '''

        return await execute_query_single(sql, surah_number)

    @staticmethod
    async def get_verse_context(surah_number: int, verse_number: int, context_size: int = 2) -> Dict[str, Any]:
        """
        Get a verse with surrounding context verses

        Args:
            surah_number: Surah number
            verse_number: Verse number within surah
            context_size: Number of verses before/after to include

        Returns:
            Target verse with context
        """
        sql = '''
            SELECT
                s."surah_no",
                s."surah_name_ar",
                s."surah_name_en",
                a."ayah_no_surah",
                a."ayah_ar",
                a."ayah_en",
                a."juz_no",
                CASE
                    WHEN a."ayah_no_surah" = $2 THEN 'target'
                    ELSE 'context'
                END as verse_type
            FROM "surahs" s
            JOIN "ayahs" a ON a."surah_id" = s."surah_id"
            WHERE s."surah_no" = $1
              AND a."ayah_no_surah" BETWEEN $2 - $3 AND $2 + $3
            ORDER BY a."ayah_no_surah" ASC
        '''

        verses = await execute_query(sql, surah_number, verse_number, context_size)

        target_verse = next((v for v in verses if v['verse_type'] == 'target'), None)
        context_verses = [v for v in verses if v['verse_type'] == 'context']

        return {
            "target_verse": target_verse,
            "context_verses": context_verses,
            "context_size": context_size
        }

    @staticmethod
    async def get_juz_info(juz_number: int) -> Dict[str, Any]:
        """
        Get information about a specific Juz

        Args:
            juz_number: Juz number (1-30)

        Returns:
            Juz information with start/end verses
        """
        sql = '''
            SELECT
                MIN(a."ayah_no_quran") as start_ayah,
                MAX(a."ayah_no_quran") as end_ayah,
                COUNT(*) as total_ayahs,
                COUNT(DISTINCT a."surah_id") as surah_count
            FROM "ayahs" a
            WHERE a."juz_no" = $1
        '''

        juz_info = await execute_query_single(sql, juz_number)

        # Get surahs in this juz
        surahs_sql = '''
            SELECT DISTINCT s."surah_no", s."surah_name_ar", s."surah_name_en"
            FROM "ayahs" a
            JOIN "surahs" s ON a."surah_id" = s."surah_id"
            WHERE a."juz_no" = $1
            ORDER BY s."surah_no" ASC
        '''

        surahs = await execute_query(surahs_sql, juz_number)

        return {
            "juz_number": juz_number,
            "info": juz_info,
            "surahs": surahs
        }

    @staticmethod
    async def get_daily_verse() -> Optional[Dict[str, Any]]:
        """
        Get a verse for daily reflection (rotates based on day of year)

        Returns:
            Daily verse with context
        """
        from datetime import datetime

        day_of_year = datetime.now().timetuple().tm_yday

        # Use day of year to deterministically select a verse
        # Total ayahs = 6236, so we can cycle through them
        sql = '''
            SELECT
                s."surah_no",
                s."surah_name_ar",
                s."surah_name_en",
                a."ayah_no_surah",
                a."ayah_ar",
                a."ayah_en",
                a."juz_no"
            FROM "ayahs" a
            JOIN "surahs" s ON a."surah_id" = s."surah_id"
            WHERE a."ayah_no_quran" = (($1 - 1) % 6236) + 1
        '''

        return await execute_query_single(sql, day_of_year)

    @staticmethod
    async def get_sajdah_verses() -> List[Dict[str, Any]]:
        """
        Get all verses that require sajdah (prostration)

        Returns:
            List of sajdah verses
        """
        sql = '''
            SELECT
                s."surah_no",
                s."surah_name_ar",
                s."surah_name_en",
                a."ayah_no_surah",
                a."ayah_ar",
                a."ayah_en",
                a."sajdah_no"
            FROM "ayahs" a
            JOIN "surahs" s ON a."surah_id" = s."surah_id"
            WHERE a."sajdah_ayah" = TRUE
            ORDER BY a."sajdah_no" ASC
        '''

        return await execute_query(sql)

    @staticmethod
    async def get_surah_statistics() -> List[Dict[str, Any]]:
        """
        Get statistics for all surahs

        Returns:
            List of surahs with statistics
        """
        sql = '''
            SELECT
                s."surah_no",
                s."surah_name_ar",
                s."surah_name_en",
                s."place_of_revelation",
                s."total_ayah_surah",
                COUNT(DISTINCT a."juz_no") as juz_span,
                STRING_AGG(DISTINCT a."juz_no"::text, ', ' ORDER BY a."juz_no"::text) as juzs
            FROM "surahs" s
            LEFT JOIN "ayahs" a ON s."surah_id" = a."surah_id"
            GROUP BY s."surah_id", s."surah_no", s."surah_name_ar",
                     s."surah_name_en", s."place_of_revelation", s."total_ayah_surah"
            ORDER BY s."surah_no" ASC
        '''

        return await execute_query(sql)
