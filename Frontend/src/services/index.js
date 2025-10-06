/**
 * API Services Index
 * Central export point for all API services
 */

// Import all services
import quranService from './quranService';
import prayerService from './prayerService';
import mosqueService from './mosqueService';
import dhikrService from './dhikrService';

// Re-export individual services
export { quranService, prayerService, mosqueService, dhikrService };

// Export individual functions for convenience
export {
  // Quran Service
  searchQuran,
  getSurah,
  getVerse,
  getRandomVerse,
  getVerseRange,
  searchArabic,
  searchTranslation,
  searchInSurah,
  transformVerse,
  transformSurah
} from './quranService';

export {
  // Prayer Service
  getPrayerTimes,
  getPrayerTimesWithGeolocation,
  getNextPrayer,
  getMonthlyPrayerTimes,
  getQiblaDirection,
  getCalculationMethods,
  getPrayerTimesForCurrentLocation,
  getNextPrayerForCurrentLocation,
  getQiblaForCurrentLocation,
  calculateTimeRemaining,
  formatTimeRemaining,
  formatPrayerName
} from './prayerService';

export {
  // Mosque Service
  getNearbyMosques,
  searchMosques,
  getMosqueById,
  getMosquesInArea,
  getMosqueCities,
  getMosqueCountries,
  getNearbyMosquesFromCurrentLocation,
  calculateDistance,
  formatDistance,
  sortMosquesByDistance,
  getMosquesInViewport,
  searchMosquesByCity,
  searchMosquesByCountry,
  getMosqueWithPrayerTimes
} from './mosqueService';

export {
  // Dhikr Service
  getDailyDhikr,
  getDhikrByCategory,
  getRandomDhikr,
  getDhikrById,
  getDhikrCategories,
  searchDhikr,
  getMorningDhikr,
  getEveningDhikr,
  searchArabicDhikr,
  searchEnglishDhikr,
  getDhikrByTimeOfDay,
  getDhikrForCurrentTime,
  getDhikrFromMultipleCategories,
  transformDhikr,
  getCategoryStatistics,
  createDhikrRoutine
} from './dhikrService';

// Default export with all services
export default {
  quran: quranService,
  prayer: prayerService,
  mosque: mosqueService,
  dhikr: dhikrService
};
