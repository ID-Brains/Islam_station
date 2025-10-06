/**
 * Get_location.js - Location button handler
 * Uses the LocationService utility for improved cross-platform support
 *
 * This script provides a simple UI for the location button while delegating
 * all location logic to the LocationService utility.
 */

// Import LocationService from utils
// Note: This will be loaded as a module in the component that uses it

// For now, we'll create a simplified version that works with the button
// The React components should use the LocationService directly

function getLocation() {
    const button = document.getElementById("location");

    // Check if geolocation is supported
    if (!navigator.geolocation) {
        updateButton(
            button,
            "error",
            "Not Supported",
            `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`,
        );
        return;
    }

    // Update button to show loading state
    updateButton(
        button,
        "loading",
        "Getting Location...",
        `<span class="loading loading-spinner loading-sm"></span>`,
    );

    // Configuration with improved defaults
    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // Always get fresh location
    };

    // Request location
    navigator.geolocation.getCurrentPosition(
        (position) => handleSuccess(position, button),
        (error) => handleError(error, button),
        options,
    );
}

/**
 * Handle successful location retrieval
 * @param {GeolocationPosition} position
 * @param {HTMLElement} button
 */
function handleSuccess(position, button) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
        handleError(
            {
                code: "INVALID_COORDINATES",
                message: "Invalid coordinates received",
            },
            button,
        );
        return;
    }

    // Check accuracy (warn if > 5km)
    if (accuracy > 5000) {
        console.warn(`Location accuracy is low: ${Math.round(accuracy)}m`);
        // Still use it but inform the user
    }

    // Store location in localStorage
    const locationData = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        timestamp: Date.now(),
    };

    try {
        localStorage.setItem("userLocation", JSON.stringify(locationData));
    } catch (e) {
        console.warn("Failed to save location to localStorage:", e);
        // Continue anyway - not critical
    }

    // Update button to show success
    updateButton(
        button,
        "success",
        "Location Set!",
        `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>`,
    );

    // Dispatch custom event for React components
    window.dispatchEvent(
        new CustomEvent("locationUpdated", {
            detail: {
                lat: latitude,
                lng: longitude,
                accuracy: accuracy,
                timestamp: Date.now(),
            },
        }),
    );

    // Reload page after delay (consider removing this for better UX)
    // Components should listen to the locationUpdated event instead
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

/**
 * Handle location errors
 * @param {GeolocationPositionError} error
 * @param {HTMLElement} button
 */
function handleError(error, button) {
    let errorMessage = "Error";
    let detailedMessage = "";

    if (error.code === 1 || error.code === "PERMISSION_DENIED") {
        errorMessage = "Permission Denied";
        detailedMessage = "Please enable location access in your browser settings";
    } else if (error.code === 2 || error.code === "POSITION_UNAVAILABLE") {
        errorMessage = "Location Unavailable";
        detailedMessage = "Could not determine your location";
    } else if (error.code === 3 || error.code === "TIMEOUT") {
        errorMessage = "Request Timed Out";
        detailedMessage = "Location request took too long";
    } else if (error.code === "INVALID_COORDINATES") {
        errorMessage = "Invalid Location";
        detailedMessage = "Received invalid coordinates";
    } else {
        errorMessage = "Unknown Error";
        detailedMessage = error.message || "An unknown error occurred";
    }

    console.error("Geolocation error:", detailedMessage);

    // Update button to show error
    updateButton(
        button,
        "error",
        errorMessage,
        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    );

    // Reset button after a delay
    setTimeout(() => {
        updateButton(
            button,
            "default",
            "Get Your Location",
            `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>`,
        );
    }, 3000);
}

/**
 * Update button state and content
 * @param {HTMLElement} button
 * @param {string} state - 'loading', 'success', 'error', 'default'
 * @param {string} text
 * @param {string} icon
 */
function updateButton(button, state, text, icon) {
    if (!button) return;

    // Update content
    button.innerHTML = `${icon} <span class="ml-2">${text}</span>`;

    // Remove all state classes
    button.classList.remove("btn-disabled", "btn-success", "btn-error", "btn-loading");

    // Add appropriate state class
    switch (state) {
        case "loading":
            button.classList.add("btn-disabled", "btn-loading");
            button.disabled = true;
            break;
        case "success":
            button.classList.add("btn-success");
            button.disabled = false;
            break;
        case "error":
            button.classList.add("btn-error");
            button.disabled = false;
            break;
        default:
            button.disabled = false;
    }
}

/**
 * Validate coordinates
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
function isValidCoordinates(lat, lng) {
    return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

/**
 * Check permission state (if supported)
 * @returns {Promise<string>}
 */
async function checkPermissionState() {
    try {
        if ("permissions" in navigator) {
            const result = await navigator.permissions.query({ name: "geolocation" });
            return result.state; // 'granted', 'denied', or 'prompt'
        }
    } catch (error) {
        // iOS Safari doesn't support permissions API
        console.debug("Permissions API not supported");
    }
    return "prompt";
}

/**
 * Initialize location button on page load
 */
function initLocationButton() {
    const button = document.getElementById("location");
    if (!button) return;

    // Check if we have stored location
    try {
        const stored = localStorage.getItem("userLocation");
        if (stored) {
            const data = JSON.parse(stored);
            const age = Date.now() - (data.timestamp || 0);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (age < maxAge && isValidCoordinates(data.lat, data.lng)) {
                // We have a recent valid location
                updateButton(
                    button,
                    "success",
                    "Location Saved",
                    `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>`,
                );
            }
        }
    } catch (error) {
        console.debug("Could not check stored location:", error);
    }

    // Check permission state
    checkPermissionState().then((state) => {
        if (state === "denied") {
            updateButton(
                button,
                "error",
                "Permission Denied",
                `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`,
            );
        }
    });
}

// Initialize on DOMContentLoaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLocationButton);
} else {
    initLocationButton();
}

// Export for module use
if (typeof module !== "undefined" && module.exports) {
    module.exports = { getLocation, checkPermissionState, isValidCoordinates };
}
