import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import quranBookmarkManager from '../utils/QuranBookmarkManager.js';
import localStorageManager from '../utils/LocalStorageManager.js';

const EnhancedQuranReader = ({ surahId, initialAyah = 1, mode = 'continuous' }) => {
  const { t, i18n } = useTranslation();
  const [surah, setSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(localStorageManager.get('fontSize', 'medium'));
  const [showTranslation, setShowTranslation] = useState(localStorageManager.get('showTranslation', true));
  const [showTransliteration, setShowTransliteration] = useState(localStorageManager.get('showTransliteration', false));
  const [currentAyah, setCurrentAyah] = useState(initialAyah);
  const [readingMode, setReadingMode] = useState(mode);
  const [bookmarkedVerses, setBookmarkedVerses] = useState(new Set());
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [bookmarkCategory, setBookmarkCategory] = useState('favorites');
  const [readingProgress, setReadingProgress] = useState(0);

  const containerRef = useRef(null);

  // Font size mapping
  const fontSizeClasses = {
    small: 'font-quran-small',
    medium: 'font-quran-medium',
    large: 'font-quran-large'
  };

  // Fetch Surah data
  useEffect(() => {
    if (surahId) {
      fetchSurah();
    }
  }, [surahId]);

  // Track reading progress
  useEffect(() => {
    if (verses.length > 0) {
      const progress = (currentAyah / verses.length) * 100;
      setReadingProgress(progress);
      updateReadingProgressBar(progress);

      // Save last read verse
      quranBookmarkManager.setLastReadVerse(surahId, currentAyah);
    }
  }, [currentAyah, verses.length]);

  // Load bookmarked verses
  useEffect(() => {
    const bookmarks = quranBookmarkManager.getBookmarksBySurah(surahId);
    const bookmarkedSet = new Set(
      bookmarks.map(b => `${b.surahId}:${b.ayahNumber}`)
    );
    setBookmarkedVerses(bookmarkedSet);
  }, [surahId]);

  const fetchSurah = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Surah metadata
      const surahResponse = await fetch(`${window.API_BASE || 'http://localhost:8000'}/api/quran/surahs/${surahId}`);
      const surahData = await surahResponse.json();
      setSurah(surahData);

      // Fetch verses
      const versesResponse = await fetch(`${window.API_BASE || 'http://localhost:8000'}/api/quran/surahs/${surahId}/verses`);
      const versesData = await versesResponse.json();
      setVerses(versesData.ayahs || []);

    } catch (err) {
      console.error('Error fetching Surah:', err);
      setError(t('errors.apiError'));
    } finally {
      setLoading(false);
    }
  };

  const updateReadingProgressBar = (progress) => {
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress / 100})`;
    }
  };

  const handleBookmark = (ayahNumber) => {
    const bookmarkKey = `${surahId}:${ayahNumber}`;

    if (bookmarkedVerses.has(bookmarkKey)) {
      // Remove bookmark
      const bookmark = quranBookmarkManager.getBookmarksBySurah(surahId)
        .find(b => b.ayahNumber === ayahNumber);
      if (bookmark) {
        quranBookmarkManager.removeBookmark(bookmark.id);
        setBookmarkedVerses(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookmarkKey);
          return newSet;
        });
      }
    } else {
      // Add bookmark
      setCurrentAyah(ayahNumber);
      setShowBookmarkModal(true);
    }
  };

  const saveBookmark = () => {
    quranBookmarkManager.addBookmark({
      surahId,
      ayahNumber: currentAyah,
      note: bookmarkNote,
      category: bookmarkCategory,
      surahName: surah?.surah_name_ar,
      ayahText: verses.find(v => v.ayah_no_surah === currentAyah)?.ayah_ar
    });

    const bookmarkKey = `${surahId}:${currentAyah}`;
    setBookmarkedVerses(prev => new Set([...prev, bookmarkKey]));

    // Reset modal
    setShowBookmarkModal(false);
    setBookmarkNote('');
    setBookmarkCategory('favorites');
  };

  const renderVerse = (verse) => {
    const isBasmalah = verse.ayah_no_surah === 1 && verse.ayah_no_quran !== 1;
    const isBookmarked = bookmarkedVerses.has(`${surahId}:${verse.ayah_no_surah}`);

    return (
      <div key={verse.ayah_no_quran} className="quran-verse animate-fade-in">
        {/* Verse Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="verse-number">
            {t('quran.ayah')} {verse.ayah_no_surah}
          </span>
          <div className="flex gap-2">
            {/* Bookmark Button */}
            <button
              onClick={() => handleBookmark(verse.ayah_no_surah)}
              className={`p-2 rounded-full transition-all ${
                isBookmarked
                  ? 'bg-islamic-gold text-white animate-pulse-gold'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-islamic-gold hover:text-white'
              }`}
              title={isBookmarked ? t('quran.removeBookmark') : t('quran.bookmark')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>

            {/* Share Button */}
            <button
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-islamic-blue hover:text-white transition-all"
              title={t('quran.share')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632 3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Basmalah */}
        {isBasmalah && (
          <div className="basmalah">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}

        {/* Arabic Text */}
        <div className="quran-verse arabic font-quran">
          {verse.ayah_ar}
        </div>

        {/* Transliteration */}
        {showTransliteration && verse.transliteration && (
          <div className="quran-verse transliteration">
            {verse.transliteration}
          </div>
        )}

        {/* Translation */}
        {showTranslation && verse.ayah_en && (
          <div className="quran-verse translation">
            {verse.ayah_en}
          </div>
        )}

        {/* Verse Metadata */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <span>ج {verse.juz_no}</span>
            <span>ح {verse.ruko_no || '-'}</span>
            <span>منزل {verse.manzil_no || '-'}</span>
          </div>
          <span>الآية {verse.ayah_no_quran} من {6236}</span>
        </div>
      </div>
    );
  };

  const renderPagedView = () => {
    const versesPerPage = 20;
    const currentPage = Math.ceil(currentAyah / versesPerPage);
    const startIndex = (currentPage - 1) * versesPerPage;
    const endIndex = Math.min(startIndex + versesPerPage, verses.length);
    const currentVerses = verses.slice(startIndex, endIndex);

    return (
      <div>
        {/* Page Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentAyah(Math.max(1, currentAyah - versesPerPage))}
            disabled={currentPage === 1}
            className="btn btn-outline"
          >
            {t('common.previous')}
          </button>
          <span className="text-lg font-quran">
            {t('quran.page')} {currentPage}
          </span>
          <button
            onClick={() => setCurrentAyah(Math.min(verses.length, currentAyah + versesPerPage))}
            disabled={endIndex >= verses.length}
            className="btn btn-outline"
          >
            {t('common.next')}
          </button>
        </div>

        {/* Current Page Verses */}
        <div className="space-y-4">
          {currentVerses.map(renderVerse)}
        </div>
      </div>
    );
  };

  const renderVerseByVerseView = () => {
    const currentVerse = verses.find(v => v.ayah_no_surah === currentAyah);

    return (
      <div>
        {/* Verse Navigation */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setCurrentAyah(Math.max(1, currentAyah - 1))}
            disabled={currentAyah <= 1}
            className="btn btn-outline"
          >
            {t('common.previous')}
          </button>
          <div className="text-center">
            <div className="verse-number">
              {t('quran.ayah')} {currentAyah}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('quran.of')} {verses.length}
            </div>
          </div>
          <button
            onClick={() => setCurrentAyah(Math.min(verses.length, currentAyah + 1))}
            disabled={currentAyah >= verses.length}
            className="btn btn-outline"
          >
            {t('common.next')}
          </button>
        </div>

        {/* Current Verse */}
        {currentVerse && (
          <div className="max-w-3xl mx-auto">
            {renderVerse(currentVerse)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-islamic-green"></span>
          <p className="mt-4 font-quran">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-islamic-red text-6xl mb-4">⚠️</div>
          <p className="text-lg font-quran text-islamic-red">{error}</p>
          <button onClick={fetchSurah} className="btn btn-primary mt-4">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--quran-bg)' }}>
      {/* Reading Progress Bar */}
      <div className="reading-progress"></div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Surah Header */}
        {surah && (
          <div className="surah-header mb-8 animate-slide-in">
            <h1 className="surah-name">{surah.surah_name_ar}</h1>
            <div className="surah-meaning">{surah.surah_name_en}</div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <span>{verses.length} {t('quran.ayahs')}</span>
              <span>•</span>
              <span>{surah.place_of_revelation === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}</span>
              <span>•</span>
              <span>{t('quran.revelation')}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {/* Reading Mode */}
          <select
            value={readingMode}
            onChange={(e) => setReadingMode(e.target.value)}
            className="select select-bordered"
          >
            <option value="continuous">{t('quran.continuous')}</option>
            <option value="paged">{t('quran.paged')}</option>
            <option value="verse-by-verse">{t('quran.verseByVerse')}</option>
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              localStorageManager.set('fontSize', e.target.value);
            }}
            className="select select-bordered"
          >
            <option value="small">{t('settings.small')}</option>
            <option value="medium">{t('settings.medium')}</option>
            <option value="large">{t('settings.large')}</option>
          </select>

          {/* Show Translation */}
          <button
            onClick={() => {
              setShowTranslation(!showTranslation);
              localStorageManager.set('showTranslation', !showTranslation);
            }}
            className={`btn ${showTranslation ? 'btn-primary' : 'btn-outline'}`}
          >
            {t('quran.translation')}
          </button>

          {/* Show Transliteration */}
          <button
            onClick={() => {
              setShowTransliteration(!showTransliteration);
              localStorageManager.set('showTransliteration', !showTransliteration);
            }}
            className={`btn ${showTransliteration ? 'btn-primary' : 'btn-outline'}`}
          >
            {t('quran.transliteration')}
          </button>
        </div>

        {/* Quran Content */}
        <div ref={containerRef} className={`font-quran ${fontSizeClasses[fontSize]}`}>
          {readingMode === 'continuous' && (
            <div className="space-y-4">
              {verses.map(renderVerse)}
            </div>
          )}
          {readingMode === 'paged' && renderPagedView()}
          {readingMode === 'verse-by-verse' && renderVerseByVerseView()}
        </div>

        {/* Bookmark Modal */}
        {showBookmarkModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-md">
              <h3 className="font-bold text-lg mb-4">
                {t('quran.addBookmark')}
              </h3>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{t('quran.category')}</span>
                </label>
                <select
                  value={bookmarkCategory}
                  onChange={(e) => setBookmarkCategory(e.target.value)}
                  className="select select-bordered w-full"
                >
                  {quranBookmarkManager.getBookmarkCategories().map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{t('quran.note')}</span>
                </label>
                <textarea
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  className="textarea textarea-bordered h-24"
                  placeholder={t('quran.addNoteOptional')}
                ></textarea>
              </div>

              <div className="modal-action">
                <button onClick={saveBookmark} className="btn btn-primary">
                  {t('common.save')}
                </button>
                <button
                  onClick={() => setShowBookmarkModal(false)}
                  className="btn"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedQuranReader;