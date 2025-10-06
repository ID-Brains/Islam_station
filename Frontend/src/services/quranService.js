/**
 * Quran API Service
 * Handles all Quran-related API calls
 */

import apiClient from '../utils/apiClient';

/**
 * Search Quran verses with advanced filtering
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query for Quran verses
 * @param {string} [params.type='fulltext'] - Search type: fulltext, exact, translation, arabic
 * @param {string} [params.language='both'] - Language filter: both, arabic, english
 * @param {number} [params.page=1] - Page number for pagination
 * @param {number} [params.limit=10] - Maximum number of results per page
 * @param {string} [params.surah='all'] - Surah filter: all or surah number
 * @returns {Promise<Object>} Search results with pagination
 */
export async function searchQuran(params) {
  try {
    const response = await apiClient.get('/api/quran/search', { params });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get complete Surah by number
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {Promise<Object>} Complete surah with all verses
 */
export async function getSurah(surahNumber) {
  try {
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      throw new Error('Invalid surah number. Must be between 1 and 114.');
    }
    const response = await apiClient.get(`/api/quran/surah/${surahNumber}`);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get specific verse by surah and verse number
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within the surah
 * @returns {Promise<Object>} Specific verse with context
 */
export async function getVerse(surahNumber, verseNumber) {
  try {
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      throw new Error('Invalid surah number. Must be between 1 and 114.');
    }
    if (!verseNumber || verseNumber < 1) {
      throw new Error('Invalid verse number. Must be greater than 0.');
    }
    const response = await apiClient.get(`/api/quran/verse/${surahNumber}/${verseNumber}`);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a random Quran verse
 * @returns {Promise<Object>} Random verse
 */
export async function getRandomVerse() {
  try {
    const response = await apiClient.get('/api/quran/random');
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get verses in a range for a surah
 * @param {number} surahNumber - Surah number
 * @param {number} startVerse - Starting verse number
 * @param {number} endVerse - Ending verse number
 * @returns {Promise<Object>} Verses in the specified range
 */
export async function getVerseRange(surahNumber, startVerse, endVerse) {
  try {
    // Get the entire surah and filter verses
    const surah = await getSurah(surahNumber);

    if (surah && surah.verses) {
      const filteredVerses = surah.verses.filter(
        verse => verse.ayah_no_surah >= startVerse && verse.ayah_no_surah <= endVerse
      );

      return {
        surah: surah.surah,
        verses: filteredVerses,
        range: { start: startVerse, end: endVerse }
      };
    }

    return null;
  } catch (error) {
    throw error;
  }
}

/**
 * Search verses by Arabic text
 * @param {string} searchText - Arabic text to search
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Results per page
 * @returns {Promise<Object>} Search results
 */
export async function searchArabic(searchText, page = 1, limit = 10) {
  return searchQuran({
    q: searchText,
    type: 'arabic',
    language: 'arabic',
    page,
    limit
  });
}

/**
 * Search verses by translation
 * @param {string} searchText - English text to search
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Results per page
 * @returns {Promise<Object>} Search results
 */
export async function searchTranslation(searchText, page = 1, limit = 10) {
  return searchQuran({
    q: searchText,
    type: 'translation',
    language: 'english',
    page,
    limit
  });
}

/**
 * Search verses in a specific surah
 * @param {string} searchText - Text to search
 * @param {number} surahNumber - Surah number to search in
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Results per page
 * @returns {Promise<Object>} Search results
 */
export async function searchInSurah(searchText, surahNumber, page = 1, limit = 10) {
  return searchQuran({
    q: searchText,
    surah: surahNumber.toString(),
    page,
    limit
  });
}

/**
 * Transform backend verse data to frontend format
 * @param {Object} verse - Verse data from backend
 * @returns {Object} Transformed verse data
 */
export function transformVerse(verse) {
  return {
    verse_number: verse.ayah_no_surah,
    text: verse.ayah_ar,
    translation: verse.ayah_en,
    juz_number: verse.juz_no,
    page_number: verse.ruko_no,
    manzil_number: verse.manzil_no,
    hizb_quarter: verse.hizb_quarter,
    sajdah: verse.sajdah_ayah,
    sajdah_number: verse.sajdah_no,
    surah_number: verse.surah_no,
    surah_name_arabic: verse.surah_name_ar,
    surah_name_english: verse.surah_name_en
  };
}

/**
 * Transform backend surah data to frontend format
 * @param {Object} surah - Surah data from backend
 * @returns {Object} Transformed surah data
 */
export function transformSurah(surah) {
  return {
    number: surah.number,
    name: surah.name_english,
    name_arabic: surah.name_arabic,
    english_name_translation: surah.name_english,
    verses_count: surah.verses_count
  };
}

// Export all functions as default object
export default {
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
};
