import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const I18nProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkI18nReady = () => {
      if (i18n.isInitialized) {
        setIsReady(true);
      } else {
        // Check again after a short delay
        setTimeout(checkI18nReady, 50);
      }
    };

    // Listen for i18n ready event
    const handleI18nReady = () => {
      setIsReady(true);
    };

    window.addEventListener('i18n-ready', handleI18nReady);

    // Start checking if i18n is already ready
    checkI18nReady();

    return () => {
      window.removeEventListener('i18n-ready', handleI18nReady);
    };
  }, [i18n]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 font-quran">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default I18nProvider;