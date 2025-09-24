DROP TEXT SEARCH CONFIGURATION IF EXISTS arabic_ts_config CASCADE;

CREATE TEXT SEARCH CONFIGURATION arabic_ts_config (PARSER = default);
ALTER TEXT SEARCH CONFIGURATION arabic_ts_config
    ADD MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
    WITH simple;

-- Trigger function
CREATE OR REPLACE FUNCTION update_ayahs_ayah_ar_tsv() RETURNS TRIGGER AS $$
BEGIN
    NEW.ayah_ar_tsv := to_tsvector('arabic', NEW.ayah_ar);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS tsvector_ayahs_ayah_ar_update ON Ayahs;
CREATE TRIGGER tsvector_ayahs_ayah_ar_update
BEFORE INSERT OR UPDATE ON Ayahs
FOR EACH ROW EXECUTE FUNCTION update_ayahs_ayah_ar_tsv();

-- Fill existing rows
UPDATE Ayahs SET ayah_ar_tsv = to_tsvector('arabic', ayah_ar);
