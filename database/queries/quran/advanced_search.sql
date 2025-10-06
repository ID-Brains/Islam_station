-- Advanced Quran search with filtering capabilities
-- Parameters: $1 = search query, $2 = limit, $3 = offset, $4 = search type, $5 = language filter, $6 = surah filter

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
WHERE 
    -- Base search condition
    (
        ($5 = 'arabic' OR $5 = 'both') AND a."ayah_ar_tsv" @@ plainto_tsquery('arabic', $1)
    ) OR (
        ($5 = 'english' OR $5 = 'both') AND to_tsvector('english', a."ayah_en") @@ plainto_tsquery('english', $1)
    )
    -- Surah filter
    AND ($6 = 'all' OR s."surah_no"::text = $6)
    -- Search type filtering
    AND (
        $4 = 'fulltext' OR
        ($4 = 'exact' AND (a."ayah_ar" LIKE '%' || $1 || '%' OR a."ayah_en" ILIKE '%' || $1 || '%')) OR
        ($4 = 'arabic' AND a."ayah_ar" LIKE '%' || $1 || '%') OR
        ($4 = 'translation' AND a."ayah_en" ILIKE '%' || $1 || '%')
    )
ORDER BY rank DESC, a."ayah_no_quran"
LIMIT $2 OFFSET $3;