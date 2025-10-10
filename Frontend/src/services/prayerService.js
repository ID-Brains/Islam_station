/**
 * Prayer Times API Service
 * Handles all prayer times and Qibla-related API calls
 */

import apiClient from "../utils/apiClient";

/**
 * Get prayer times for a specific location and date
 * @param {Object} params - Prayer time parameters
 * @param {number} params.latitude - Location latitude (-90 to 90)
 * @param {number} params.longitude - Location longitude (-180 to 180)
 * @param {string} [params.date] - Date in YYYY-MM-DD format (defaults to today)
 * @param {string} [params.method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Prayer times for the location and date
 */
export async function getPrayerTimes(params) {
    try {
        const { latitude, longitude, date, method = "MuslimWorldLeague" } = params;

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90.");
        }
        if (!longitude || longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180.");
        }

        const queryParams = {
            latitude,
            longitude,
            method,
        };

        if (date) {
            queryParams.date_str = date;
        }

        const response = await apiClient.get("/api/prayer/times", { params: queryParams });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get prayer times with geolocation (backward compatible endpoint)
 * @param {Object} params - Prayer time parameters
 * @param {number} params.latitude - Location latitude
 * @param {number} params.longitude - Location longitude
 * @param {string} [params.method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Prayer times with location information
 */
export async function getPrayerTimesWithGeolocation(params) {
    try {
        const { latitude, longitude, method = "MuslimWorldLeague" } = params;

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90.");
        }
        if (!longitude || longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180.");
        }

        const response = await apiClient.get("/api/prayer/times", {
            params: { latitude, longitude, method },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get the next prayer time and countdown
 * @param {Object} params - Location parameters
 * @param {number} params.latitude - Location latitude
 * @param {number} params.longitude - Location longitude
 * @param {string} [params.method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Next prayer information with countdown
 */
export async function getNextPrayer(params) {
    try {
        const { latitude, longitude, method = "MuslimWorldLeague" } = params;

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90.");
        }
        if (!longitude || longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180.");
        }

        const response = await apiClient.get("/api/prayer/next", {
            params: { latitude, longitude, method },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get prayer times for an entire month
 * @param {Object} params - Monthly prayer time parameters
 * @param {number} params.latitude - Location latitude
 * @param {number} params.longitude - Location longitude
 * @param {number} params.year - Year for calculation (2000-2100)
 * @param {number} params.month - Month for calculation (1-12)
 * @param {string} [params.method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Prayer times for each day of the month
 */
export async function getMonthlyPrayerTimes(params) {
    try {
        const { latitude, longitude, year, month, method = "MuslimWorldLeague" } = params;

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90.");
        }
        if (!longitude || longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180.");
        }
        if (!year || year < 2000 || year > 2100) {
            throw new Error("Invalid year. Must be between 2000 and 2100.");
        }
        if (!month || month < 1 || month > 12) {
            throw new Error("Invalid month. Must be between 1 and 12.");
        }

        const response = await apiClient.get("/api/prayer/monthly", {
            params: { latitude, longitude, year, month, method },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get Qibla direction (towards Kaaba in Makkah)
 * @param {Object} params - Location parameters
 * @param {number} params.latitude - Current location latitude
 * @param {number} params.longitude - Current location longitude
 * @returns {Promise<Object>} Qibla direction in degrees from North and distance to Kaaba
 */
export async function getQiblaDirection(params) {
    try {
        const { latitude, longitude } = params;

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90.");
        }
        if (!longitude || longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180.");
        }

        const response = await apiClient.get("/api/prayer/qibla", {
            params: { latitude, longitude },
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get list of available prayer time calculation methods
 * @returns {Promise<Object>} List of calculation methods with descriptions
 */
export async function getCalculationMethods() {
    try {
        const response = await apiClient.get("/api/prayer/methods");
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Get prayer times for current location (uses browser geolocation)
 * @param {string} [method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Prayer times for current location
 */
export async function getPrayerTimesForCurrentLocation(method = "MuslimWorldLeague") {
    try {
        // Get current location from browser
        const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
            });
        });

        const { latitude, longitude } = position.coords;

        return await getPrayerTimes({ latitude, longitude, method });
    } catch (error) {
        if (error.code === error.PERMISSION_DENIED) {
            throw new Error("Location permission denied. Please enable location access.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            throw new Error("Location information unavailable.");
        } else if (error.code === error.TIMEOUT) {
            throw new Error("Location request timed out.");
        }
        throw error;
    }
}

/**
 * Get next prayer for current location
 * @param {string} [method='MuslimWorldLeague'] - Calculation method
 * @returns {Promise<Object>} Next prayer information
 */
export async function getNextPrayerForCurrentLocation(method = "MuslimWorldLeague") {
    try {
        const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            });
        });

        const { latitude, longitude } = position.coords;

        return await getNextPrayer({ latitude, longitude, method });
    } catch (error) {
        if (error.code === error.PERMISSION_DENIED) {
            throw new Error("Location permission denied. Please enable location access.");
        }
        throw error;
    }
}

/**
 * Get Qibla direction for current location
 * @returns {Promise<Object>} Qibla direction information
 */
export async function getQiblaForCurrentLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            });
        });

        const { latitude, longitude } = position.coords;

        return await getQiblaDirection({ latitude, longitude });
    } catch (error) {
        if (error.code === error.PERMISSION_DENIED) {
            throw new Error("Location permission denied. Please enable location access.");
        }
        throw error;
    }
}

/**
 * Calculate time remaining until next prayer
 * @param {string} nextPrayerTime - Next prayer time in ISO format or time string
 * @returns {Object} Time remaining in hours, minutes, seconds
 */
export function calculateTimeRemaining(nextPrayerTime) {
    const now = new Date();
    const prayerTime = new Date(nextPrayerTime);
    const diff = prayerTime - now;

    if (diff < 0) {
        return { hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isPast: false };
}

/**
 * Format time remaining as string
 * @param {Object} timeRemaining - Time object from calculateTimeRemaining
 * @returns {string} Formatted time string
 */
export function formatTimeRemaining(timeRemaining) {
    const { hours, minutes, seconds, isPast } = timeRemaining;

    if (isPast) {
        return "Prayer time has passed";
    }

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (hours === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
}

/**
 * Get prayer name in readable format
 * @param {string} prayerName - Prayer name from API
 * @returns {string} Formatted prayer name
 */
export function formatPrayerName(prayerName) {
    const nameMap = {
        fajr: "Fajr",
        sunrise: "Sunrise",
        dhuhr: "Dhuhr",
        asr: "Asr",
        maghrib: "Maghrib",
        isha: "Isha",
        midnight: "Midnight",
        imsak: "Imsak",
    };

    return nameMap[prayerName?.toLowerCase()] || prayerName;
}

// Export all functions as default object
export default {
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
    formatPrayerName,
};
