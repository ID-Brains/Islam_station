-- Migration: Add performance indexes for high-frequency queries
-- Date: 2025-10-15
-- Issue: #14 - Missing database indexes causing slow queries

-- Index on dhikr.category_id for category filtering queries
-- This speeds up: get_dhikr_by_category, get_random_dhikr(with category)
CREATE INDEX IF NOT EXISTS idx_dhikr_category_id 
ON "dhikr" ("category_id");

-- Index on prayer times queries (if prayer table has date column)
-- This would speed up date-based queries and filtering
CREATE INDEX IF NOT EXISTS idx_prayer_date 
ON "prayer" ("date") 
WHERE "date" IS NOT NULL;

-- Indexes on full-text search columns for faster Quran searches
-- These speed up: advanced_search.sql, full-text search operations
CREATE INDEX IF NOT EXISTS idx_ayah_ar_tsv 
ON "ayahs" USING GIN ("ayah_ar_tsv");

CREATE INDEX IF NOT EXISTS idx_ayah_en_text 
ON "ayahs" USING GIN (to_tsvector('english', "ayah_en"));

-- Compound index for common filter combinations in mosque queries
-- Speeds up: find_nearby_mosques filtering, mosque location queries
CREATE INDEX IF NOT EXISTS idx_dhikr_category_id_status 
ON "dhikr" ("category_id", "status")
WHERE "status" = 'active';

-- Index on surah_id for faster joins and lookups
CREATE INDEX IF NOT EXISTS idx_ayah_surah_id 
ON "ayahs" ("surah_id");

-- Analyze tables after index creation for query planner
ANALYZE "dhikr";
ANALYZE "prayer";
ANALYZE "ayahs";
ANALYZE "surahs";
