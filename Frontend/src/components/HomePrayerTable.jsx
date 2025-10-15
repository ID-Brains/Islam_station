// HomePrayerTable.jsx - Consolidated prayer table with auto location detection and full prayer times
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getCurrentLocation, getGeolocationConfig } from "../utils/geolocationHelper";
import useLocationStorage from "../hooks/useLocationStorage";
import { getPrayerTimes } from "../services/prayerService";

// Prayer Countdown Component
const PrayerCountdown = ({ prayerTime }) => {
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        const calculateCountdown = () => {
            const now = new Date();

            // Parse 12-hour format time (e.g., "5:30 AM" or "6:45 PM")
            const timeMatch = prayerTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!timeMatch) return;

            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();

            // Convert to 24-hour format for calculation
            if (period === "PM" && hours !== 12) {
                hours += 12;
            } else if (period === "AM" && hours === 12) {
                hours = 0;
            }

            let prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);

            // If prayer time has passed today, set for tomorrow
            if (prayerDate <= now) {
                prayerDate.setDate(prayerDate.getDate() + 1);
            }

            const diff = prayerDate - now;
            const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hoursRemaining > 0) {
                setCountdown(`${hoursRemaining}h ${minutesRemaining}m`);
            } else {
                setCountdown(`${minutesRemaining}m`);
            }
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [prayerTime]);

    return <span className="text-xs font-medium">{countdown}</span>;
};

const HomePrayerTable = () => {
    // State management
    const [prayers, setPrayers] = useState([]);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [calculationMethod, setCalculationMethod] = useState("Egyptian");
    const [isLocationDetected, setIsLocationDetected] = useState(false);
    const [locationStatus, setLocationStatus] = useState("detecting");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [visitedBefore, setVisitedBefore] = useState(() => {
        try {
            return localStorage.getItem("visitedBefore") === "true";
        } catch (e) {
            return false;
        }
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        try {
            return localStorage.getItem("systemNotifications") === "true";
        } catch (e) {
            return false;
        }
    });

    // Use location storage hook for persistence
    const { location, saveLocation, isLocationValid } = useLocationStorage();
    const onNextPrayerChangeRef = useRef(null);

    // Helper to request Notification permission
    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) return false;
        try {
            const permission = await Notification.requestPermission();
            const enabled = permission === "granted";
            console.info("[Notifications] requestPermission ->", permission);
            try {
                localStorage.setItem("systemNotifications", enabled ? "true" : "false");
            } catch (e) {}
            setNotificationsEnabled(enabled);
            return enabled;
        } catch (e) {
            return false;
        }
    };

    // Initialize location detection on mount
    useEffect(() => {
        // If user hasn't visited before, request permission now
        if (!visitedBefore) {
            try {
                localStorage.setItem("visitedBefore", "true");
            } catch (e) {}
            setVisitedBefore(true);

            // Request location permission on first visit
            if (navigator.geolocation) {
                const config = getGeolocationConfig();
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        saveLocation(newLocation, { userSaved: true });
                        setIsLocationDetected(true);
                        setLocationStatus("detected");
                    },
                    (error) => {
                        setLocationStatus("default");
                    },
                    {
                        enableHighAccuracy: config.enableHighAccuracy,
                        timeout: config.timeout,
                        maximumAge: config.maximumAge,
                    },
                );
            }
        }

        // Check if method is stored in localStorage
        const storedMethod = localStorage.getItem("calculationMethod");
        if (storedMethod) {
            setCalculationMethod(storedMethod);
        }

        // If no valid stored location, try to get current location
        if (!isLocationValid()) {
            setLocationStatus("detecting");
            getCurrentLocation()
                .then((coords) => {
                    saveLocation({ lat: coords.lat, lng: coords.lng });
                    setIsLocationDetected(true);
                    setLocationStatus("detected");
                })
                .catch((error) => {
                    console.log("Could not get location:", error.message);
                    setLocationStatus("default");
                });
        } else {
            setLocationStatus("stored");
        }

        // Listen for location updates from the location button
        const handleLocationUpdate = (event) => {
            const { lat, lng } = event.detail;
            saveLocation({ lat, lng });
            setIsLocationDetected(true);
            setLocationStatus("detected");
        };

        // Listen for system notification preference changes from settings
        const handleSystemNotificationsChanged = (event) => {
            try {
                const enabled = event.detail && event.detail.enabled;
                setNotificationsEnabled(Boolean(enabled));
            } catch (e) {}
        };

        window.addEventListener("systemNotificationsChanged", handleSystemNotificationsChanged);
        window.addEventListener("locationUpdated", handleLocationUpdate);

        return () => {
            window.removeEventListener("locationUpdated", handleLocationUpdate);
            window.removeEventListener(
                "systemNotificationsChanged",
                handleSystemNotificationsChanged,
            );
        };
    }, [visitedBefore, isLocationValid, saveLocation]);

    // Fetch prayer times
    const fetchPrayerTimes = useCallback(async () => {
        if (!location) return;

        setIsLoading(true);
        setError("");

        try {
            const data = await getPrayerTimes({
                latitude: location.lat,
                longitude: location.lng,
                method: calculationMethod,
            });

            if (data && data.prayer_times) {
                const prayerTimes = data.prayer_times;

                const prayerList = [
                    {
                        name: "Imsak",
                        time: prayerTimes.imsak ? formatTime(prayerTimes.imsak) : "05:20 AM",
                    },
                    {
                        name: "Fajr",
                        time: prayerTimes.fajr ? formatTime(prayerTimes.fajr) : "05:30 AM",
                    },
                    {
                        name: "Sunrise",
                        time: prayerTimes.sunrise ? formatTime(prayerTimes.sunrise) : "06:45 AM",
                    },
                    {
                        name: "Dhuhr",
                        time: prayerTimes.dhuhr ? formatTime(prayerTimes.dhuhr) : "12:15 PM",
                    },
                    {
                        name: "Asr",
                        time: prayerTimes.asr ? formatTime(prayerTimes.asr) : "03:45 PM",
                    },
                    {
                        name: "Maghrib",
                        time: prayerTimes.maghrib ? formatTime(prayerTimes.maghrib) : "06:20 PM",
                    },
                    {
                        name: "Isha",
                        time: prayerTimes.isha ? formatTime(prayerTimes.isha) : "07:45 PM",
                    },
                ];

                setPrayers(prayerList);
            } else {
                throw new Error("Invalid prayer times data");
            }
        } catch (err) {
            console.error("Error fetching prayer times:", err);
            setError(err.userMessage || err.message || "Failed to load prayer times");
        } finally {
            setLastUpdated(new Date());
            setIsLoading(false);
        }
    }, [location, calculationMethod]);

    // Fetch prayer times when location or method changes
    useEffect(() => {
        fetchPrayerTimes();
    }, [fetchPrayerTimes]);

    // Format time to 12-hour format
    const formatTime = (time24) => {
        if (!time24 || !time24.includes(":")) return time24;
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        const m = minutes.toString().padStart(2, "0");
        return `${hour12}:${m} ${period}`;
    };

    // Calculate next prayer
    const calculateNextPrayer = useCallback(() => {
        if (prayers.length === 0) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const prayerMinutes = prayers.map((prayer) => {
            const timeMatch = prayer.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!timeMatch) return 0;

            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();

            if (period === "PM" && hours !== 12) {
                hours += 12;
            } else if (period === "AM" && hours === 12) {
                hours = 0;
            }

            return hours * 60 + minutes;
        });

        let nextIndex = prayerMinutes.findIndex((minutes) => minutes > currentMinutes);
        if (nextIndex === -1) nextIndex = 1; // Next day Fajr

        setNextPrayer(nextIndex);

        if (onNextPrayerChangeRef.current && nextIndex !== null) {
            const nextPrayerInfo = {
                name: prayers[nextIndex].name,
                time: prayers[nextIndex].time,
                minutesUntil:
                    prayerMinutes[nextIndex] - currentMinutes < 0
                        ? 24 * 60 - currentMinutes + prayerMinutes[nextIndex]
                        : prayerMinutes[nextIndex] - currentMinutes,
            };
            onNextPrayerChangeRef.current(nextPrayerInfo);
        }
    }, [prayers]);

    // Calculate next prayer every minute
    useEffect(() => {
        calculateNextPrayer();
        const interval = setInterval(calculateNextPrayer, 60000);
        return () => clearInterval(interval);
    }, [calculateNextPrayer]);

    // Get location badge
    const getLocationBadge = () => {
        switch (locationStatus) {
            case "detecting":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-warning/20 text-warning px-3 py-1 rounded-full">
                        <span className="loading loading-spinner loading-xs"></span>
                        Detecting location...
                    </span>
                );
            case "detected":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-success/20 text-success px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Using your location
                    </span>
                );
            case "stored":
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-info/20 text-info px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        Saved location
                    </span>
                );
            case "default":
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-xs bg-base-300 text-base-content/60 px-3 py-1 rounded-full">
                        Default location (Riyadh)
                    </span>
                );
        }
    };

    // Get prayer status
    const getPrayerStatus = (index) => {
        if (nextPrayer === null) return "Loading";
        if (index === nextPrayer) return "Next";
        if (index < nextPrayer) return "Completed";
        return "Upcoming";
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case "Next":
                return "bg-primary text-primary-content";
            case "Completed":
                return "bg-base-300 text-base-content";
            case "Upcoming":
                return "bg-base-200";
            default:
                return "bg-base-200";
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4 text-base-content/70">Calculating prayer times...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <svg
                    className="w-16 h-16 mx-auto text-error/30 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <p className="text-error mb-2">{error}</p>
                <button onClick={fetchPrayerTimes} className="btn btn-primary btn-sm">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Next Prayer Notification */}
            {showNotification && nextPrayer !== null && (
                <div className="relative animate-fade-in">
                    <div className="alert bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-l-4 border-primary shadow-lg">
                        <div className="flex-1">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/20 p-3 rounded-xl">
                                    <svg
                                        className="w-8 h-8 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-primary mb-1">
                                        Next Prayer: {prayers[nextPrayer]?.name}
                                    </h3>
                                    <p className="text-base-content/80 text-sm">
                                        <span className="font-semibold text-lg">
                                            {prayers[nextPrayer]?.time}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    aria-label="Close notification"
                                >
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-content">Today's Prayer Times</h3>
                {getLocationBadge()}
            </div>

            {/* Location and Method Info */}
            <div className="mb-4 p-3 bg-base-100 rounded-lg">
                <div className="flex items-center justify-between text-sm text-base-content/70">
                    <span>
                        Location: {location?.lat?.toFixed(4)}, {location?.lng?.toFixed(4)}
                    </span>
                    <span>Method: {calculationMethod}</span>
                    {lastUpdated && <span>Updated: {lastUpdated.toLocaleTimeString()}</span>}
                </div>
            </div>

            {/* Prayer Times Table */}
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Prayer</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Countdown</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prayers.map((prayer, index) => {
                            const status = getPrayerStatus(index);
                            const statusColor = getStatusColor(status);

                            return (
                                <tr key={prayer.name} className={`${statusColor} transition-colors`}>
                                    <td className="font-medium">{prayer.name}</td>
                                    <td className="font-mono">{prayer.time}</td>
                                    <td>
                                        <span className="badge badge-ghost">{status}</span>
                                    </td>
                                    <td>
                                        {(status === "Next" || status === "Upcoming") && (
                                            <PrayerCountdown prayerTime={prayer.time} />
                                        )}
                                        {status === "Completed" && (
                                            <span className="text-xs opacity-70">Completed</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Refresh Button */}
            <div className="mt-4 text-center">
                <button onClick={fetchPrayerTimes} className="btn btn-outline btn-sm">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                    </svg>
                    Refresh Prayer Times
                </button>
            </div>

            {!isLocationDetected && (
                <div className="alert alert-info">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-current shrink-0 w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>
                    <div>
                        <h3 className="font-bold">Using default location</h3>
                        <div className="text-xs">
                            Click "Get Your Location" above or visit Prayer Settings to set your
                            location for accurate prayer times.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePrayerTable;
