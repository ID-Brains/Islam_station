CREATE OR REPLACE FUNCTION get_ayahs_by_surah(p_surah_id INT)
RETURNS TABLE (
    ayah_id BIGINT,
    ayah_no_surah INT,
    ayah_no_quran INT,
    ayah_ar TEXT,
    ayah_en TEXT,
    juz_no INT,
    ruko_no INT,
    manzil_no INT,
    hizb_quarter INT,
    sajdah_ayah BOOLEAN,
    sajdah_no INT,
    total_ayah_quran INT,
    no_of_word_ayah INT,
    list_of_words TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.ayah_id,
        a.ayah_no_surah,
        a.ayah_no_quran,
        a.ayah_ar,
        a.ayah_en,
        a.juz_no,
        a.ruko_no,
        a.manzil_no,
        a.hizb_quarter,
        a.sajdah_ayah,
        a.sajdah_no,
        a.total_ayah_quran,
        a.no_of_word_ayah,
        a.list_of_words
    FROM Ayahs AS a
    WHERE a.surah_id = p_surah_id
    ORDER BY a.ayah_no_surah;
END;
$$;


CREATE OR REPLACE FUNCTION search_quran_full_text(p_search_term TEXT)
RETURNS TABLE (
    ayah_id BIGINT,
    surah_id INT,
    ayah_no_surah INT,
    ayah_ar TEXT,
    rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.ayah_id,
        a.surah_id,
        a.ayah_no_surah,
        a.ayah_ar,
        ts_rank(a.ayah_ar_tsv, websearch_to_tsquery('arabic', p_search_term)) AS rank
    FROM Ayahs AS a
    WHERE a.ayah_ar_tsv @@ websearch_to_tsquery('arabic', p_search_term)
    ORDER BY rank DESC;
END;
$$;


CREATE OR REPLACE FUNCTION get_random_daily_dhikr(p_category_id INT, p_limit INT DEFAULT 5)
RETURNS SETOF Dhikr
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM Dhikr
    WHERE category_id = p_category_id
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION find_nearby_mosques(p_latitude DECIMAL, p_longitude DECIMAL, p_radius_km INT)
RETURNS TABLE (
    mosque_id INT,
    name VARCHAR(255),
    address TEXT,
    distance_km REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    center_point GEOGRAPHY;
BEGIN
    center_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;
    RETURN QUERY
    SELECT
        m.mosque_id,
        m.name,
        m.address,
        (ST_Distance(m.location, center_point) / 1000)::REAL AS distance_km
    FROM Mosques AS m
    WHERE ST_DWithin(m.location, center_point, p_radius_km * 1000)
    ORDER BY distance_km;
END;
$$;