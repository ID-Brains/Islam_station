SELECT "surah_id", "surah_name_ar", "surah_name_en", "place_of_revelation", "total_ayah_surah"
FROM "surahs"
WHERE "surah_name_ar" ILIKE $1 OR "surah_name_en" ILIKE $2;

SELECT "ayah_id",  "ayah_ar", "ayah_en", "ayah_no_quran"
FROM "ayahs"
WHERE "surah_id" = $1 AND "ayah_no_surah" = $2;