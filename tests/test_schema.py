import pytest
from sqlalchemy import create_engine, text
import os

# Test database connection string
TEST_DB_URL = "postgresql://islam:password@localhost:5432/quran_test_db"

def read_sql_file(filename):
    """Read SQL file content"""
    schema_dir = "../database/schema"
    with open(os.path.join(schema_dir, filename), 'r', encoding='utf-8') as f:
        return f.read()

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine"""
    engine = create_engine(TEST_DB_URL)
    yield engine
    engine.dispose()

def test_create_tables(db_engine):
    """Test if all tables can be created successfully"""
    try:
        # Read SQL files in correct order
        init_extensions_sql = "CREATE EXTENSION IF NOT EXISTS postgis;"
        tables_sql = read_sql_file("tables.sql")
        init_sql = read_sql_file("init.sql")
        indexes_sql = read_sql_file("indexes.sql")
        functions_sql = read_sql_file("functions.sql")

        with db_engine.connect() as conn:
            # Clean schema
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()

            # Execute schema creation
            conn.execute(text(init_extensions_sql))  # Enable PostGIS first
            conn.execute(text(tables_sql))
            conn.execute(text(init_sql))
            conn.execute(text(indexes_sql))
            conn.execute(text(functions_sql))
            conn.commit()

        # Verify tables exist
        with db_engine.connect() as conn:
            for table in ["surahs", "ayahs", "words", "divisions", "mosques", "categories", "dhikr"]:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    )
                """))
                assert result.scalar(), f"{table} table was not created"

    except Exception as e:
        pytest.fail(f"Failed to create schema: {str(e)}")

def test_insert_sample_data(db_engine):
    """Test inserting sample data"""
    try:
        with db_engine.connect() as conn:
            # Insert sample Surah
            conn.execute(text("""
                INSERT INTO surahs (surah_id, surah_no, surah_name_ar, surah_name_en, surah_name_roman, place_of_revelation, total_ayah_surah)
                VALUES (1, 1, 'الفاتحة', 'Al-Fatiha', 'Al-Fatiha', 'Meccan', 7)
            """))

            # Insert sample Ayah
            conn.execute(text("""
                INSERT INTO ayahs (ayah_id,surah_id,ayah_no_surah,ayah_no_quran,ayah_ar,ayah_en,juz_no,ruko_no,manzil_no,total_ayah_quran,no_of_word_ayah,list_of_words)
                VALUES (1,1,1,1,'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ','In the name of Allah, the Entirely Merciful, the Especially Merciful',1,1,1,6236,4,'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')  
            """))
            conn.commit()

            # Verify data
            result = conn.execute(text("SELECT COUNT(*) FROM surahs"))
            assert result.scalar() == 1, "Failed to insert Surah"

            result = conn.execute(text("SELECT COUNT(*) FROM ayahs"))
            assert result.scalar() == 1, "Failed to insert Ayah"

    except Exception as e:
        pytest.fail(f"Failed to insert sample data: {str(e)}")

def test_spatial_functions(db_engine):
    """Test PostGIS spatial functions"""
    try:
        with db_engine.connect() as conn:
            # Insert sample mosque with location
            conn.execute(text("""
                INSERT INTO mosques (
                    mosque_id, name, location, address
                )
                VALUES (
                    1,
                    'Masjid Al-Haram',
                    ST_SetSRID(ST_MakePoint(39.826206, 21.422487), 4326),
                    'Mecca, Saudi Arabia'
                )
            """))
            conn.commit()

            # Test spatial query
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM mosques 
                WHERE ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(39.826206, 21.422487), 4326)::geography,
                    5000  -- 5km radius
                )
            """))
            assert result.scalar() == 1, "Spatial query failed"

    except Exception as e:
        pytest.fail(f"Failed to test spatial functions: {str(e)}")

def test_indexes(db_engine):
    """Test if indexes are created properly"""
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM pg_indexes 
                WHERE tablename IN ('surahs', 'ayahs', 'mosques')
            """))
            assert result.scalar() > 0, "No indexes found"

    except Exception as e:
        pytest.fail(f"Failed to verify indexes: {str(e)}")

def test_functions(db_engine):
    """Test custom functions"""
    try:
        with db_engine.connect() as conn:
            # Test get_ayahs_by_surah function
            result = conn.execute(text("SELECT * FROM get_ayahs_by_surah(1)"))
            assert result.rowcount >= 0, "get_ayahs_by_surah function failed"

            # Test find_nearby_mosques function
            result = conn.execute(text("""
                SELECT * FROM find_nearby_mosques(21.422487, 39.826206, 5)
            """))
            assert result.rowcount >= 0, "find_nearby_mosques function failed"

    except Exception as e:
        pytest.fail(f"Failed to test custom functions: {str(e)}")
