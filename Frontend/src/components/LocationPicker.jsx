// LocationPicker.jsx - Location selection component with geolocation and manual input
import React, { useState, useEffect } from "react";

const LocationPicker = ({ onLocationChange, initialLocation = null }) => {
    const [location, setLocation] = useState(initialLocation);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualLat, setManualLat] = useState("");
    const [manualLng, setManualLng] = useState("");
    const [permissionState, setPermissionState] = useState("unknown");

    // Check stored location on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("userLocation");
            if (stored) {
                const data = JSON.parse(stored);
                const age = Date.now() - (data.timestamp || 0);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (age < maxAge && isValidCoordinates(data.lat, data.lng)) {
                    setLocation(data);
                    if (onLocationChange) {
                        onLocationChange(data);
                    }
                }
            }
        } catch (err) {
            console.debug("Could not load stored location:", err);
        }

        // Check permission state
        checkPermissionState();
    }, []);

    // Check geolocation permission state
    const checkPermissionState = async () => {
        try {
            if ("permissions" in navigator) {
                const result = await navigator.permissions.query({ name: "geolocation" });
                setPermissionState(result.state);

                // Listen for permission changes
                result.addEventListener("change", () => {
                    setPermissionState(result.state);
                });
            }
        } catch (err) {
            // iOS Safari doesn't support permissions API
            setPermissionState("prompt");
        }
    };

    // Validate coordinates
    const isValidCoordinates = (lat, lng) => {
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
    };

    // Get location using browser geolocation
    const getGeolocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setShowManualInput(true);
            return;
        }

        setLoading(true);
        setError("");

        const options = {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000, // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now(),
                };

                if (!isValidCoordinates(locationData.lat, locationData.lng)) {
                    setError("Received invalid coordinates. Please try manual input.");
                    setShowManualInput(true);
                    setLoading(false);
                    return;
                }

                // Save to state and localStorage
                setLocation(locationData);
                try {
                    localStorage.setItem("userLocation", JSON.stringify(locationData));
                } catch (err) {
                    console.warn("Failed to save location:", err);
                }

                // Notify parent component
                if (onLocationChange) {
                    onLocationChange(locationData);
                }

                setLoading(false);
            },
            (err) => {
                setLoading(false);

                // Try with more permissive settings
                const fallbackOptions = {
                    enableHighAccuracy: false,
                    timeout: 30000,
                    maximumAge: 600000, // 10 minutes
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationData = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: Date.now(),
                        };

                        setLocation(locationData);
                        try {
                            localStorage.setItem("userLocation", JSON.stringify(locationData));
                        } catch (e) {
                            console.warn("Failed to save location:", e);
                        }

                        if (onLocationChange) {
                            onLocationChange(locationData);
                        }
                    },
                    (fallbackErr) => {
                        handleGeolocationError(fallbackErr);
                    },
                    fallbackOptions
                );
            },
            options
        );
    };

    // Handle geolocation errors
    const handleGeolocationError = (err) => {
        let message = "";

        switch (err.code) {
            case 1: // PERMISSION_DENIED
                message = "Location access denied. Enable in browser settings or use manual input.";
                setShowManualInput(true);
                break;
            case 2: // POSITION_UNAVAILABLE
                message = "Location unavailable. Please use manual input or try again later.";
                setShowManualInput(true);
                break;
            case 3: // TIMEOUT
                message = "Location request timed out. Check your connection or use manual input.";
                setShowManualInput(true);
                break;
            default:
                message = "Unable to get location. Please use manual input.";
                setShowManualInput(true);
        }

        setError(message);
    };

    // Handle manual location input
    const handleManualSubmit = (e) => {
        e.preventDefault();

        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (!isValidCoordinates(lat, lng)) {
            setError("Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.");
            return;
        }

        const locationData = {
            lat,
            lng,
            accuracy: null,
            timestamp: Date.now(),
            manual: true,
        };

        setLocation(locationData);
        try {
            localStorage.setItem("userLocation", JSON.stringify(locationData));
        } catch (err) {
            console.warn("Failed to save location:", err);
        }

        if (onLocationChange) {
            onLocationChange(locationData);
        }

        setShowManualInput(false);
        setError("");
        setManualLat("");
        setManualLng("");
    };

    // Clear stored location
    const clearLocation = () => {
        setLocation(null);
        try {
            localStorage.removeItem("userLocation");
        } catch (err) {
            console.warn("Failed to clear location:", err);
        }
        if (onLocationChange) {
            onLocationChange(null);
        }
        setError("");
    };

    return (
        <div className="location-picker">
            {/* Current Location Display */}
            {location && (
                <div className="alert alert-success mb-4">
                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <div className="font-semibold">Location Set</div>
                                <div className="text-sm opacity-80">
                                    Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                                    {location.manual && " (Manual)"}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={clearLocation}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Clear location"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="alert alert-warning mb-4">
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Geolocation Button */}
            {!location && (
                <div className="flex flex-col gap-3">
                    <button
                        onClick={getGeolocation}
                        disabled={loading || permissionState === "denied"}
                        className="btn btn-primary gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Getting Location...</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span>
                                    {permissionState === "denied"
                                        ? "Location Access Denied"
                                        : "Use My Location"}
                                </span>
                            </>
                        )}
                    </button>

                    {permissionState === "denied" && (
                        <div className="text-sm text-base-content/70 text-center">
                            Please enable location in your browser settings
                        </div>
                    )}

                    {/* Manual Input Toggle */}
                    <button
                        onClick={() => setShowManualInput(!showManualInput)}
                        className="btn btn-ghost btn-sm"
                    >
                        {showManualInput ? "Hide Manual Input" : "Enter Location Manually"}
                    </button>
                </div>
            )}

            {/* Manual Input Form */}
            {showManualInput && !location && (
                <form onSubmit={handleManualSubmit} className="card bg-base-200 p-4 mt-4">
                    <h3 className="font-semibold mb-3">Enter Coordinates</h3>
                    <div className="form-control mb-3">
                        <label className="label">
                            <span className="label-text">Latitude (-90 to 90)</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            className="input input-bordered"
                            placeholder="e.g., 40.7128"
                            required
                        />
                    </div>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Longitude (-180 to 180)</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            className="input input-bordered"
                            placeholder="e.g., -74.0060"
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary flex-1">
                            Set Location
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowManualInput(false)}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="mt-3 text-xs text-base-content/60">
                        <p>💡 Tip: You can find your coordinates on Google Maps by right-clicking your location</p>
                    </div>
                </form>
            )}
        </div>
    );
};

export default LocationPicker;
