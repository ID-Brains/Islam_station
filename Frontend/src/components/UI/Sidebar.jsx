import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [nextPrayer, setNextPrayer] = useState({
    name: 'Asr',
    time: '3:42 PM',
    inTime: '28 mins'
  });

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('drawer-navigation');
      const toggle = document.getElementById('drawer-toggle');
      const backdrop = document.getElementById('drawer-backdrop');

      if (sidebar && !sidebar.contains(event.target) &&
          toggle && !toggle.contains(event.target) &&
          backdrop && isOpen) {
        setIsOpen(false);
      }
    };

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    // Add event listeners
    document.addEventListener('click', handleClickOutside);
    const toggle = document.getElementById('drawer-toggle');
    if (toggle) {
      toggle.addEventListener('click', handleToggle);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (toggle) {
        toggle.removeEventListener('click', handleToggle);
      }
    };
  }, [isOpen]);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsOpen(!isOpen);
    };

    window.addEventListener('toggle-sidebar', handleToggleEvent);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleEvent);
    };
  }, [isOpen]);

  return (
    <>
      {/* Hidden checkbox for drawer state (DaisyUI pattern) */}
      <input
        type="checkbox"
        id="drawer-navigation-checkbox"
        className="drawer-toggle hidden"
        checked={isOpen}
        onChange={(e) => setIsOpen(e.target.checked)}
      />

      {/* Drawer backdrop */}
      <label
        htmlFor="drawer-navigation-checkbox"
        className={`drawer-overlay fixed inset-0 z-40 bg-black/50 transition-opacity pointer-events-none ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        id="drawer-backdrop"
      />

      {/* Drawer content */}
      <div
        id="drawer-navigation"
        className={`drawer-side fixed top-0 right-0 z-50 h-screen w-full sm:w-80 md:w-96 lg:w-[28rem] max-w-full overflow-y-auto bg-gradient-to-b from-primary/95 via-primary/90 to-neutral/90 p-4 sm:p-5 text-primary-content shadow-2xl shadow-black/30 transition-transform backdrop-blur-xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        tabIndex="-1"
        aria-labelledby="drawer-navigation-label"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-content/70">
              {t('navigation.title', 'Navigation')}
            </p>
            <h5 id="drawer-navigation-label" className="mt-1 text-lg font-semibold">
              {t('navigation.quickAccess', 'Quick Access')}
            </h5>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn-circle btn-ghost bg-white/10 text-primary-content hover:bg-white/20"
            aria-label={t('common.close', 'Close menu')}
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form className="w-full mx-auto lg:hidden mb-4 mt-4">
          <label
            htmlFor="drawer-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            {t('common.search', 'Search')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="drawer-search"
              className="block w-full p-3 pe-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={t('common.search', 'Search...')}
            />
            <button
              type="submit"
              className="text-white absolute start-2 bottom-2 bg-primary focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-primary cursor-pointer"
            >
              {t('common.search', 'Search')}
            </button>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Next Prayer Widget */}
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4 shadow-inner shadow-black/10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-content/60">
              {t('prayer.nextPrayer', 'Next Prayer')}
            </p>
            <div className="mt-2 sm:mt-3 flex items-end justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-semibold">{nextPrayer.name}</p>
                <p className="text-xs sm:text-sm text-primary-content/70">
                  {nextPrayer.time} • {t('prayer.inTime', 'In')} {nextPrayer.inTime}
                </p>
              </div>
              <span className="badge badge-secondary badge-sm sm:badge-lg">
                {t('prayer.soon', 'Soon')}
              </span>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
              <div className="rounded-lg sm:rounded-xl bg-white/10 p-1.5 sm:p-2">
                <p className="font-semibold text-[10px] sm:text-xs">{t('prayer.fajr', 'Fajr')}</p>
                <p className="text-primary-content/70 text-[10px] sm:text-xs">05:08</p>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-white/10 p-1.5 sm:p-2">
                <p className="font-semibold text-[10px] sm:text-xs">{t('prayer.dhuhr', 'Dhuhr')}</p>
                <p className="text-primary-content/70 text-[10px] sm:text-xs">12:24</p>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-white/10 p-1.5 sm:p-2">
                <p className="font-semibold text-[10px] sm:text-xs">{t('prayer.maghrib', 'Maghrib')}</p>
                <p className="text-primary-content/70 text-[10px] sm:text-xs">18:05</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="menu menu-sm sm:menu-lg rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 text-sm font-semibold">
            <p className="px-3 sm:px-4 pb-2 text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary-content/60">
              {t('navigation.dashboard', 'Dashboard')}
            </p>
            <li>
              <a
                href="/"
                className="rounded-lg sm:rounded-xl tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm"
              >
                🕌 {t('navigation.home', 'Prayer Times')}
              </a>
            </li>
            <li>
              <a
                href="/quran/search"
                className="rounded-lg sm:rounded-xl tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm"
              >
                📖 {t('navigation.quran', 'Quran Library')}
              </a>
            </li>
            <li>
              <a
                href="/qibla"
                className="rounded-lg sm:rounded-xl tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm"
              >
                🧭 {t('navigation.qibla', 'Qibla Finder')}
              </a>
            </li>
          </nav>

          {/* Preferences */}
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary-content/60">
              {t('settings.preferences', 'Preferences')}
            </p>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span>{t('settings.hijriCalendar', 'Hijri Calendar')}</span>
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm sm:toggle-md"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4 text-xs sm:text-sm">
          <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
            <li>
              <a
                href="/settings"
                className="flex items-center justify-between rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-white/10 tracking-[0.15em] sm:tracking-[0.2em] cursor-pointer text-xs sm:text-sm"
              >
                {t('navigation.settings', 'Settings')}
                <span className="badge badge-outline badge-xs sm:badge-sm">6</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;