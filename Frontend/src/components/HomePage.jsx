import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomePrayerTable from './HomePrayerTable.jsx';

const HomePage = () => {
  const { t } = useTranslation();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error

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

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem]"></div>

      {/* Hero Section */}
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-28 lg:flex-row lg:items-center lg:gap-20">
        <div className="flex-1 space-y-8">
          <h1 className="text-balance text-4xl font-black leading-tight text-base-content md:text-5xl xl:text-6xl tracking-[0.2em]">
            {t('home.prayerTimes')}
          </h1>

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
                  {t('location.set')}
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

          <div className="flex-1 flex items-stretch">
            <div className="relative w-full">
              <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-primary/40 via-transparent to-secondary/40 blur-3xl"></div>
              <div className="relative h-full rounded-[2.5rem] border border-white/20 bg-base-100/80 p-6 dark:shadow-2xl dark:shadow-black/20 backdrop-blur-xl flex flex-col">
                <div className="flex-1 rounded-3xl bg-base-200/80 p-5 shadow-inner flex flex-col justify-between">
                  <img
                    src="/masjed.png"
                    alt={t('mosques.title')}
                    className="rounded-2xl w-full object-cover mb-4"
                  />
                  <div className="space-y-3 mt-auto">
                    <p
                      id="quran-text"
                      className="text-base md:text-lg text-base-content/80 font-arabic text-right leading-loose"
                      dir="rtl"
                    >
                      {t('common.loading')}...
                    </p>
                    <p
                      id="ayah-text"
                      className="text-xs md:text-sm text-base-content/60 font-arabic text-right"
                      dir="rtl"
                    >
                      {t('common.loading')}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;