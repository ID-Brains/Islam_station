/**
 * Dhikr/Dua API Service
 * Handles all dhikr and dua-related API calls
 */

import apiClient from '../utils/apiClient';

/**
 * Get a random dhikr/dua for daily spiritual practice
 * @param {number} [categoryId=1] - Category of dhikr (morning, evening, general, etc.)
 * @returns {Promise<Object>} Random dhikr from the specified category
 */
export async function getDailyDhikr(categoryId = 1) {
  try {
    if (categoryId < 1) {
      throw new Error('Invalid category ID. Must be greater than 0.');
    }

    const response = await apiClient.get('/api/dhikr/daily', {
      params: { category_id: categoryId }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all dhikr/dua from a specific category
 * @param {number} categoryId - Category ID to filter by
 * @param {number} [limit=20] - Maximum results to return (max 100)
 * @param {number} [offset=0] - Pagination offset
 * @returns {Promise<Object>} List of dhikr from the category
 */
export async function getDhikrByCategory(categoryId, limit = 20, offset = 0) {
  try {
    if (!categoryId || categoryId < 1) {
      throw new Error('Invalid category ID. Must be greater than 0.');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100.');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative.');
    }

    const response = await apiClient.get(`/api/dhikr/category/${categoryId}`, {
      params: { limit, offset }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a random dhikr/dua, optionally filtered by category
 * @param {number} [categoryId] - Optional category to filter random selection
 * @returns {Promise<Object>} Random dhikr
 */
export async function getRandomDhikr(categoryId) {
  try {
    const params = {};
    if (categoryId) {
      if (categoryId < 1) {
        throw new Error('Invalid category ID. Must be greater than 0.');
      }
      params.category_id = categoryId;
    }

    const response = await apiClient.get('/api/dhikr/random', { params });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get specific dhikr/dua by ID
 * @param {number} dhikrId - Unique identifier of the dhikr
 * @returns {Promise<Object>} Dhikr details
 */
export async function getDhikrById(dhikrId) {
  try {
    if (!dhikrId || dhikrId < 1) {
      throw new Error('Invalid dhikr ID. Must be greater than 0.');
    }

    const response = await apiClient.get(`/api/dhikr/${dhikrId}`);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all available dhikr/dua categories
 * @returns {Promise<Object>} List of categories with counts
 */
export async function getDhikrCategories() {
  try {
    const response = await apiClient.get('/api/dhikr/categories');
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Search dhikr/dua by text content
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search term (min 2 characters)
 * @param {string} [params.language='both'] - Search language: 'arabic', 'english', or 'both'
 * @param {number} [params.limit=20] - Maximum results (max 100)
 * @param {number} [params.offset=0] - Pagination offset
 * @returns {Promise<Object>} List of matching dhikr
 */
export async function searchDhikr(params) {
  try {
    const { q, language = 'both', limit = 20, offset = 0 } = params;

    if (!q || q.length < 2) {
      throw new Error('Search query must be at least 2 characters long.');
    }
    if (!['arabic', 'english', 'both'].includes(language)) {
      throw new Error('Language must be "arabic", "english", or "both".');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100.');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative.');
    }

    const response = await apiClient.get('/api/dhikr/search', {
      params: { q, language, limit, offset }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get morning adhkar (azkar al-sabah)
 * @param {number} [limit=10] - Number of adhkar to return
 * @returns {Promise<Object>} List of morning dhikr
 */
export async function getMorningDhikr(limit = 10) {
  try {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100.');
    }

    const response = await apiClient.get('/api/dhikr/morning', {
      params: { limit }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get evening adhkar (azkar al-masa)
 * @param {number} [limit=10] - Number of adhkar to return
 * @returns {Promise<Object>} List of evening dhikr
 */
export async function getEveningDhikr(limit = 10) {
  try {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100.');
    }

    const response = await apiClient.get('/api/dhikr/evening', {
      params: { limit }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Search dhikr in Arabic only
 * @param {string} searchText - Arabic text to search
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<Object>} Search results
 */
export async function searchArabicDhikr(searchText, limit = 20) {
  return searchDhikr({
    q: searchText,
    language: 'arabic',
    limit
  });
}

/**
 * Search dhikr in English only
 * @param {string} searchText - English text to search
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<Object>} Search results
 */
export async function searchEnglishDhikr(searchText, limit = 20) {
  return searchDhikr({
    q: searchText,
    language: 'english',
    limit
  });
}

/**
 * Get dhikr for specific time of day
 * @param {string} timeOfDay - 'morning', 'evening', or 'general'
 * @param {number} [limit=10] - Number of dhikr to return
 * @returns {Promise<Object>} Dhikr for the specified time
 */
export async function getDhikrByTimeOfDay(timeOfDay, limit = 10) {
  try {
    const timeMap = {
      morning: getMorningDhikr,
      evening: getEveningDhikr,
      general: getRandomDhikr
    };

    const fetchFunction = timeMap[timeOfDay.toLowerCase()];
    if (!fetchFunction) {
      throw new Error('Invalid time of day. Must be "morning", "evening", or "general".');
    }

    return await fetchFunction(limit);
  } catch (error) {
    throw error;
  }
}

/**
 * Get dhikr appropriate for current time
 * @param {number} [limit=10] - Number of dhikr to return
 * @returns {Promise<Object>} Dhikr for current time
 */
export async function getDhikrForCurrentTime(limit = 10) {
  try {
    const currentHour = new Date().getHours();

    // Morning: 4 AM - 12 PM
    if (currentHour >= 4 && currentHour < 12) {
      return await getMorningDhikr(limit);
    }
    // Evening: 3 PM - 8 PM
    else if (currentHour >= 15 && currentHour < 20) {
      return await getEveningDhikr(limit);
    }
    // Other times: random/general dhikr
    else {
      return await getRandomDhikr();
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get all dhikr from multiple categories
 * @param {Array<number>} categoryIds - Array of category IDs
 * @param {number} [limit=20] - Results per category
 * @returns {Promise<Array>} Array of dhikr from all categories
 */
export async function getDhikrFromMultipleCategories(categoryIds, limit = 20) {
  try {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new Error('Category IDs must be a non-empty array.');
    }

    const promises = categoryIds.map(categoryId =>
      getDhikrByCategory(categoryId, limit).catch(err => ({
        error: true,
        categoryId,
        message: err.message
      }))
    );

    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Transform dhikr data for frontend display
 * @param {Object} dhikr - Dhikr data from backend
 * @returns {Object} Transformed dhikr data
 */
export function transformDhikr(dhikr) {
  return {
    id: dhikr.id || dhikr.dhikr_id,
    arabic: dhikr.text_arabic || dhikr.dhikr_ar,
    english: dhikr.text_english || dhikr.dhikr_en,
    transliteration: dhikr.transliteration,
    translation: dhikr.translation || dhikr.english,
    reference: dhikr.reference || dhikr.source,
    category: dhikr.category || dhikr.category_name,
    categoryId: dhikr.category_id,
    repetitions: dhikr.repetitions || dhikr.count || 1,
    benefits: dhikr.benefits || dhikr.virtue,
    timeOfDay: dhikr.time_of_day || dhikr.timing
  };
}

/**
 * Get dhikr statistics for a category
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>} Category statistics
 */
export async function getCategoryStatistics(categoryId) {
  try {
    const dhikrList = await getDhikrByCategory(categoryId, 100, 0);

    if (!dhikrList || !dhikrList.results) {
      return null;
    }

    return {
      categoryId,
      totalCount: dhikrList.total || dhikrList.results.length,
      averageRepetitions:
        dhikrList.results.reduce((sum, d) => sum + (d.repetitions || 1), 0) /
        dhikrList.results.length
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create a dhikr routine for a specific time period
 * @param {string} period - 'daily', 'morning', 'evening', 'weekly'
 * @returns {Promise<Object>} Dhikr routine
 */
export async function createDhikrRoutine(period) {
  try {
    const routines = {
      daily: async () => {
        const morning = await getMorningDhikr(5);
        const evening = await getEveningDhikr(5);
        return { morning, evening };
      },
      morning: () => getMorningDhikr(10),
      evening: () => getEveningDhikr(10),
      weekly: async () => {
        const categories = await getDhikrCategories();
        if (categories && categories.categories) {
          const randomCategory =
            categories.categories[
              Math.floor(Math.random() * categories.categories.length)
            ];
          return await getDhikrByCategory(randomCategory.id, 7);
        }
        return null;
      }
    };

    const routineFunction = routines[period.toLowerCase()];
    if (!routineFunction) {
      throw new Error(
        'Invalid period. Must be "daily", "morning", "evening", or "weekly".'
      );
    }

    return await routineFunction();
  } catch (error) {
    throw error;
  }
}

// Export all functions as default object
export default {
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
};
