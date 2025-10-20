import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher.jsx';

const Navbar = () => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    // Emit custom event for sidebar
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/quran/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="navbar min-h-[4.5rem] rounded-2xl border border-white/10 bg-gradient-to-r from-primary/90 via-primary/80 to-accent/80 text-primary-content shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="navbar-start gap-3">
              <button
                type="button"
                className="btn btn-circle btn-ghost bg-white/10 text-primary-content hover:bg-white/20 focus-visible:outline-2"
                onClick={toggleDrawer}
                aria-label={t('navigation.openMenu', 'Open navigation drawer')}
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor" />
                </svg>
              </button>

              <a href="/" className="flex flex-col">
                <span className="text-2xl font-semibold tracking-tight">{t('home.title')}</span>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-primary-content/70 hidden sm:block">
                  {t('home.subtitle')}
                </span>
              </a>
            </div>

            <div className="navbar-center hidden lg:flex">
              <div className="rounded-full bg-white/10 px-4 py-2">
                <ul className="menu menu-horizontal items-center gap-2 text-sm font-medium text-primary-content/90">
                  <li>
                    <a href="/" className="rounded-full px-3 py-1 hover:bg-white/20">
                      {t('navigation.prayer')}
                    </a>
                  </li>
                  <li>
                    <a href="/quran/search" className="rounded-full px-3 py-1 hover:bg-white/20">
                      {t('navigation.quran')}
                    </a>
                  </li>
                  <li>
                    <a href="/qibla" className="rounded-full px-3 py-1 hover:bg-white/20">
                      🧭 {t('navigation.qibla')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="navbar-end">
              <div className="flex items-center gap-3">
                <LanguageSwitcher />

                <label className="swap swap-rotate rounded-full bg-white/10 p-2 hover:bg-white/20">
                  <input type="checkbox" className="theme-controller absolute opacity-0" value="dark" />

                  <svg className="swap-off h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.64 17l-.71.71a1 1 0 0 0 0 1.41 1 1 0 0 0 1.41 0l.71-.71A1 1 0 0 0 5.64 17ZM5 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Zm7-7a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1Zm-6.07 1.05a1 1 0 0 0 .7.29 1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.41l-.71-.71A1 1 0 0 0 4.93 6.34Zm12 .29a1 1 0 0 0 .7-.29l.71-.71a1 1 0 1 0-1.41-1.41L17 5.64a1 1 0 0 0 0 1.41 1 1 0 0 0 .66.28ZM21 11h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2Zm-9 8a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Zm6.36-2a1 1 0 0 0-1.41 1.41l.71.71a1 1 0 0 0 1.41-1.41Z" />
                  </svg>

                  <svg className="swap-on h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73A8.15 8.15 0 0 1 9.08 5.49a8.59 8.59 0 0 1 .25-2 1 1 0 0 0-1.33-1.15A10.14 10.14 0 1 0 22 14.05a1 1 0 0 0-.36-1.05Zm-9.5 6.69A8.14 8.14 0 0 1 7.08 5.22v.27A10.15 10.15 0 0 0 17.22 15.63a9.79 9.79 0 0 0 2.1-.22 8.11 8.11 0 0 1-7.18 4.28Z" />
                  </svg>
                </label>

                <form className="max-w-md mx-auto hidden sm:block" onSubmit={handleSearch}>
                  <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
                    {t('common.search')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                      </svg>
                    </div>
                    <input
                      type="search"
                      id="default-search"
                      className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder={t('home.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="text-white absolute end-2.5 bottom-2.5 bg-primary focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary cursor-pointer"
                    >
                      {t('common.search')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search */}
      <div className="lg:hidden px-4 pb-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder={t('home.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button
              type="submit"
              className="text-white absolute end-2.5 bottom-2.5 bg-primary focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary cursor-pointer"
            >
              {t('common.search')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Navbar;