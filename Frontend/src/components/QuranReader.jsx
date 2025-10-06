// QuranReader.jsx - React component for reading Quran verses
import React, { useState, useEffect } from "react";
import { getSurah, transformVerse } from "../services/quranService";

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

    // Fetch surah information and verses
    const fetchSurahData = async (surahId) => {
        setLoading(true);
        setError("");
        try {
            // Fetch complete surah data using quranService
            const response = await getSurah(surahId);

            if (response && response.surah && response.verses) {
                // Set surah metadata
                setSurahInfo({
                    number: response.surah.number,
                    name: response.surah.name_english,
                    name_arabic: response.surah.name_arabic,
                    english_name_translation: response.surah.name_english,
                    revelation_type: response.verses[0]?.place_of_revelation || "Unknown",
                    total_verses: response.surah.verses_count || response.verses.length,
                });

                // Transform verses using quranService utility
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
                    tafsir: null, // Tafsir not in current schema
                }));

                setVerses(transformedVerses);
            }
        } catch (error) {
            console.error("Error fetching surah data:", error);
            setError(error.userMessage || error.message || "Failed to load surah data");
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

    useEffect(() => {
        if (currentSurah) {
            fetchSurahData(currentSurah);
        }
    }, [currentSurah]);

    const navigateToVerse = (surahId, verseId) => {
        setCurrentSurah(surahId);
        setCurrentVerse(verseId);
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set("surah", surahId);
        url.searchParams.set("verse", verseId);
        window.history.replaceState({}, "", url);
    };

    const navigatePrevious = () => {
        if (currentVerse > 1) {
            navigateToVerse(currentSurah, currentVerse - 1);
        } else if (currentSurah > 1) {
            // Go to previous surah, need to fetch to know the last verse
            setCurrentSurah(currentSurah - 1);
            setCurrentVerse(1); // Will be adjusted when data loads
        }
    };

    const navigateNext = () => {
        if (currentVerse < verses.length) {
            navigateToVerse(currentSurah, currentVerse + 1);
        } else if (currentSurah < 114) {
            // Go to next surah
            navigateToVerse(currentSurah + 1, 1);
        }
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
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => adjustFontSize(-1)}
                                disabled={fontSize === "text-lg"}
                            >
                                A-
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => adjustFontSize(1)}
                                disabled={fontSize === "text-4xl"}
                            >
                                A+
                            </button>
                        </div>
                    </div>

                    {/* Display Options */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showTranslation}
                                onChange={(e) => setShowTranslation(e.target.checked)}
                                className="checkbox checkbox-sm checkbox-primary"
                            />
                            <span className="text-sm">Translation</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showTafsir}
                                onChange={(e) => setShowTafsir(e.target.checked)}
                                className="checkbox checkbox-sm checkbox-secondary"
                            />
                            <span className="text-sm">Tafsir</span>
                        </label>
                    </div>

                    {/* Surah Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-base-content/70">Surah:</span>
                        <select
                            value={currentSurah}
                            onChange={(e) => navigateToVerse(parseInt(e.target.value), 1)}
                            className="select select-bordered select-sm bg-base-100 border-white/10"
                        >
                            <option value={1}>1. Al-Fatihah</option>
                            <option value={2}>2. Al-Baqarah</option>
                            <option value={3}>3. Aali Imran</option>
                            <option value={4}>4. An-Nisa</option>
                            <option value={5}>5. Al-Ma'idah</option>
                            <option value={6}>6. Al-An'am</option>
                            <option value={7}>7. Al-A'raf</option>
                            <option value={8}>8. Al-Anfal</option>
                            <option value={9}>9. At-Tawbah</option>
                            <option value={10}>10. Yunus</option>
                            <option value={11}>11. Hud</option>
                            <option value={12}>12. Yusuf</option>
                            <option value={13}>13. Ar-Ra'd</option>
                            <option value={14}>14. Ibrahim</option>
                            <option value={15}>15. Al-Hijr</option>
                            <option value={16}>16. An-Nahl</option>

                            <option value={17}>17. Al-Isra</option>
                            <option value={18}>18. Al-Kahf</option>
                            <option value={19}>19. Maryam</option>
                            <option value={20}>20. Ta-Ha</option>
                            <option value={21}>21. Al-Anbiya</option>
                            <option value={22}>22. Al-Hajj</option>
                            <option value={23}>23. Al-Mu'minun</option>
                            <option value={24}>24. An-Nur</option>
                            <option value={25}>25. Al-Furqan</option>
                            <option value={26}>26. Ash-Shu'ara</option>
                            <option value={27}>27. An-Naml</option>
                            <option value={28}>28. Al-Qasas</option>
                            <option value={29}>29. Al-Ankabut</option>
                            <option value={30}>30. Ar-Rum</option>
                            <option value={31}>31. Luqman</option>
                            <option value={32}>32. As-Sajdah</option>
                            <option value={33}>33. Al-Ahzab</option>
                            <option value={34}>34. Saba</option>
                            <option value={35}>35. Fatir</option>
                            <option value={36}>36. Ya-Sin</option>
                            <option value={37}>37. As-Saffat</option>
                            <option value={38}>38. Sad</option>
                            <option value={39}>39. Az-Zumar</option>
                            <option value={40}>40. Ghafir</option>
                            <option value={41}>41. Fussilat</option>
                            <option value={42}>42. Ash-Shura</option>
                            <option value={43}>43. Az-Zukhruf</option>
                            <option value={44}>44. Ad-Dukhan</option>
                            <option value={45}>45. Al-Jathiyah</option>
                            <option value={46}>46. Al-Ahqaf</option>
                            <option value={47}>47. Muhammad</option>
                            <option value={48}>48. Al-Fath</option>
                            <option value={49}>49. Al-Hujurat</option>
                            <option value={50}>50. Qaf</option>
                            <option value={51}>51. Adh-Dhariyat</option>
                            <option value={52}>52. At-Tur</option>
                            <option value={53}>53. An-Najm</option>
                            <option value={54}>54. Al-Qamar</option>
                            <option value={55}>55. Ar-Rahman</option>
                            <option value={56}>56. Al-Waqi'ah</option>
                            <option value={57}>57. Al-Hadid</option>
                            <option value={58}>58. Al-Mujadila</option>
                            <option value={59}>59. Al-Hashr</option>
                            <option value={60}>60. Al-Mumtahanah</option>
                            <option value={61}>61. As-Saf</option>
                            <option value={62}>62. Al-Jumu'ah</option>
                            <option value={63}>63. Al-Munafiqun</option>
                            <option value={64}>64. At-Taghabun</option>
                            <option value={65}>65. At-Talaq</option>
                            <option value={66}>66. At-Tahrim</option>
                            <option value={67}>67. Al-Mulk</option>
                            <option value={68}>68. Al-Qalam</option>
                            <option value={69}>69. Al-Haqqah</option>
                            <option value={70}>70. Al-Ma'arij</option>
                            <option value={71}>71. Nuh</option>
                            <option value={72}>72. Al-Jinn</option>
                            <option value={73}>73. Al-Muzzammil</option>
                            <option value={74}>74. Al-Muddaththir</option>
                            <option value={75}>75. Al-Qiyamah</option>
                            <option value={76}>76. Al-Insan</option>
                            <option value={77}>77. Al-Mursalat</option>
                            <option value={78}>78. An-Naba</option>
                            <option value={79}>79. An-Nazi'at</option>
                            <option value={80}>80. Abasa</option>
                            <option value={81}>81. At-Takwir</option>
                            <option value={82}>82. Al-Infitar</option>
                            <option value={83}>83. Al-Mutaffifin</option>
                            <option value={84}>84. Al-Inshiqaq</option>
                            <option value={85}>85. Al-Buruj</option>
                            <option value={86}>86. At-Tariq</option>
                            <option value={87}>87. Al-A'la</option>
                            <option value={88}>88. Al-Ghashiyah</option>
                            <option value={89}>89. Al-Fajr</option>
                            <option value={90}>90. Al-Balad</option>
                            <option value={91}>91. Ash-Shams</option>
                            <option value={92}>92. Al-Layl</option>
                            <option value={93}>93. Ad-Duha</option>
                            <option value={94}>94. Ash-Sharh</option>
                            <option value={95}>95. At-Tin</option>
                            <option value={96}>96. Al-Alaq</option>
                            <option value={97}>97. Al-Qadr</option>
                            <option value={98}>98. Al-Bayyinah</option>
                            <option value={99}>99. Az-Zalzalah</option>
                            <option value={100}>100. Al-Adiyat</option>
                            <option value={101}>101. Al-Qari'ah</option>
                            <option value={102}>102. At-Takathur</option>
                            <option value={103}>103. Al-Asr</option>
                            <option value={104}>104. Al-Humazah</option>
                            <option value={105}>105. Al-Fil</option>
                            <option value={106}>106. Quraysh</option>
                            <option value={107}>107. Al-Ma'un</option>
                            <option value={108}>108. Al-Kawthar</option>
                            <option value={109}>109. Al-Kafirun</option>
                            <option value={110}>110. An-Nasr</option>
                            <option value={111}>111. Al-Masad</option>
                            <option value={112}>112. Al-Ikhlas</option>
                            <option value={113}>113. Al-Falaq</option>
                            <option value={114}>114. An-Nas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="alert alert-error mb-6">
                    <svg
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Surah Header */}
            {surahInfo && (
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">{surahInfo.name}</h1>
                    <p className="text-xl text-primary font-arabic mb-2" dir="rtl">
                        {surahInfo.name_arabic}
                    </p>
                    <p className="text-base-content/70">
                        {surahInfo.english_name_translation} • {surahInfo.revelation_type} •{" "}
                        {surahInfo.total_verses} verses
                    </p>
                </div>
            )}

            {/* Verse Display */}
            {currentVerseData && (
                <div className="bg-base-100 rounded-2xl p-8 shadow-lg mb-6">
                    {/* Verse Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-base-content">
                            Verse {currentVerseData.verse_number}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <span>Juz {currentVerseData.juz_number}</span>
                            {currentVerseData.page_number && (
                                <>
                                    <span>•</span>
                                    <span>Page {currentVerseData.page_number}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Arabic Text */}
                    <div className="mb-6">
                        <p
                            className={`${fontSize} font-arabic leading-relaxed text-base-content text-right mb-4`}
                            dir="rtl"
                            style={{ fontFamily: "Amiri, serif" }}
                        >
                            {currentVerseData.text}{" "}
                            <span className="text-primary/60">
                                ﴿{currentVerseData.verse_number}﴾
                            </span>
                        </p>
                    </div>

                    {/* Translation */}
                    {showTranslation && currentVerseData.translation && (
                        <div className="border-t border-base-300 pt-6 mb-6">
                            <h3 className="text-sm font-semibold text-base-content/70 mb-3">
                                Translation
                            </h3>
                            <p className="text-base-content/90 leading-relaxed">
                                {currentVerseData.translation}
                            </p>
                        </div>
                    )}

                    {/* Tafsir (Exegesis) */}
                    {showTafsir && currentVerseData.tafsir && (
                        <div className="border-t border-base-300 pt-6 mb-6">
                            <h3 className="text-sm font-semibold text-base-content/70 mb-3">
                                Tafsir (Explanation)
                            </h3>
                            <p className="text-base-content/80 leading-relaxed text-sm">
                                {currentVerseData.tafsir}
                            </p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t border-base-300">
                        <button
                            onClick={navigatePrevious}
                            disabled={currentSurah === 1 && currentVerse === 1}
                            className="btn btn-outline btn-primary"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Previous
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-base-content/60">
                                Surah {currentSurah}, Verse {currentVerse}
                            </p>
                        </div>

                        <button
                            onClick={navigateNext}
                            disabled={currentSurah === 114 && currentVerse === verses.length}
                            className="btn btn-outline btn-primary"
                        >
                            Next
                            <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                <button className="btn btn-outline btn-sm">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                    Bookmark
                </button>

                <button className="btn btn-outline btn-sm">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                    </svg>
                    Share
                </button>

                <button className="btn btn-outline btn-sm">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                    </svg>
                    Play Audio
                </button>
            </div>
        </div>
    );
};

export default QuranReader;
