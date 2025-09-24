SELECT
    s."surah_no",
    s."surah_name_ar",
    s."surah_name_en",
    s."place_of_revelation",
    s."total_ayah_surah",
    a."ayah_no_surah",
    a."ayah_ar",
    a."ayah_en",
    a."juz_no",
    a."ruko_no",
    a."manzil_no",
    a."hizb_quarter",
    a."sajdah_ayah",
    a."sajdah_no"
FROM "surahs" s
JOIN "ayahs" a ON a."surah_id" = s."surah_id"
WHERE s."surah_no" = $1 AND a."ayah_no_surah" = $2;
