import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HomePrayerTable from './HomePrayerTable.jsx';
import quranBookmarkManager from '../utils/QuranBookmarkManager.js';

const HomePage = () => {
  const { t } = useTranslation();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [randomAyah, setRandomAyah] = useState(null);
  const [loadingAyah, setLoadingAyah] = useState(true);
  const [readingProgress, setReadingProgress] = useState(null);

  const handleLocationClick = async () => {
    if (locationLoading) return;

    setLocationLoading(true);
    setLocationStatus('loading');

    try {
      // Import LocationService dynamically
      const locationService = await import('../utils/LocationService.js').then(m => m.default);
      const location = await locationService.getLocation();

      setLocationStatus('success');
      // Reload page after delay to update prayer times
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Location error:', error);
      setLocationStatus('error');
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch random ayah
  useEffect(() => {
    fetchRandomAyah();
    fetchReadingProgress();
  }, []);

  const fetchRandomAyah = async () => {
    try {
      setLoadingAyah(true);
      const response = await fetch(`${window.API_BASE || 'http://localhost:8000'}/api/quran/random`);
      const data = await response.json();
      setRandomAyah(data);
    } catch (error) {
      console.error('Error fetching random ayah:', error);
    } finally {
      setLoadingAyah(false);
    }
  };

  const fetchReadingProgress = () => {
    const progress = quranBookmarkManager.getReadingProgress();
    setReadingProgress(progress);
  };

  const handleBookmarkRandomAyah = () => {
    if (randomAyah) {
      quranBookmarkManager.addBookmark({
        surahId: randomAyah.surah_id,
        ayahNumber: randomAyah.ayah_no_surah,
        category: 'favorites',
        note: 'Random ayah from homepage',
        surahName: randomAyah.surah_name_ar,
        ayahText: randomAyah.ayah_ar
      });

      // Update UI to show bookmarked state
      setTimeout(() => {
        fetchReadingProgress();
      }, 100);
    }
  };

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem]"></div>

      {/* Hero Section */}
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-28 lg:flex-row lg:items-center lg:gap-20">
        <div className="flex-1 space-y-8">
          <h1 className="text-balance text-4xl font-black leading-tight text-base-content md:text-5xl xl:text-6xl tracking-[0.2em] font-quran">
            {t('home.title')}
          </h1>
          <p className="text-xl text-base-content/80 font-quran">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              id="location"
              onClick={handleLocationClick}
              disabled={locationLoading}
              className="btn btn-primary btn-lg gap-2"
            >
              {locationStatus === 'loading' ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t('common.loading')}
                </>
              ) : locationStatus === 'success' ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('home.locationSet')}
                </>
              ) : locationStatus === 'error' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {t('common.retry')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {t('home.changeLocation')}
                </>
              )}
            </button>
            <a href="/prayer/settings" className="btn btn-secondary btn-lg gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {t('prayer.prayerSettings')}
            </a>
          </div>

          <div className="card glass border border-white/15 dark:shadow-lg">
            <div className="card-body">
              <HomePrayerTable />
            </div>
          </div>
        </div>

        {/* Enhanced Quran Display */}
        <div className="flex-1">
          <div className="relative w-full">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-islamic-green/20 via-transparent to-islamic-gold/20 blur-3xl"></div>

            {/* Beautiful Quran Container */}
            <div className="relative h-full rounded-[2.5rem] border border-white/20 bg-base-100/80 dark:shadow-2xl dark:shadow-black/20 backdrop-blur-xl overflow-hidden islamic-pattern-border">

              {/* Quran Header */}
              <div className="bg-gradient-to-r from-islamic-green to-islamic-blue p-4 text-white">
                <h2 className="text-xl font-quran text-center">{t('home.todaysAyah')}</h2>
                <div className="flex justify-center items-center gap-4 mt-2">
                  <button
                    onClick={fetchRandomAyah}
                    className="btn btn-sm btn-ghost btn-circle text-white hover:bg-white/20"
                    title={t('quran.refresh')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <span className="text-sm opacity-90">
                    {randomAyah ? `${t('quran.surah')} ${randomAyah.surah_name_ar}` : ''}
                  </span>
                </div>
              </div>

              {/* Quran Content */}
              <div className="p-6">
                {loadingAyah ? (
                  <div className="text-center py-8">
                    <span className="loading loading-spinner loading-lg text-islamic-green"></span>
                    <p className="mt-4 font-quran">{t('common.loading')}</p>
                  </div>
                ) : randomAyah ? (
                  <div className="space-y-6">
                    {/* Verse Number */}
                    <div className="text-center">
                      <span className="verse-number">
                        {t('quran.ayah')} {randomAyah.ayah_no_surah}
                      </span>
                    </div>

                    {/* Arabic Text */}
                    <div className="quran-verse arabic font-quran-large text-center">
                      {randomAyah.ayah_ar}
                    </div>

                    {/* Translation */}
                    <div className="quran-verse translation text-center italic">
                      {randomAyah.ayah_en}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleBookmarkRandomAyah}
                        className="btn btn-outline btn-sm gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        {t('quran.bookmark')}
                      </button>
                      <button
                        className="btn btn-outline btn-sm gap-2"
                        onClick={() => window.location.href = `/quran/read?surah=${randomAyah.surah_id}&ayah=${randomAyah.ayah_no_surah}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332-.523 4.5-1.747z" />
                        </svg>
                        {t('quran.readMore')}
                      </button>
                    </div>

                    {/* Verse Metadata */}
                    <div className="flex justify-center items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span>ج {randomAyah.juz_no}</span>
                      <span>•</span>
                      <span>{randomAyah.surah_name_en}</span>
                      <span>•</span>
                      <span>{randomAyah.revelation_place === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-islamic-red text-4xl mb-4">⚠️</div>
                    <p className="text-lg font-quran text-islamic-red">{t('errors.apiError')}</p>
                    <button onClick={fetchRandomAyah} className="btn btn-primary mt-4">
                      {t('common.retry')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reading Progress Card */}
          {readingProgress && readingProgress.totalBookmarks > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-base-200/50 rounded-xl">
                <div className="text-2xl font-bold text-islamic-green">
                  {readingProgress.totalBookmarks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quran.bookmarks')}
                </div>
              </div>
              <div className="text-center p-4 bg-base-200/50 rounded-xl">
                <div className="text-2xl font-bold text-islamic-blue">
                  {readingProgress.memorizedVerses}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quran.memorized')}
                </div>
              </div>
              <div className="text-center p-4 bg-base-200/50 rounded-xl">
                <div className="text-2xl font-bold text-islamic-gold">
                  {readingProgress.recentlyActive}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quran.active')}
                </div>
              </div>
              <div className="text-center p-4 bg-base-200/50 rounded-xl">
                <div className="text-2xl font-bold text-islamic-purple">
                  {readingProgress.bookmarkCategories}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quran.categories')}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;