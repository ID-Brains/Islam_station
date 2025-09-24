SELECT 
    s."surah_id",s."surah_name_ar",s."surah_name_en",
    a."ayah_id",a."ayah_no_surah",a."ayah_no_quran",a."ayah_ar",a."ayah_en",
    ts_rank(a."ayah_ar_tsv", to_tsquery('arabic', $1)) AS rank
FROM "ayahs" a
JOIN "surahs" s ON a."surah_id" = s."surah_id"
WHERE a."ayah_ar_tsv" @@ to_tsquery('arabic', $1)
ORDER BY rank DESC, a."ayah_no_quran";
