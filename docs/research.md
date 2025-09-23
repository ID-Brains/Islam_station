# Research on Data Sources for The Islamic Guidance Station

## Overview

This document outlines the research conducted on data sources for populating the database of The Islamic Guidance Station. The project requires data for Quran verses, prayer times, mosque information, and Islamic spiritual content (Dhikr and Dua). All sources are from reputable, authentic Islamic platforms to ensure accuracy and reliability.

## 1. Quran Text Data

### candidate Sources

- **Tanzil.net**: A comprehensive Quran text project providing multiple script formats.
  - **Uthmani Script**: Classical Arabic text with proper diacritics (https://tanzil.net/pub/download/quran-uthmani.xml)
  - **Indopak Script**: South Asian variant (https://tanzil.net/pub/download/quran-indopak.xml)
  - **Simple Script**: Simplified Arabic (https://tanzil.net/pub/download/quran-simple.xml)
  - **Formats**: XML, JSON, plain text available
  - **Coverage**: Complete Quran with verse-by-verse structure

- **Quran Dataset**
- downloaded from Kaggle
- **Quran.com API v4**: Modern API with comprehensive data.
  - **Endpoint**: https://api.quran.com/api/v4/
  - **Data Available**:
    - Chapters (Surahs) with metadata
    - Verses with multiple translations
    - Transliteration (English phonetic)
    - Audio recitations (multiple reciters)
    - Word-by-word analysis
  - **Translations**: Saheeh International, Muhsin Khan, Pickthall, etc.
  - **Audio**: Multiple reciters including Minshawi Rashid Alafasy, Abdul Rahman Al-Sudais

### Data Structure

- **Surahs**: 114 chapters with Arabic/English names, revelation info
- **Verses**: ~6,236 verses with multiple text variants
- **Full-Text Search**: Enable on English translation and transliteration fields

### Implementation Notes

- Use Quran.com API for initial population due to structured JSON responses
- Store multiple text formats for flexibility in rendering
- Implement FTS using PostgreSQL's tsvector for efficient searching

## 2. Prayer Times Data

### Primary Sources

- **Al Adhan API**: Comprehensive Islamic prayer times service.
  - **Base URL**: https://api.aladhan.com/v1/
  - **Key Endpoints**:
    - `/timingsByCity?city={city}&country={country}&method={method}`
    - `/calendarByCity?city={city}&country={country}&method={month}&year={year}`
  - **Methods**: Multiple calculation methods (Islamic Society of North America, Egyptian General Authority, etc.)
  - **Data**: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Imsak times

- **IslamicFinder API**: Alternative source with mosque-specific data.
  - **Features**: Prayer times + nearby mosques
  - **API**: Requires registration for commercial use

### Implementation Notes

- Cache prayer times in database to avoid API rate limits
- Background task to update daily/weekly
- Support multiple cities, starting with Kafr El-Sheikh, Egypt
- Store as HH:MM format strings

## 3. Mosque Information

### Primary Sources

- **OpenStreetMap (OSM) via Nominatim**: Free geographic database.
  - **API**: https://nominatim.openstreetmap.org/search
  - **Query Example**: `q=mosque+in+Kafr+El-Sheikh&format=json&limit=50`
  - **Data Available**: Name, address, coordinates, tags
  - **Coverage**: Global, user-contributed data

- **IslamicFinder**: Mosque directory with prayer times.
  - **Features**: Mosque listings with contact info
  - **Geographic Focus**: Strong in Muslim-majority countries

- **Local Data Collection**: For Kafr El-Sheikh specifically.
  - Manual research of local mosques
  - Contact information, facilities, prayer times

### Data Structure

- **Fields**: Name, address, coordinates, phone, website
- **PostGIS Integration**: Store as POINT geometry for spatial queries
- **Events**: Link to mosque events (prayers, lectures, etc.)

### Implementation Notes

- Start with OSM data for initial population
- Allow manual additions/updates for accuracy
- Use PostGIS for location-based searches

## 4. Dhikr and Dua Content

### Primary Sources

- **Quran.com**: Authentic Islamic content.
  - **Dhikr Collections**: Common morning/evening dhikr
  - **Dua Categories**: After prayer, travel, forgiveness, etc.

- **Hisn al-Muslim**: Fortification of the Muslim (authentic collection).
  - **Source**: Book by Sa'id Ibn Ali Ibn Wahf Al-Qahtani
  - **Content**: 267 prayers and supplications with references
  - **Categories**: Morning, evening, sleep, travel, etc.

- **Islamic Websites**:
  - Muslim.org: Collection of authentic duas
  - IslamicFinder: Daily dhikr and dua
  - Sunnah.com: Hadith-based supplications

### Data Structure

- **Dhikr**: Arabic text, English translation, category, repetition count
- **Dua**: Arabic text, English translation, category, occasion
- **Categories**: Morning, Evening, After Prayer, Forgiveness, Protection, etc.

### Implementation Notes

- Source from authentic Islamic texts
- Include attribution to scholars/sources
- Random selection for "Dhikr/Dua of the Day"

## 5. Additional Considerations

### Data Quality & Authenticity

- All sources verified for Islamic authenticity
- Prefer sources with scholarly backing (e.g., Quran.com, Tanzil.net)
- Include source attribution in database

### API Rate Limits & Caching

- Quran.com API: Generous limits for non-commercial use
- Al Adhan API: Free tier with reasonable limits
- Implement Redis caching for frequently accessed data

### Data Population Scripts

- Python scripts using httpx/aiohttp for API calls
- Alembic migrations for database setup
- Error handling for API failures

### Future Enhancements

- User-submitted content moderation
- Multiple language support (beyond English/Arabic)
- Integration with Islamic calendars (Hijri dates)

## References

1. Tanzil.net - Quran Text Project
2. Quran.com API Documentation
3. Al Adhan API Documentation
4. OpenStreetMap Nominatim API
5. Hisn al-Muslim by Sa'id Ibn Ali Ibn Wahf Al-Qahtani
6. IslamicFinder API

This research ensures the application is built on reliable, authentic Islamic data sources while maintaining technical feasibility with the chosen stack (FastAPI, PostgreSQL, PostGIS).
