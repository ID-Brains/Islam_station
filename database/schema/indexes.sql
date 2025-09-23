CREATE INDEX idx_surahs_surah_no ON Surahs (surah_no);
CREATE INDEX idx_surahs_name_en ON Surahs (surah_name_en);
CREATE INDEX idx_surahs_name_ar ON Surahs (surah_name_ar);
CREATE INDEX idx_surahs_place_of_revelation ON Surahs (place_of_revelation);

CREATE INDEX idx_ayahs_surah_id_ayah_no_surah ON Ayahs (surah_id, ayah_no_surah);
CREATE INDEX idx_ayahs_ayah_no_quran ON Ayahs (ayah_no_quran);
CREATE INDEX idx_ayahs_juz_no ON Ayahs (juz_no);
CREATE INDEX idx_ayahs_ruko_no ON Ayahs (ruko_no);
CREATE INDEX idx_ayahs_manzil_no ON Ayahs (manzil_no);
CREATE INDEX idx_ayahs_hizb_quarter ON Ayahs (hizb_quarter);
CREATE INDEX idx_ayahs_sajdah_ayah ON Ayahs (sajdah_ayah);
CREATE INDEX idx_ayahs_ayah_ar_gin ON Ayahs USING GIN (to_tsvector('arabic', ayah_ar));

CREATE INDEX idx_words_ayah_id ON Words (ayah_id);
CREATE INDEX idx_words_word_ar ON Words (word_ar);

CREATE INDEX idx_mosques_name ON Mosques (name);
CREATE INDEX gist_idx_mosques_location ON Mosques USING GIST (location); 

CREATE INDEX idx_dhikr_category_id ON Dhikr (category_id);