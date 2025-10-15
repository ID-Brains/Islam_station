/**
 * Geolocation Helper - Centralized geolocation utility
 * Eliminates duplication across services and components
 *
 * Usage:
 *   const coords = await getCurrentLocation();
 *   // { lat: 40.7128, lng: -74.0060, accuracy: 50, timestamp: 1697000000000 }
 */

/**
 * Geolocation default configuration
 * Values come from environment variables with sensible defaults
 */
export const getGeolocationConfig = () => ({
  timeout: parseInt(import.meta.env.PUBLIC_LOCATION_TIMEOUT || '10000', 10),
  maximumAge: parseInt(import.meta.env.PUBLIC_LOCATION_MAX_AGE || '300000', 10),
  enableHighAccuracy: import.meta.env.PUBLIC_LOCATION_HIGH_ACCURACY !== 'false',
});

/**
 * Check if geolocation is supported
 * @returns {boolean}
 */
export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Validate coordinates are within valid ranges
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {boolean}
 */
export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Normalize geolocation position to standard format
 * @param {GeolocationPosition} position - Browser geolocation position object
 * @returns {Object} Normalized coordinates object
 */
export function normalizeCoordinates(position) {
  const { coords, timestamp } = position;
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy,
    altitude: coords.altitude,
    altitudeAccuracy: coords.altitudeAccuracy,
    heading: coords.heading,
    speed: coords.speed,
    timestamp: timestamp || Date.now(),
  };
}

/**
 * Get current location using browser geolocation API
 * Centralized to eliminate duplication across 5+ files
 *
 * @param {Object} options - Override default geolocation options
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {number} [options.maximumAge] - Maximum age of cached position in milliseconds
 * @param {boolean} [options.enableHighAccuracy] - Use high accuracy mode
 * @returns {Promise<Object>} Normalized coordinates { lat, lng, accuracy, timestamp }
 * @throws {Error} If geolocation not supported or user denies permission
 */
export async function getCurrentLocation(options = {}) {
  if (!isGeolocationSupported()) {
    throw new Error('Geolocation is not supported by your browser');
  }

  const config = { ...getGeolocationConfig(), ...options };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(normalizeCoordinates(position));
      },
      (error) => {
        const errorMessages = {
          1: 'Location permission denied. Please enable location access in your browser settings.',
          2: 'Location information is unavailable. Please try again.',
          3: 'Location request timed out. Please check your internet connection and try again.',
        };

        const message = errorMessages[error.code] || 'An unknown error occurred while getting your location.';
        const err = new Error(message);
        err.code = error.code;
        err.originalError = error;
        reject(err);
      },
      {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge,
      }
    );
  });
}

/**
 * Watch location changes (for real-time location tracking)
 * Returns cleanup function to stop watching
 *
 * @param {Function} onSuccess - Callback when location updates
 * @param {Function} onError - Callback when error occurs
 * @param {Object} options - Geolocation options
 * @returns {Function} Cleanup function to stop watching
 */
export function watchLocation(onSuccess, onError, options = {}) {
  if (!isGeolocationSupported()) {
    onError?.(new Error('Geolocation is not supported by your browser'));
    return () => {};
  }

  const config = { ...getGeolocationConfig(), ...options };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onSuccess(normalizeCoordinates(position));
    },
    (error) => {
      const errorMessages = {
        1: 'Location permission denied.',
        2: 'Location information is unavailable.',
        3: 'Location request timed out.',
      };

      const message = errorMessages[error.code] || 'An unknown error occurred.';
      const err = new Error(message);
      err.code = error.code;
      onError?.(err);
    },
    {
      enableHighAccuracy: config.enableHighAccuracy,
      timeout: config.timeout,
      maximumAge: config.maximumAge,
    }
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Check permission status (where supported)
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'unknown'
 */
export async function checkGeolocationPermission() {
  try {
    if (!('permissions' in navigator)) {
      return 'unknown'; // Not supported
    }

    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted' | 'denied' | 'prompt'
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Request geolocation permission explicitly
 * Only works on user gesture (click, tap, etc)
 *
 * @returns {Promise<string>} 'granted' | 'denied' | 'unknown'
 */
export async function requestGeolocationPermission() {
  try {
    const location = await getCurrentLocation();
    return 'granted';
  } catch (error) {
    if (error.code === 1) {
      return 'denied';
    }
    return 'unknown';
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
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
 * @returns {string} Formatted distance (e.g., "2.5 km" or "150 m")
 */
export function formatDistance(distanceInMeters) {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

/**
 * Sort array of location objects by distance from a reference point
 * Assumes objects have 'lat' and 'lng' properties
 *
 * @param {Array} locations - Array of location objects { lat, lng, ... }
 * @param {number} refLat - Reference latitude
 * @param {number} refLng - Reference longitude
 * @returns {Array} Sorted array with 'distance' property added to each
 */
export function sortByDistance(locations, refLat, refLng) {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(
        refLat,
        refLng,
        location.lat || location.latitude,
        location.lng || location.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Export all for convenience
 */
export default {
  getGeolocationConfig,
  isGeolocationSupported,
  isValidCoordinates,
  normalizeCoordinates,
  getCurrentLocation,
  watchLocation,
  checkGeolocationPermission,
  requestGeolocationPermission,
  calculateDistance,
  formatDistance,
  sortByDistance,
};
