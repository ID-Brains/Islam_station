import pytest
from sqlalchemy import create_engine, text

# Test database connection string
TEST_DB_URL = "postgresql://islam:password@localhost:5432/quran_test_db"

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DB_URL)
    yield engine
    engine.dispose()

def test_category_filter(db_engine):
    """Test category_filter.sql"""
    with db_engine.connect() as conn:
        category_id = 1
        result = conn.execute(
            text("""
            SELECT "dhikr_id","category_id","text_ar","text_en","benefits_ar","benefits_en","reference"
            FROM dhikr
            WHERE "category_id" = :category_id
            ORDER BY "dhikr_id" ASC
            """),
            {"category_id": category_id}
        ).fetchall()
        assert result is not None

def test_nearby_search(db_engine):
    """Test nearby_search.sql"""
    with db_engine.connect() as conn:
        lat, lng, radius = 21.422487, 39.826206, 5000  # Mecca, 5 km
        result = conn.execute(
            text("""
            SELECT "mosque_id","name","address","city","country",
                   ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
            FROM mosques
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            ORDER BY distance_meters ASC
            """),
            {"lat": lat, "lng": lng, "radius": radius}
        ).fetchall()
        assert result is not None

def test_spatial_queries(db_engine):
    """Test spatial_queries.sql - name search and bounding box"""
    with db_engine.connect() as conn:
        search_name = "Masjid"
        bbox = {"lat1": 21.4, "lng1": 39.8, "lat2": 21.5, "lng2": 39.9}

        # Name search
        result_name = conn.execute(
            text("""
            SELECT "mosque_id","name","address","city","country"
            FROM mosques
            WHERE "name" ILIKE '%' || :search || '%'
            ORDER BY "name" ASC
            """),
            {"search": search_name}
        ).fetchall()
        assert result_name is not None

        # Bounding box search
        result_bbox = conn.execute(
            text("""
            SELECT "mosque_id","name","address","city","country"
            FROM mosques
            WHERE location && ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326)
            ORDER BY "name" ASC
            """),
            bbox
        ).fetchall()
        assert result_bbox is not None

def test_full_text_search(db_engine):
    """Test full_text_search.sql"""
    with db_engine.connect() as conn:
        keyword = "الله"
        result = conn.execute(
            text("""
            SELECT 
                s."surah_id",s."surah_name_ar",s."surah_name_en",
                a."ayah_id",a."ayah_no_surah",a."ayah_no_quran",a."ayah_ar",a."ayah_en",
                ts_rank(a."ayah_ar_tsv", to_tsquery('arabic', :keyword)) AS rank
            FROM ayahs a
            JOIN surahs s ON a."surah_id" = s."surah_id"
            WHERE a."ayah_ar_tsv" @@ to_tsquery('arabic', :keyword)
            ORDER BY rank DESC, a."ayah_no_quran"
            """),
            {"keyword": keyword}
        ).fetchall()
        assert result is not None

def test_get_surah(db_engine):
    """Test get_surah.sql"""
    with db_engine.connect() as conn:
        surah_search = "الفاتحة"
        ayah_no_surah = 1

        # Get Surah info
        surah = conn.execute(
            text("""
            SELECT "surah_id", "surah_name_ar", "surah_name_en", "place_of_revelation", "total_ayah_surah"
            FROM surahs
            WHERE "surah_name_ar" ILIKE :surah OR "surah_name_en" ILIKE :surah
            """),
            {"surah": surah_search}
        ).fetchone()
        assert surah is not None

        # Get Ayah
        ayah = conn.execute(
            text("""
            SELECT "ayah_id", "ayah_ar", "ayah_en", "ayah_no_quran"
            FROM ayahs
            WHERE "surah_id" = :surah_id AND "ayah_no_surah" = :ayah_no
            """),
            {"surah_id": surah.surah_id, "ayah_no": ayah_no_surah}
        ).fetchone()
        assert ayah is not None
