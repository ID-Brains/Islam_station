SELECT
    s."surah_no",
    a."ayah_no_surah",
    a."ayah_ar",
    a."ayah_en",
    s."surah_name_ar",
    s."surah_name_en",
    ts_rank(a."ayah_ar_tsv", plainto_tsquery('arabic', $1)) + ts_rank(to_tsvector('english', a."ayah_en"), plainto_tsquery('english', $1)) AS rank
FROM "ayahs" a
JOIN "surahs" s ON a."surah_id" = s."surah_id"
WHERE a."ayah_ar_tsv" @@ plainto_tsquery('arabic', $1)
   OR to_tsvector('english', a."ayah_en") @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, a."ayah_no_quran"
LIMIT $2 OFFSET $3;
