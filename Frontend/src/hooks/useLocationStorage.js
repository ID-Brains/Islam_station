/**
 * useLocationStorage Hook
 * Centralized location storage and caching logic
 * Consolidates localStorage handling from 3+ components
 *
 * Usage:
 *   const { location, saveLocation, clearLocation, loading, error } = useLocationStorage();
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'userLocation';
const LOCATION_CACHE_TTL = parseInt(import.meta.env.PUBLIC_LOCATION_CACHE_TTL || '86400000', 10); // 24 hours

/**
 * Custom hook for managing location storage with automatic cache expiration
 * @param {Object} initialLocation - Optional initial location { lat, lng }
 * @returns {Object} { location, loading, error, saveLocation, clearLocation, isExpired }
 */
export function useLocationStorage(initialLocation = null) {
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const age = Date.now() - (data.timestamp || 0);

        if (age < LOCATION_CACHE_TTL) {
          // Cache is still valid
          setLocation(data);
          setIsExpired(false);
        } else {
          // Cache has expired
          localStorage.removeItem(STORAGE_KEY);
          setIsExpired(true);
        }
      }
    } catch (err) {
      console.error('Failed to load location from storage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save location to localStorage with timestamp
   * @param {Object} loc - Location object { lat, lng }
   * @param {Object} options - Additional options { userSaved: boolean }
   */
  const saveLocation = (loc, options = {}) => {
    try {
      const withTimestamp = {
        ...loc,
        timestamp: Date.now(),
        userSaved: options.userSaved ?? false, // Mark if user explicitly saved
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
      setLocation(loc);
      setIsExpired(false);
      setError(null);
    } catch (err) {
      console.error('Failed to save location:', err);
      setError(err.message);
    }
  };

  /**
   * Clear location from storage
   */
  const clearLocation = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLocation(null);
      setIsExpired(false);
      setError(null);
    } catch (err) {
      console.error('Failed to clear location:', err);
      setError(err.message);
    }
  };

  /**
   * Check if stored location is still valid
   * @returns {boolean}
   */
  const isLocationValid = () => {
    if (!location) return false;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const data = JSON.parse(stored);
      const age = Date.now() - (data.timestamp || 0);
      return age < LOCATION_CACHE_TTL;
    } catch (err) {
      return false;
    }
  };

  /**
   * Update location without updating timestamp (silent update)
   * @param {Object} loc - Location object { lat, lng }
   */
  const updateLocation = (loc) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let withTimestamp;

      if (stored) {
        const data = JSON.parse(stored);
        withTimestamp = { ...data, ...loc }; // Keep original timestamp
      } else {
        withTimestamp = { ...loc, timestamp: Date.now() };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
      setLocation(loc);
      setError(null);
    } catch (err) {
      console.error('Failed to update location:', err);
      setError(err.message);
    }
  };

  return {
    location,
    loading,
    error,
    isExpired,
    saveLocation,
    clearLocation,
    updateLocation,
    isLocationValid,
  };
}

export default useLocationStorage;
