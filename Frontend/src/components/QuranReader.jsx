// QuranReader.jsx - React component for reading Quran verses
import React, { useState, useEffect } from "react";
import { getSurah } from "../services/quranService";
import { surahs } from "../data/surahs";

const QuranReader = ({ initialSurah = 1, initialVerse = 1 }) => {
    const [currentSurah, setCurrentSurah] = useState(initialSurah);
    const [currentVerse, setCurrentVerse] = useState(initialVerse);
    const [surahInfo, setSurahInfo] = useState(null);
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fontSize, setFontSize] = useState("text-2xl");
    const [showTranslation, setShowTranslation] = useState(true);
    const [showTafsir, setShowTafsir] = useState(false);
    const [error, setError] = useState("");
    const [showFullSurah, setShowFullSurah] = useState(true);

    const fetchSurahData = async (surahId) => {
        setLoading(true);
        setError("");
        try {
            const response = await getSurah(surahId);
            if (response && response.surah && response.verses) {
                setSurahInfo({
                    number: response.surah.number,
                    name: response.surah.name_english,
                    name_arabic: response.surah.name_arabic,
                    english_name_translation: response.surah.name_english,
                    revelation_type: response.verses[0]?.place_of_revelation || "Unknown",
                    total_verses: response.surah.verses_count || response.verses.length,
                });

                const transformedVerses = response.verses.map((verse) => ({
                    verse_number: verse.ayah_no_surah,
                    text: verse.ayah_ar,
                    translation: verse.ayah_en,
                    juz_number: verse.juz_no,
                    page_number: verse.ruko_no || 1,
                    manzil_number: verse.manzil_no,
                    hizb_quarter: verse.hizb_quarter,
                    sajdah: verse.sajdah_ayah,
                    sajdah_number: verse.sajdah_no,
                    tafsir: null,
                }));

                setVerses(transformedVerses);
            } else {
                setVerses([]);
                setSurahInfo(null);
            }
        } catch (err) {
            console.error("Error fetching surah data:", err);
            setError(err.userMessage || err.message || "Failed to load surah data");
            setSurahInfo(null);
            setVerses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentSurah(initialSurah);
        setCurrentVerse(initialVerse);
    }, [initialSurah, initialVerse]);

    // Read URL params on mount so deep links like /quran/read?surah=5 work
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const s = params.get('surah');
                const v = params.get('verse');
                if (s) setCurrentSurah(parseInt(s, 10));
                if (v) setCurrentVerse(parseInt(v, 10));
            }
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (currentSurah) fetchSurahData(currentSurah);
    }, [currentSurah]);

    const navigateToVerse = (surahId, verseId) => {
        setCurrentSurah(surahId);
        setCurrentVerse(verseId);
        const url = new URL(window.location);
        url.searchParams.set("surah", surahId);
        url.searchParams.set("verse", verseId);
        window.history.replaceState({}, "", url);
    };

    const navigatePrevious = () => {
        if (currentVerse > 1) navigateToVerse(currentSurah, currentVerse - 1);
        else if (currentSurah > 1) {
            setCurrentSurah(currentSurah - 1);
            setCurrentVerse(1);
        }
    };

    const navigateNext = () => {
        if (currentVerse < verses.length) navigateToVerse(currentSurah, currentVerse + 1);
        else if (currentSurah < 114) navigateToVerse(currentSurah + 1, 1);
    };

    const adjustFontSize = (adjustment) => {
        const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"];
        const currentIndex = sizes.indexOf(fontSize);
        const newIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + adjustment));
        setFontSize(sizes[newIndex]);
    };

    const currentVerseData = verses.find((v) => v.verse_number === currentVerse);

    if (loading && !verses.length) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Reader Controls */}
            <div className="bg-base-200 rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Font Size Controls */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-base-content/70">Font Size:</span>
                        <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline btn-sm" onClick={() => adjustFontSize(-1)} disabled={fontSize === "text-lg"}>
                                A-
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => adjustFontSize(1)} disabled={fontSize === "text-4xl"}>
                                A+
                            </button>
                        </div>
                    </div>

                    {/* Display Options */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" />
                            <span className="text-sm">Translation</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showTafsir} onChange={(e) => setShowTafsir(e.target.checked)} className="checkbox checkbox-sm checkbox-secondary" />
                            <span className="text-sm">Tafsir</span>
                        </label>
                    </div>

                    {/* Surah Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-base-content/70">Surah:</span>
                        <select value={currentSurah} onChange={(e) => navigateToVerse(parseInt(e.target.value, 10), 1)} className="select select-bordered select-sm bg-base-100 border-white/10">
                            {surahs.filter(s => typeof s.id === 'number').map((s) => (
                                <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="alert alert-error mb-6">
                    <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Surah Header */}
            {surahInfo && (
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">{surahInfo.name}</h1>
                    <p className="text-xl text-primary font-arabic mb-2" dir="rtl">{surahInfo.name_arabic}</p>
                    <p className="text-base-content/70">{surahInfo.english_name_translation} • {surahInfo.revelation_type} • {surahInfo.total_verses} verses</p>
                </div>
            )}

            {/* Verse Display - Full Surah or Single Verse depending on toggle */}
            {verses.length > 0 && (
                <div className="bg-base-100 rounded-2xl p-6 shadow-lg mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{surahInfo?.name} • {surahInfo?.name_arabic}</h2>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" className="checkbox checkbox-sm" checked={showFullSurah} onChange={() => setShowFullSurah(!showFullSurah)} />
                                <span>Show full Surah</span>
                            </label>
                        </div>
                    </div>

                    {showFullSurah ? (
                        <div className="bg-base-200/30 rounded-xl p-6 md:p-8 lg:p-12">
                            <p className={`${fontSize} font-arabic leading-loose text-justify`} dir="rtl" style={{ fontFamily: 'Amiri, serif', lineHeight: '2.5' }}>
                                {verses.map((v, index) => (
                                    <span key={v.verse_number} className="group relative inline">
                                        <span 
                                            className="hover:bg-primary/10 rounded px-1 cursor-pointer transition-colors"
                                            onClick={() => navigateToVerse(currentSurah, v.verse_number)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            {v.text}
                                        </span>
                                        <span className="text-primary mx-1">﴿{v.verse_number}﴾</span>
                                        {index < verses.length - 1 && <span> </span>}
                                        
                                        {/* Translation tooltip - appears on hover */}
                                        {v.translation && (
                                            <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 md:w-80">
                                                <span className="block bg-base-300 p-3 rounded-lg shadow-xl text-xs md:text-sm text-base-content border border-primary/20">
                                                    {v.translation}
                                                </span>
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </p>
                        </div>
                    ) : (
                        currentVerseData && (
                            <div>
                                <div className="mb-6">
                                    <p className={`${fontSize} font-arabic leading-relaxed text-right`} dir="rtl" style={{ fontFamily: 'Amiri, serif' }}>
                                        {currentVerseData.text} <span className="text-primary/60">﴿{currentVerseData.verse_number}﴾</span>
                                    </p>
                                </div>

                                {showTranslation && currentVerseData.translation && (
                                    <div className="border-t border-base-300 pt-6 mb-6">
                                        <h3 className="text-sm font-semibold text-base-content/70 mb-3">Translation</h3>
                                        <p className="text-base-content/90 leading-relaxed">{currentVerseData.translation}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-base-300">
                                    <button onClick={navigatePrevious} disabled={currentSurah === 1 && currentVerse === 1} className="btn btn-outline btn-primary">Previous</button>
                                    <div className="text-center"><p className="text-sm text-base-content/60">Surah {currentSurah}, Verse {currentVerse}</p></div>
                                    <button onClick={navigateNext} disabled={currentSurah === 114 && currentVerse === verses.length} className="btn btn-outline btn-primary">Next</button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                <button className="btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Bookmark
                </button>

                <button className="btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                </button>

                <button className="btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Play Audio
                </button>
            </div>
        </div>
    );
};

export default QuranReader;

