# API Services Documentation

This directory contains service modules that handle all API communication with the backend. Each service provides a clean, type-safe interface for interacting with specific API endpoints.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Services](#services)
  - [Quran Service](#quran-service)
  - [Prayer Service](#prayer-service)
  - [Mosque Service](#mosque-service)
  - [Dhikr Service](#dhikr-service)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

All services are built on top of the `apiClient` utility which provides:
- Automatic retry with exponential backoff
- Request/response interceptors
- Timeout handling
- Error standardization
- Environment-based configuration

## Installation

Import services in your components:

```javascript
// Import specific service
import { quranService } from '../services';

// Or import specific functions
import { getSurah, searchQuran } from '../services/quranService';

// Or import all services
import api from '../services';
```

## Usage

### Basic Usage

```javascript
import { getSurah } from '../services/quranService';

async function loadSurah() {
  try {
    const data = await getSurah(1); // Get Al-Fatihah
    console.log(data);
  } catch (error) {
    console.error(error.message);
  }
}
```

### With React Components

```javascript
import React, { useState, useEffect } from 'react';
import { getPrayerTimes } from '../services/prayerService';

function PrayerTimesComponent() {
  const [times, setTimes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTimes() {
      try {
        const data = await getPrayerTimes({
          latitude: 40.7128,
          longitude: -74.0060,
          date: '2024-01-01'
        });
        setTimes(data);
      } catch (err) {
        setError(err.userMessage || err.message);
      }
    }
    fetchTimes();
  }, []);

  return (
    <div>
      {error && <p>Error: {error}</p>}
      {times && <pre>{JSON.stringify(times, null, 2)}</pre>}
    </div>
  );
}
```

## Services

### Quran Service

Handles all Quran-related API operations.

#### Functions

##### `searchQuran(params)`
Search Quran verses with advanced filtering.

**Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): Search type - 'fulltext', 'exact', 'translation', 'arabic'. Default: 'fulltext'
- `language` (string, optional): Language filter - 'both', 'arabic', 'english'. Default: 'both'
- `page` (number, optional): Page number. Default: 1
- `limit` (number, optional): Results per page. Default: 10
- `surah` (string, optional): Surah filter - 'all' or surah number. Default: 'all'

**Returns:** `Promise<Object>` - Search results with pagination

**Example:**
```javascript
const results = await searchQuran({
  q: 'mercy',
  type: 'translation',
  language: 'english',
  page: 1,
  limit: 20
});
```

##### `getSurah(surahNumber)`
Get complete Surah by number.

**Parameters:**
- `surahNumber` (number, required): Surah number (1-114)

**Returns:** `Promise<Object>` - Complete surah with all verses

**Example:**
```javascript
const surah = await getSurah(2); // Get Al-Baqarah
console.log(surah.verses.length); // 286 verses
```

##### `getVerse(surahNumber, verseNumber)`
Get specific verse by surah and verse number.

**Parameters:**
- `surahNumber` (number, required): Surah number (1-114)
- `verseNumber` (number, required): Verse number within the surah

**Returns:** `Promise<Object>` - Specific verse with context

**Example:**
```javascript
const verse = await getVerse(2, 255); // Ayat al-Kursi
```

##### `getRandomVerse()`
Get a random Quran verse.

**Returns:** `Promise<Object>` - Random verse

**Example:**
```javascript
const randomVerse = await getRandomVerse();
```

##### `getVerseRange(surahNumber, startVerse, endVerse)`
Get verses in a range for a surah.

**Parameters:**
- `surahNumber` (number): Surah number
- `startVerse` (number): Starting verse number
- `endVerse` (number): Ending verse number

**Returns:** `Promise<Object>` - Verses in the specified range

**Example:**
```javascript
const verses = await getVerseRange(18, 1, 10); // First 10 verses of Al-Kahf
```

##### `searchArabic(searchText, page, limit)`
Search verses by Arabic text.

##### `searchTranslation(searchText, page, limit)`
Search verses by translation.

##### `searchInSurah(searchText, surahNumber, page, limit)`
Search verses in a specific surah.

##### `transformVerse(verse)`
Transform backend verse data to frontend format.

##### `transformSurah(surah)`
Transform backend surah data to frontend format.

---

### Prayer Service

Handles all prayer times and Qibla-related operations.

#### Functions

##### `getPrayerTimes(params)`
Get prayer times for a specific location and date.

**Parameters:**
- `latitude` (number, required): Location latitude (-90 to 90)
- `longitude` (number, required): Location longitude (-180 to 180)
- `date` (string, optional): Date in YYYY-MM-DD format (defaults to today)
- `method` (string, optional): Calculation method. Default: 'MuslimWorldLeague'

**Returns:** `Promise<Object>` - Prayer times for the location and date

**Example:**
```javascript
const times = await getPrayerTimes({
  latitude: 21.4225,
  longitude: 39.8262,
  date: '2024-01-15',
  method: 'UmmAlQura'
});
```

##### `getNextPrayer(params)`
Get the next prayer time and countdown.

**Parameters:**
- `latitude` (number, required): Location latitude
- `longitude` (number, required): Location longitude
- `method` (string, optional): Calculation method

**Returns:** `Promise<Object>` - Next prayer information with countdown

**Example:**
```javascript
const nextPrayer = await getNextPrayer({
  latitude: 40.7128,
  longitude: -74.0060
});
console.log(nextPrayer.name); // e.g., "Maghrib"
console.log(nextPrayer.timeRemaining); // e.g., "2h 30m"
```

##### `getMonthlyPrayerTimes(params)`
Get prayer times for an entire month.

**Parameters:**
- `latitude` (number, required): Location latitude
- `longitude` (number, required): Location longitude
- `year` (number, required): Year for calculation (2000-2100)
- `month` (number, required): Month for calculation (1-12)
- `method` (string, optional): Calculation method

**Returns:** `Promise<Object>` - Prayer times for each day of the month

**Example:**
```javascript
const monthlyTimes = await getMonthlyPrayerTimes({
  latitude: 51.5074,
  longitude: -0.1278,
  year: 2024,
  month: 3
});
```

##### `getQiblaDirection(params)`
Get Qibla direction (towards Kaaba in Makkah).

**Parameters:**
- `latitude` (number, required): Current location latitude
- `longitude` (number, required): Current location longitude

**Returns:** `Promise<Object>` - Qibla direction in degrees from North and distance to Kaaba

**Example:**
```javascript
const qibla = await getQiblaDirection({
  latitude: 40.7128,
  longitude: -74.0060
});
console.log(qibla.direction); // e.g., 58.5 degrees
console.log(qibla.distance); // Distance to Makkah in km
```

##### `getCalculationMethods()`
Get list of available prayer time calculation methods.

**Returns:** `Promise<Object>` - List of calculation methods with descriptions

##### `getPrayerTimesForCurrentLocation(method)`
Get prayer times for current location (uses browser geolocation).

**Example:**
```javascript
const times = await getPrayerTimesForCurrentLocation('ISNA');
```

##### `getNextPrayerForCurrentLocation(method)`
Get next prayer for current location.

##### `getQiblaForCurrentLocation()`
Get Qibla direction for current location.

##### `calculateTimeRemaining(nextPrayerTime)`
Calculate time remaining until next prayer.

##### `formatTimeRemaining(timeRemaining)`
Format time remaining as string.

##### `formatPrayerName(prayerName)`
Get prayer name in readable format.

---

### Mosque Service

Handles all mosque finder operations.

#### Functions

##### `getNearbyMosques(params)`
Find mosques near a specific location.

**Parameters:**
- `latitude` (number, required): Your current latitude (-90 to 90)
- `longitude` (number, required): Your current longitude (-180 to 180)
- `radius` (number, optional): Search radius in meters (100-50000). Default: 5000

**Returns:** `Promise<Object>` - List of nearby mosques with distance information

**Example:**
```javascript
const mosques = await getNearbyMosques({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 10000 // 10km radius
});
```

##### `searchMosques(params)`
Search mosques by name with optional filters.

**Parameters:**
- `q` (string, required): Search term for mosque name (min 2 characters)
- `city` (string, optional): City filter
- `country` (string, optional): Country filter
- `limit` (number, optional): Maximum results (max 100). Default: 20
- `offset` (number, optional): Pagination offset. Default: 0

**Returns:** `Promise<Object>` - List of matching mosques

**Example:**
```javascript
const results = await searchMosques({
  q: 'Islamic Center',
  city: 'New York',
  limit: 50
});
```

##### `getMosqueById(mosqueId)`
Get detailed information about a specific mosque.

**Parameters:**
- `mosqueId` (number, required): Unique identifier of the mosque

**Returns:** `Promise<Object>` - Mosque details

**Example:**
```javascript
const mosque = await getMosqueById(123);
```

##### `getMosquesInArea(params)`
Get all mosques within a bounding box.

**Parameters:**
- `min_lat` (number, required): Southwest corner latitude
- `min_lng` (number, required): Southwest corner longitude
- `max_lat` (number, required): Northeast corner latitude
- `max_lng` (number, required): Northeast corner longitude

**Returns:** `Promise<Object>` - List of mosques in the specified area

**Example:**
```javascript
const mosques = await getMosquesInArea({
  min_lat: 40.7,
  min_lng: -74.1,
  max_lat: 40.8,
  max_lng: -74.0
});
```

##### `getMosqueCities()`
Get list of cities with mosques for filtering.

##### `getMosqueCountries()`
Get list of countries with mosques for filtering.

##### `getNearbyMosquesFromCurrentLocation(radius)`
Get nearby mosques using browser's geolocation.

**Example:**
```javascript
const nearbyMosques = await getNearbyMosquesFromCurrentLocation(5000);
```

##### `calculateDistance(lat1, lon1, lat2, lon2)`
Calculate distance between two coordinates (Haversine formula).

##### `formatDistance(distanceInMeters)`
Format distance for display.

##### `sortMosquesByDistance(mosques, latitude, longitude)`
Sort mosques by distance from a point.

##### `getMosquesInViewport(bounds)`
Get mosques in viewport bounds (for map display).

##### `searchMosquesByCity(cityName, limit)`
Search mosques by city.

##### `searchMosquesByCountry(countryName, limit)`
Search mosques by country.

##### `getMosqueWithPrayerTimes(mosqueId, date)`
Get mosque details with prayer times.

---

### Dhikr Service

Handles all dhikr and dua operations.

#### Functions

##### `getDailyDhikr(categoryId)`
Get a random dhikr/dua for daily spiritual practice.

**Parameters:**
- `categoryId` (number, optional): Category of dhikr. Default: 1

**Returns:** `Promise<Object>` - Random dhikr from the specified category

**Example:**
```javascript
const dhikr = await getDailyDhikr(1);
```

##### `getDhikrByCategory(categoryId, limit, offset)`
Get all dhikr/dua from a specific category.

**Parameters:**
- `categoryId` (number, required): Category ID to filter by
- `limit` (number, optional): Maximum results (max 100). Default: 20
- `offset` (number, optional): Pagination offset. Default: 0

**Returns:** `Promise<Object>` - List of dhikr from the category

**Example:**
```javascript
const morningDhikr = await getDhikrByCategory(1, 10);
```

##### `getRandomDhikr(categoryId)`
Get a random dhikr/dua, optionally filtered by category.

**Parameters:**
- `categoryId` (number, optional): Optional category to filter random selection

**Returns:** `Promise<Object>` - Random dhikr

##### `getDhikrById(dhikrId)`
Get specific dhikr/dua by ID.

**Parameters:**
- `dhikrId` (number, required): Unique identifier of the dhikr

**Returns:** `Promise<Object>` - Dhikr details

##### `getDhikrCategories()`
Get all available dhikr/dua categories.

**Returns:** `Promise<Object>` - List of categories with counts

**Example:**
```javascript
const categories = await getDhikrCategories();
```

##### `searchDhikr(params)`
Search dhikr/dua by text content.

**Parameters:**
- `q` (string, required): Search term (min 2 characters)
- `language` (string, optional): Search language - 'arabic', 'english', or 'both'. Default: 'both'
- `limit` (number, optional): Maximum results (max 100). Default: 20
- `offset` (number, optional): Pagination offset. Default: 0

**Returns:** `Promise<Object>` - List of matching dhikr

**Example:**
```javascript
const results = await searchDhikr({
  q: 'forgiveness',
  language: 'english',
  limit: 10
});
```

##### `getMorningDhikr(limit)`
Get morning adhkar (azkar al-sabah).

**Parameters:**
- `limit` (number, optional): Number of adhkar to return. Default: 10

**Returns:** `Promise<Object>` - List of morning dhikr

**Example:**
```javascript
const morning = await getMorningDhikr(15);
```

##### `getEveningDhikr(limit)`
Get evening adhkar (azkar al-masa).

**Parameters:**
- `limit` (number, optional): Number of adhkar to return. Default: 10

**Returns:** `Promise<Object>` - List of evening dhikr

##### `searchArabicDhikr(searchText, limit)`
Search dhikr in Arabic only.

##### `searchEnglishDhikr(searchText, limit)`
Search dhikr in English only.

##### `getDhikrByTimeOfDay(timeOfDay, limit)`
Get dhikr for specific time of day.

**Parameters:**
- `timeOfDay` (string): 'morning', 'evening', or 'general'
- `limit` (number, optional): Number of dhikr to return. Default: 10

##### `getDhikrForCurrentTime(limit)`
Get dhikr appropriate for current time.

**Example:**
```javascript
const currentDhikr = await getDhikrForCurrentTime(10);
```

##### `getDhikrFromMultipleCategories(categoryIds, limit)`
Get all dhikr from multiple categories.

##### `transformDhikr(dhikr)`
Transform dhikr data for frontend display.

##### `getCategoryStatistics(categoryId)`
Get dhikr statistics for a category.

##### `createDhikrRoutine(period)`
Create a dhikr routine for a specific time period.

**Parameters:**
- `period` (string): 'daily', 'morning', 'evening', 'weekly'

**Example:**
```javascript
const routine = await createDhikrRoutine('daily');
console.log(routine.morning); // Morning adhkar
console.log(routine.evening); // Evening adhkar
```

---

## Error Handling

All service functions throw errors that should be caught:

```javascript
try {
  const data = await getSurah(1);
} catch (error) {
  // error.message - Technical error message
  // error.userMessage - User-friendly error message
  // error.status - HTTP status code
  // error.data - Additional error data from API
  console.error(error.userMessage || error.message);
}
```

### Common Error Types

- **Network Errors**: No internet connection or API unreachable
- **Validation Errors**: Invalid parameters (400)
- **Not Found Errors**: Resource doesn't exist (404)
- **Server Errors**: Backend issues (500+)

## Examples

### Example 1: Quran Reader Component

```javascript
import React, { useState, useEffect } from 'react';
import { getSurah } from '../services/quranService';

function QuranReader({ surahNumber }) {
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSurah() {
      try {
        setLoading(true);
        const data = await getSurah(surahNumber);
        setSurah(data);
      } catch (err) {
        setError(err.userMessage || err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSurah();
  }, [surahNumber]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{surah.surah.name_english}</h1>
      {surah.verses.map(verse => (
        <div key={verse.ayah_no_surah}>
          <p className="arabic">{verse.ayah_ar}</p>
          <p className="translation">{verse.ayah_en}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Prayer Times Dashboard

```javascript
import React, { useState, useEffect } from 'react';
import { getPrayerTimesForCurrentLocation, getNextPrayer } from '../services/prayerService';

function PrayerTimesDashboard() {
  const [times, setTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [timesData, nextData] = await Promise.all([
          getPrayerTimesForCurrentLocation(),
          getNextPrayer()
        ]);
        setTimes(timesData);
        setNextPrayer(nextData);
      } catch (error) {
        console.error(error);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      <h2>Next Prayer: {nextPrayer?.name}</h2>
      <p>Time remaining: {nextPrayer?.timeRemaining}</p>

      <h3>Today's Prayer Times</h3>
      <ul>
        {times && Object.entries(times).map(([name, time]) => (
          <li key={name}>{name}: {time}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Mosque Finder

```javascript
import React, { useState } from 'react';
import { getNearbyMosquesFromCurrentLocation } from '../services/mosqueService';

function MosqueFinder() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(false);

  async function findNearbyMosques() {
    try {
      setLoading(true);
      const data = await getNearbyMosquesFromCurrentLocation(5000);
      setMosques(data.results || []);
    } catch (error) {
      alert(error.userMessage || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={findNearbyMosques} disabled={loading}>
        {loading ? 'Finding...' : 'Find Nearby Mosques'}
      </button>

      <ul>
        {mosques.map(mosque => (
          <li key={mosque.id}>
            <h3>{mosque.name}</h3>
            <p>{mosque.distance} away</p>
            <p>{mosque.address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 4: Daily Dhikr Widget

```javascript
import React, { useState, useEffect } from 'react';
import { getDhikrForCurrentTime } from '../services/dhikrService';

function DailyDhikrWidget() {
  const [dhikr, setDhikr] = useState(null);

  useEffect(() => {
    async function loadDhikr() {
      try {
        const data = await getDhikrForCurrentTime();
        setDhikr(data.dhikr);
      } catch (error) {
        console.error(error);
      }
    }
    loadDhikr();
  }, []);

  if (!dhikr) return <div>Loading dhikr...</div>;

  return (
    <div className="dhikr-widget">
      <h3>Daily Dhikr</h3>
      <p className="arabic">{dhikr.text_arabic}</p>
      <p className="transliteration">{dhikr.transliteration}</p>
      <p className="translation">{dhikr.text_english}</p>
      {dhikr.repetitions && (
        <p>Repeat {dhikr.repetitions}x</p>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always handle errors**: Wrap service calls in try-catch blocks
2. **Show loading states**: Use loading indicators while fetching data
3. **Cache when appropriate**: Store frequently accessed data
4. **Validate inputs**: Check parameters before making API calls
5. **Use environment variables**: Configure API URLs via environment variables
6. **Implement retry logic**: The apiClient handles this automatically
7. **Handle offline scenarios**: Check network status before making calls

## Environment Configuration

Set the API base URL in your environment file:

```env
PUBLIC_API_URL=http://localhost:8000
```

For production:

```env
PUBLIC_API_URL=https://api.islamstation.com
```

## Contributing

When adding new endpoints:

1. Add the function to the appropriate service file
2. Add JSDoc comments with parameter descriptions
3. Include validation for required parameters
4. Handle errors appropriately
5. Add examples to this README
6. Export the function in the service file and index.js

## Support

For issues or questions:
- Check the API documentation at `/api/docs`
- Review error messages in browser console
- Check network tab for failed requests
