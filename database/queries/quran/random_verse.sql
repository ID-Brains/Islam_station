SELECT
    s."surah_no",
    s."surah_name_ar",
    s."surah_name_en",
    a."ayah_no_surah",
    a."ayah_ar",
    a."ayah_en"
FROM "ayahs" a
JOIN "surahs" s ON a."surah_id" = s."surah_id"
ORDER BY RANDOM()
LIMIT 1;
