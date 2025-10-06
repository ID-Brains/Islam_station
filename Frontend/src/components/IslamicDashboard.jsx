// IslamicDashboard.jsx - Comprehensive dashboard using all API services
import React, { useState, useEffect } from "react";
import {
    getRandomVerse,
    getPrayerTimesForCurrentLocation,
    getNextPrayer,
    getNearbyMosquesFromCurrentLocation,
    getDhikrForCurrentTime,
} from "../services";

const IslamicDashboard = () => {
    // State management
    const [randomVerse, setRandomVerse] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [nearbyMosques, setNearbyMosques] = useState([]);
    const [dailyDhikr, setDailyDhikr] = useState(null);
    const [loading, setLoading] = useState({
        verse: false,
        prayer: false,
        mosques: false,
        dhikr: false,
    });
    const [errors, setErrors] = useState({});

    // Load random verse
    const loadRandomVerse = async () => {
        try {
            setLoading((prev) => ({ ...prev, verse: true }));
            const data = await getRandomVerse();
            setRandomVerse(data.verse);
            setErrors((prev) => ({ ...prev, verse: null }));
        } catch (error) {
            console.error("Error loading verse:", error);
            setErrors((prev) => ({
                ...prev,
                verse: error.userMessage || error.message,
            }));
        } finally {
            setLoading((prev) => ({ ...prev, verse: false }));
        }
    };

    // Load prayer times
    const loadPrayerTimes = async () => {
        try {
            setLoading((prev) => ({ ...prev, prayer: true }));
            const [times, next] = await Promise.all([
                getPrayerTimesForCurrentLocation(),
                getNextPrayer(),
            ]);
            setPrayerTimes(times);
            setNextPrayer(next);
            setErrors((prev) => ({ ...prev, prayer: null }));
        } catch (error) {
            console.error("Error loading prayer times:", error);
            setErrors((prev) => ({
                ...prev,
                prayer: error.userMessage || error.message,
            }));
        } finally {
            setLoading((prev) => ({ ...prev, prayer: false }));
        }
    };

    // Load nearby mosques
    const loadNearbyMosques = async () => {
        try {
            setLoading((prev) => ({ ...prev, mosques: true }));
            const data = await getNearbyMosquesFromCurrentLocation(5000);
            setNearbyMosques(data.results || data.mosques || []);
            setErrors((prev) => ({ ...prev, mosques: null }));
        } catch (error) {
            console.error("Error loading mosques:", error);
            setErrors((prev) => ({
                ...prev,
                mosques: error.userMessage || error.message,
            }));
        } finally {
            setLoading((prev) => ({ ...prev, mosques: false }));
        }
    };

    // Load daily dhikr
    const loadDailyDhikr = async () => {
        try {
            setLoading((prev) => ({ ...prev, dhikr: true }));
            const data = await getDhikrForCurrentTime(1);
            setDailyDhikr(data.dhikr || data.results?.[0] || data);
            setErrors((prev) => ({ ...prev, dhikr: null }));
        } catch (error) {
            console.error("Error loading dhikr:", error);
            setErrors((prev) => ({
                ...prev,
                dhikr: error.userMessage || error.message,
            }));
        } finally {
            setLoading((prev) => ({ ...prev, dhikr: false }));
        }
    };

    // Load all data on mount
    useEffect(() => {
        loadRandomVerse();
        loadPrayerTimes();
        loadNearbyMosques();
        loadDailyDhikr();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 p-6">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-base-content mb-2">
                        Islamic Dashboard
                    </h1>
                    <p className="text-base-content/70">
                        Your comprehensive Islamic resource hub
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Random Verse Card */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title text-primary">
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                    Verse of the Day
                                </h2>
                                <button
                                    onClick={loadRandomVerse}
                                    className="btn btn-circle btn-sm btn-ghost"
                                    disabled={loading.verse}
                                >
                                    <svg
                                        className={`w-5 h-5 ${loading.verse ? "animate-spin" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {loading.verse && !randomVerse && (
                                <div className="flex justify-center py-8">
                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                </div>
                            )}

                            {errors.verse && (
                                <div className="alert alert-error">
                                    <span>{errors.verse}</span>
                                </div>
                            )}

                            {randomVerse && !loading.verse && (
                                <div>
                                    <div className="mb-2 text-sm text-base-content/60">
                                        Surah {randomVerse.surah_no || randomVerse.surah_number}:{" "}
                                        {randomVerse.surah_name_en || randomVerse.surah_name} - Verse{" "}
                                        {randomVerse.ayah_no_surah || randomVerse.verse_number}
                                    </div>
                                    <p
                                        className="text-2xl text-right mb-4 leading-loose font-arabic"
                                        dir="rtl"
                                        style={{ fontFamily: "Amiri, serif" }}
                                    >
                                        {randomVerse.ayah_ar || randomVerse.text}
                                    </p>
                                    <p className="text-base-content/80 leading-relaxed">
                                        {randomVerse.ayah_en || randomVerse.translation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prayer Times Card */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title text-secondary">
                                    <svg
                                        className="w-6 h-6"
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
                                    Prayer Times
                                </h2>
                                <button
                                    onClick={loadPrayerTimes}
                                    className="btn btn-circle btn-sm btn-ghost"
                                    disabled={loading.prayer}
                                >
                                    <svg
                                        className={`w-5 h-5 ${loading.prayer ? "animate-spin" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {loading.prayer && !prayerTimes && (
                                <div className="flex justify-center py-8">
                                    <span className="loading loading-spinner loading-lg text-secondary"></span>
                                </div>
                            )}

                            {errors.prayer && (
                                <div className="alert alert-error">
                                    <span>{errors.prayer}</span>
                                </div>
                            )}

                            {nextPrayer && (
                                <div className="alert alert-info mb-4">
                                    <div>
                                        <div className="font-semibold">
                                            Next Prayer: {nextPrayer.name || nextPrayer.prayer}
                                        </div>
                                        <div className="text-sm">
                                            Time remaining:{" "}
                                            {nextPrayer.timeRemaining || nextPrayer.time_remaining}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {prayerTimes && !loading.prayer && (
                                <div className="space-y-2">
                                    {Object.entries(prayerTimes.times || prayerTimes).map(
                                        ([name, time]) => {
                                            if (typeof time !== "string") return null;
                                            const isNext =
                                                nextPrayer?.name?.toLowerCase() ===
                                                name.toLowerCase();
                                            return (
                                                <div
                                                    key={name}
                                                    className={`flex justify-between items-center p-3 rounded-lg ${
                                                        isNext
                                                            ? "bg-secondary/10 border-2 border-secondary"
                                                            : "bg-base-200"
                                                    }`}
                                                >
                                                    <span className="font-medium capitalize">
                                                        {name}
                                                    </span>
                                                    <span className="font-mono">{time}</span>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Dhikr Card */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title text-accent">
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                    Daily Dhikr
                                </h2>
                                <button
                                    onClick={loadDailyDhikr}
                                    className="btn btn-circle btn-sm btn-ghost"
                                    disabled={loading.dhikr}
                                >
                                    <svg
                                        className={`w-5 h-5 ${loading.dhikr ? "animate-spin" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {loading.dhikr && !dailyDhikr && (
                                <div className="flex justify-center py-8">
                                    <span className="loading loading-spinner loading-lg text-accent"></span>
                                </div>
                            )}

                            {errors.dhikr && (
                                <div className="alert alert-error">
                                    <span>{errors.dhikr}</span>
                                </div>
                            )}

                            {dailyDhikr && !loading.dhikr && (
                                <div>
                                    <p
                                        className="text-xl text-right mb-3 leading-loose font-arabic"
                                        dir="rtl"
                                        style={{ fontFamily: "Amiri, serif" }}
                                    >
                                        {dailyDhikr.text_arabic ||
                                            dailyDhikr.dhikr_ar ||
                                            dailyDhikr.arabic}
                                    </p>
                                    {dailyDhikr.transliteration && (
                                        <p className="text-sm text-base-content/60 mb-2 italic">
                                            {dailyDhikr.transliteration}
                                        </p>
                                    )}
                                    <p className="text-base-content/80 leading-relaxed mb-3">
                                        {dailyDhikr.text_english ||
                                            dailyDhikr.dhikr_en ||
                                            dailyDhikr.translation}
                                    </p>
                                    {dailyDhikr.repetitions && (
                                        <div className="badge badge-accent">
                                            Repeat {dailyDhikr.repetitions}x
                                        </div>
                                    )}
                                    {dailyDhikr.reference && (
                                        <p className="text-xs text-base-content/50 mt-2">
                                            Source: {dailyDhikr.reference}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nearby Mosques Card */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title text-info">
                                    <svg
                                        className="w-6 h-6"
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
                                    Nearby Mosques
                                </h2>
                                <button
                                    onClick={loadNearbyMosques}
                                    className="btn btn-circle btn-sm btn-ghost"
                                    disabled={loading.mosques}
                                >
                                    <svg
                                        className={`w-5 h-5 ${loading.mosques ? "animate-spin" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {loading.mosques && nearbyMosques.length === 0 && (
                                <div className="flex justify-center py-8">
                                    <span className="loading loading-spinner loading-lg text-info"></span>
                                </div>
                            )}

                            {errors.mosques && (
                                <div className="alert alert-error">
                                    <span>{errors.mosques}</span>
                                </div>
                            )}

                            {nearbyMosques.length > 0 && !loading.mosques && (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {nearbyMosques.slice(0, 5).map((mosque, index) => (
                                        <div
                                            key={mosque.id || index}
                                            className="p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                                        >
                                            <div className="font-medium">
                                                {mosque.name || mosque.mosque_name}
                                            </div>
                                            <div className="text-sm text-base-content/60">
                                                {mosque.address || mosque.city}
                                            </div>
                                            {mosque.distance && (
                                                <div className="text-xs text-base-content/50 mt-1">
                                                    {typeof mosque.distance === "number"
                                                        ? `${(mosque.distance / 1000).toFixed(1)} km`
                                                        : mosque.distance}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {nearbyMosques.length === 0 && !loading.mosques && !errors.mosques && (
                                <div className="text-center py-8 text-base-content/60">
                                    No mosques found nearby. Try enabling location access.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a
                        href="/quran/read"
                        className="btn btn-outline btn-primary gap-2 justify-start"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                        Read Quran
                    </a>
                    <a
                        href="/quran/search"
                        className="btn btn-outline btn-secondary gap-2 justify-start"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        Search Quran
                    </a>
                    <a
                        href="/prayer"
                        className="btn btn-outline btn-accent gap-2 justify-start"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Prayer Times
                    </a>
                    <a href="/mosque" className="btn btn-outline btn-info gap-2 justify-start">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                        </svg>
                        Find Mosques
                    </a>
                </div>
            </div>
        </div>
    );
};

export default IslamicDashboard;
