CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS Ayahs CASCADE;
DROP TABLE IF EXISTS Surahs CASCADE;
DROP TABLE IF EXISTS Words CASCADE;
DROP TABLE IF EXISTS Divisions CASCADE;
DROP TABLE IF EXISTS Mosques CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS Dhikr CASCADE;

CREATE TABLE  surahs (
    "surah_id" SERIAL PRIMARY KEY,
    "surah_no" INT NOT NULL UNIQUE,     
    "surah_name_en" VARCHAR(255) NOT NULL UNIQUE,
    "surah_name_ar" VARCHAR(255) NOT NULL UNIQUE,
    "surah_name_roman" VARCHAR(255) NOT NULL, 
    "total_ayah_surah" INT NOT NULL,          
    "place_of_revelation" VARCHAR(50) NOT NULL 
);

CREATE TABLE ayahs (
    "ayah_id" BIGSERIAL PRIMARY KEY,      
    "surah_id" INT NOT NULL,                 
    "ayah_no_surah" INT NOT NULL,              
    "ayah_no_quran" INT NOT NULL UNIQUE,       
    "ayah_ar" TEXT NOT NULL,                  
    "ayah_en" TEXT,                            
    "ruko_no" INT,                             
    "juz_no" INT,                             
    "manzil_no" INT,                           
    "hizb_quarter" INT,                        
    "sajdah_ayah" BOOLEAN DEFAULT FALSE,      
    "sajdah_no" INT,                           
    "total_ayah_quran" INT NOT NULL,           
    "no_of_word_ayah" INT NOT NULL,            
    "list_of_words" TEXT,                      
    "ayah_ar_tsv" TSVECTOR, 

    CONSTRAINT fk_surah
        FOREIGN KEY (surah_id)
        REFERENCES Surahs (surah_id)
        ON DELETE CASCADE,
    CONSTRAINT unique_ayah_in_surah UNIQUE (surah_id, ayah_no_surah)
);

CREATE TABLE words (
    "word_id" BIGSERIAL PRIMARY KEY,
    "ayah_id" BIGINT NOT NULL,               
    "word_order" INT NOT NULL,                 
    "word_ar" VARCHAR(255) NOT NULL,
    "word_en_translation" VARCHAR(255),
    "root_word_ar" VARCHAR(255),               
    "tag" VARCHAR(50),                        
    CONSTRAINT fk_ayah
        FOREIGN KEY (ayah_id)
        REFERENCES Ayahs (ayah_id)
        ON DELETE CASCADE,
    CONSTRAINT unique_word_in_ayah UNIQUE (ayah_id, word_order)
);

CREATE TABLE divisions (
    "division_id" SERIAL PRIMARY KEY,
    "division_type" VARCHAR(50) NOT NULL,     
    "division_number" INT NOT NULL,
    "ayah_no_quran_start" INT NOT NULL,
    "ayah_no_quran_end" INT NOT NULL,
    "description_ar" TEXT,
    "description_en" TEXT,
    CONSTRAINT unique_division_type_number UNIQUE (division_type, division_number)
);

CREATE TABLE mosques (
    "mosque_id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    location GEOGRAPHY(Point, 4326) NOT NULL
);

CREATE TABLE categories (    --دل ما نكرر اسم الفئة لكل ذكر في جدول Dhikr، نخزنها مرة واحدة فقط في جدول Categories ونربطها بالذكر عن طريق category_id.
    "category_id" SERIAL PRIMARY KEY,
    "name_ar" VARCHAR(255) NOT NULL UNIQUE,
    "name_en" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE dhikr (
    "dhikr_id" SERIAL PRIMARY KEY,
    "category_id" INT NOT NULL,
    "text_ar" TEXT NOT NULL,
    "text_en" TEXT,
    "benefits_ar" TEXT,
    "benefits_en" TEXT,
    "reference" VARCHAR(255), 
    CONSTRAINT fk_category
        FOREIGN KEY (category_id)
        REFERENCES Categories (category_id)
        ON DELETE CASCADE
);
