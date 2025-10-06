/**
 * Mosque Finder API Service
 * Handles all mosque-related API calls
 */

import apiClient from '../utils/apiClient';

/**
 * Find mosques near a specific location using geospatial search
 * @param {Object} params - Location parameters
 * @param {number} params.latitude - Your current latitude (-90 to 90)
 * @param {number} params.longitude - Your current longitude (-180 to 180)
 * @param {number} [params.radius=5000] - Search radius in meters (100-50000)
 * @returns {Promise<Object>} List of nearby mosques with distance information
 */
export async function getNearbyMosques(params) {
  try {
    const { latitude, longitude, radius = 5000 } = params;

    if (!latitude || latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude. Must be between -90 and 90.');
    }
    if (!longitude || longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude. Must be between -180 and 180.');
    }
    if (radius < 100 || radius > 50000) {
      throw new Error('Invalid radius. Must be between 100 and 50000 meters.');
    }

    const response = await apiClient.get('/api/mosque/nearby', {
      params: { latitude, longitude, radius }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Search mosques by name with optional filters
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search term for mosque name (min 2 characters)
 * @param {string} [params.city] - Optional city filter
 * @param {string} [params.country] - Optional country filter
 * @param {number} [params.limit=20] - Maximum results to return (max 100)
 * @param {number} [params.offset=0] - Pagination offset
 * @returns {Promise<Object>} List of matching mosques
 */
export async function searchMosques(params) {
  try {
    const { q, city, country, limit = 20, offset = 0 } = params;

    if (!q || q.length < 2) {
      throw new Error('Search query must be at least 2 characters long.');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100.');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative.');
    }

    const queryParams = { q, limit, offset };
    if (city) queryParams.city = city;
    if (country) queryParams.country = country;

    const response = await apiClient.get('/api/mosque/search', {
      params: queryParams
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get detailed information about a specific mosque
 * @param {number} mosqueId - Unique identifier of the mosque
 * @returns {Promise<Object>} Mosque details
 */
export async function getMosqueById(mosqueId) {
  try {
    if (!mosqueId || mosqueId < 1) {
      throw new Error('Invalid mosque ID.');
    }

    const response = await apiClient.get(`/api/mosque/${mosqueId}`);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all mosques within a bounding box (rectangular area)
 * @param {Object} params - Bounding box parameters
 * @param {number} params.min_lat - Southwest corner latitude (-90 to 90)
 * @param {number} params.min_lng - Southwest corner longitude (-180 to 180)
 * @param {number} params.max_lat - Northeast corner latitude (-90 to 90)
 * @param {number} params.max_lng - Northeast corner longitude (-180 to 180)
 * @returns {Promise<Object>} List of mosques in the specified area
 */
export async function getMosquesInArea(params) {
  try {
    const { min_lat, min_lng, max_lat, max_lng } = params;

    if (!min_lat || min_lat < -90 || min_lat > 90) {
      throw new Error('Invalid min_lat. Must be between -90 and 90.');
    }
    if (!min_lng || min_lng < -180 || min_lng > 180) {
      throw new Error('Invalid min_lng. Must be between -180 and 180.');
    }
    if (!max_lat || max_lat < -90 || max_lat > 90) {
      throw new Error('Invalid max_lat. Must be between -90 and 90.');
    }
    if (!max_lng || max_lng < -180 || max_lng > 180) {
      throw new Error('Invalid max_lng. Must be between -180 and 180.');
    }
    if (min_lat >= max_lat) {
      throw new Error('min_lat must be less than max_lat.');
    }
    if (min_lng >= max_lng) {
      throw new Error('min_lng must be less than max_lng.');
    }

    const response = await apiClient.get('/api/mosque/area/bbox', {
      params: { min_lat, min_lng, max_lat, max_lng }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get list of cities with mosques for filtering
 * @returns {Promise<Object>} List of unique cities
 */
export async function getMosqueCities() {
  try {
    const response = await apiClient.get('/api/mosque/cities');
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get list of countries with mosques for filtering
 * @returns {Promise<Object>} List of unique countries
 */
export async function getMosqueCountries() {
  try {
    const response = await apiClient.get('/api/mosque/countries');
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get nearby mosques using browser's geolocation
 * @param {number} [radius=5000] - Search radius in meters
 * @returns {Promise<Object>} List of nearby mosques
 */
export async function getNearbyMosquesFromCurrentLocation(radius = 5000) {
  try {
    // Get current location from browser
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
    });

    const { latitude, longitude } = position.coords;

    return await getNearbyMosques({ latitude, longitude, radius });
  } catch (error) {
    if (error.code === error.PERMISSION_DENIED) {
      throw new Error('Location permission denied. Please enable location access.');
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      throw new Error('Location information unavailable.');
    } else if (error.code === error.TIMEOUT) {
      throw new Error('Location request timed out.');
    }
    throw error;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceInMeters) {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
}

/**
 * Sort mosques by distance from a point
 * @param {Array} mosques - Array of mosque objects with lat/lng
 * @param {number} latitude - Reference point latitude
 * @param {number} longitude - Reference point longitude
 * @returns {Array} Sorted array of mosques with distance property
 */
export function sortMosquesByDistance(mosques, latitude, longitude) {
  return mosques
    .map(mosque => ({
      ...mosque,
      distance: calculateDistance(
        latitude,
        longitude,
        mosque.latitude || mosque.lat,
        mosque.longitude || mosque.lng || mosque.lon
      )
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get mosques in viewport bounds (for map display)
 * @param {Object} bounds - Map viewport bounds
 * @param {Object} bounds.north - North boundary
 * @param {Object} bounds.south - South boundary
 * @param {Object} bounds.east - East boundary
 * @param {Object} bounds.west - West boundary
 * @returns {Promise<Object>} Mosques in viewport
 */
export async function getMosquesInViewport(bounds) {
  try {
    const { north, south, east, west } = bounds;

    return await getMosquesInArea({
      min_lat: south,
      min_lng: west,
      max_lat: north,
      max_lng: east
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Search mosques by city
 * @param {string} cityName - Name of the city
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<Object>} Mosques in the city
 */
export async function searchMosquesByCity(cityName, limit = 20) {
  return searchMosques({
    q: cityName,
    city: cityName,
    limit
  });
}

/**
 * Search mosques by country
 * @param {string} countryName - Name of the country
 * @param {number} [limit=20] - Maximum results
 * @returns {Promise<Object>} Mosques in the country
 */
export async function searchMosquesByCountry(countryName, limit = 20) {
  return searchMosques({
    q: countryName,
    country: countryName,
    limit
  });
}

/**
 * Get mosque details with prayer times
 * @param {number} mosqueId - Mosque ID
 * @param {string} [date] - Date for prayer times (YYYY-MM-DD)
 * @returns {Promise<Object>} Mosque details with prayer times
 */
export async function getMosqueWithPrayerTimes(mosqueId, date) {
  try {
    const mosque = await getMosqueById(mosqueId);

    // If mosque has coordinates, fetch prayer times
    if (mosque && mosque.latitude && mosque.longitude) {
      const prayerService = await import('./prayerService.js');
      const prayerTimes = await prayerService.getPrayerTimes({
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        date
      });

      return {
        ...mosque,
        prayerTimes
      };
    }

    return mosque;
  } catch (error) {
    throw error;
  }
}

// Export all functions as default object
export default {
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
};
