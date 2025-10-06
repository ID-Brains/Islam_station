/**
 * LocationService - Cross-platform geolocation utility
 * Handles location detection with iOS Safari fixes, validation, and error handling
 *
 * Features:
 * - Cross-platform compatibility (iOS, Android, Desktop)
 * - Coordinate validation
 * - Accuracy checks
 * - Event-based architecture (no page reloads)
 * - localStorage integration with error handling
 * - Permission state checking
 * - Timeout handling
 */

class LocationService {
  constructor() {
    this.listeners = new Map();
    this.watchId = null;
    this.currentLocation = null;
    this.lastError = null;

    // Configuration
    this.config = {
      timeout: 10000, // 10 seconds
      maximumAge: 60000, // 1 minute cache
      enableHighAccuracy: true,
      maxAcceptableAccuracy: 5000, // 5km in meters
    };

    // Check for stored location on initialization
    this.loadStoredLocation();
  }

  /**
   * Check if geolocation is supported
   * @returns {boolean}
   */
  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Check if geolocation is available (not blocked)
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    if (!this.isSupported()) return false;

    try {
      // Check permission state if available
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state !== 'denied';
      }
      return true;
    } catch (error) {
      // iOS Safari doesn't support permissions API, assume available
      return true;
    }
  }

  /**
   * Get permission state
   * @returns {Promise<string>} 'granted', 'denied', 'prompt', or 'unavailable'
   */
  async getPermissionState() {
    if (!this.isSupported()) return 'unavailable';

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return 'prompt'; // iOS Safari
    } catch (error) {
      return 'prompt';
    }
  }

  /**
   * Validate coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean}
   */
  isValidCoordinates(lat, lng) {
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
   * Check if accuracy is acceptable
   * @param {number} accuracy - Accuracy in meters
   * @returns {boolean}
   */
  isAccuracyAcceptable(accuracy) {
    return accuracy <= this.config.maxAcceptableAccuracy;
  }

  /**
   * Format location object
   * @param {GeolocationPosition} position
   * @returns {Object}
   */
  formatLocation(position) {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    };
  }

  /**
   * Get current position (one-time)
   * @param {Object} options - Override default options
   * @returns {Promise<Object>}
   */
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = new Error('Geolocation is not supported by this browser');
        error.code = 'NOT_SUPPORTED';
        this.lastError = error;
        reject(error);
        return;
      }

      const opts = { ...this.config, ...options };

      // iOS Safari fix: Geolocation must be called from user interaction
      // This is handled by the caller ensuring this is triggered by a button click

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.formatLocation(position);

          // Validate coordinates
          if (!this.isValidCoordinates(location.lat, location.lng)) {
            const error = new Error('Invalid coordinates received');
            error.code = 'INVALID_COORDINATES';
            error.data = location;
            this.lastError = error;
            reject(error);
            return;
          }

          // Check accuracy
          if (!this.isAccuracyAcceptable(location.accuracy)) {
            const error = new Error(
              `Location accuracy too low: ${Math.round(location.accuracy)}m`
            );
            error.code = 'LOW_ACCURACY';
            error.data = location;
            this.lastError = error;
            reject(error);
            return;
          }

          // Store location
          this.currentLocation = location;
          this.saveLocation(location);
          this.notifyListeners('success', location);

          resolve(location);
        },
        (error) => {
          const formattedError = this.formatError(error);
          this.lastError = formattedError;
          this.notifyListeners('error', formattedError);
          reject(formattedError);
        },
        opts
      );
    });
  }

  /**
   * Watch position (continuous updates)
   * @param {Function} callback - Called on each position update
   * @param {Function} errorCallback - Called on error
   * @param {Object} options - Override default options
   * @returns {number} Watch ID
   */
  watchPosition(callback, errorCallback, options = {}) {
    if (!this.isSupported()) {
      const error = new Error('Geolocation is not supported by this browser');
      error.code = 'NOT_SUPPORTED';
      if (errorCallback) errorCallback(error);
      return null;
    }

    if (this.watchId !== null) {
      this.clearWatch();
    }

    const opts = { ...this.config, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = this.formatLocation(position);

        if (!this.isValidCoordinates(location.lat, location.lng)) {
          const error = new Error('Invalid coordinates received');
          error.code = 'INVALID_COORDINATES';
          if (errorCallback) errorCallback(error);
          return;
        }

        this.currentLocation = location;
        this.saveLocation(location);
        this.notifyListeners('update', location);

        if (callback) callback(location);
      },
      (error) => {
        const formattedError = this.formatError(error);
        this.lastError = formattedError;
        this.notifyListeners('error', formattedError);

        if (errorCallback) errorCallback(formattedError);
      },
      opts
    );

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  clearWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Format geolocation error
   * @param {GeolocationPositionError} error
   * @returns {Error}
   */
  formatError(error) {
    const formattedError = new Error();

    switch (error.code) {
      case error.PERMISSION_DENIED:
        formattedError.message = 'Location permission denied. Please enable location access in your browser settings.';
        formattedError.code = 'PERMISSION_DENIED';
        formattedError.userMessage = 'Permission Denied';
        formattedError.recoverable = true;
        break;

      case error.POSITION_UNAVAILABLE:
        formattedError.message = 'Location information is unavailable. Please check your device settings.';
        formattedError.code = 'POSITION_UNAVAILABLE';
        formattedError.userMessage = 'Location Unavailable';
        formattedError.recoverable = true;
        break;

      case error.TIMEOUT:
        formattedError.message = 'Location request timed out. Please try again.';
        formattedError.code = 'TIMEOUT';
        formattedError.userMessage = 'Request Timed Out';
        formattedError.recoverable = true;
        break;

      default:
        formattedError.message = 'An unknown error occurred while getting your location.';
        formattedError.code = 'UNKNOWN_ERROR';
        formattedError.userMessage = 'Unknown Error';
        formattedError.recoverable = false;
    }

    formattedError.originalError = error;
    return formattedError;
  }

  /**
   * Save location to localStorage
   * @param {Object} location
   */
  saveLocation(location) {
    try {
      const data = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      };
      localStorage.setItem('userLocation', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save location to localStorage:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Load location from localStorage
   * @returns {Object|null}
   */
  loadStoredLocation() {
    try {
      const stored = localStorage.getItem('userLocation');
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Validate stored data
      if (!this.isValidCoordinates(data.lat, data.lng)) {
        this.clearStoredLocation();
        return null;
      }

      // Check if stored location is too old (> 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - data.timestamp > maxAge) {
        this.clearStoredLocation();
        return null;
      }

      this.currentLocation = data;
      return data;
    } catch (error) {
      console.warn('Failed to load stored location:', error);
      this.clearStoredLocation();
      return null;
    }
  }

  /**
   * Clear stored location
   */
  clearStoredLocation() {
    try {
      localStorage.removeItem('userLocation');
    } catch (error) {
      console.warn('Failed to clear stored location:', error);
    }
  }

  /**
   * Get current location (from cache or new request)
   * @param {boolean} forceRefresh - Force new request
   * @returns {Promise<Object>}
   */
  async getLocation(forceRefresh = false) {
    // Return cached location if available and not forcing refresh
    if (!forceRefresh && this.currentLocation) {
      const age = Date.now() - this.currentLocation.timestamp;
      if (age < this.config.maximumAge) {
        return this.currentLocation;
      }
    }

    // Get fresh location
    return this.getCurrentPosition();
  }

  /**
   * Register event listener
   * @param {string} event - Event name ('success', 'error', 'update')
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unregister event listener
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event
   * @param {*} data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in location listener:', error);
        }
      });
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1
   * @param {number} lng1
   * @param {number} lat2
   * @param {number} lng2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get default location (fallback)
   * @returns {Object}
   */
  getDefaultLocation() {
    // Riyadh, Saudi Arabia
    return {
      lat: 24.7136,
      lng: 46.6753,
      accuracy: null,
      isDefault: true,
    };
  }

  /**
   * Get location with fallback
   * @param {boolean} forceRefresh
   * @returns {Promise<Object>}
   */
  async getLocationOrDefault(forceRefresh = false) {
    try {
      return await this.getLocation(forceRefresh);
    } catch (error) {
      console.warn('Using default location due to error:', error.message);
      return this.getDefaultLocation();
    }
  }

  /**
   * Dispose - cleanup resources
   */
  dispose() {
    this.clearWatch();
    this.listeners.clear();
    this.currentLocation = null;
    this.lastError = null;
  }
}

// Create singleton instance
const locationService = new LocationService();

// Export singleton and class
export default locationService;
export { LocationService };
