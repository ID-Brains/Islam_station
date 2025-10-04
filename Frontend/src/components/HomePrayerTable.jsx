// HomePrayerTable.jsx - Home page prayer table with auto location detection
import React, { useState, useEffect } from 'react';
import EnhancedPrayerTable from './EnhancedPrayerTable.jsx';

const HomePrayerTable = () => {
  const [location, setLocation] = useState({ lat: 24.7136, lng: 46.6753 });
  const [calculationMethod, setCalculationMethod] = useState('Egyptian');
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [locationStatus, setLocationStatus] = useState('detecting');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [visitedBefore, setVisitedBefore] = useState(() => {
    try {
      return localStorage.getItem('visitedBefore') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('systemNotifications') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Helper to request Notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      console.info('[Notifications] requestPermission ->', permission);
      try { localStorage.setItem('systemNotifications', enabled ? 'true' : 'false'); } catch (e) {}
      setNotificationsEnabled(enabled);
      return enabled;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // If user hasn't visited before, prompt for location permission now.
    // On subsequent visits (refreshes), we'll show the next-prayer notification
    // once the next prayer time is available.
    if (!visitedBefore) {
      try {
        // mark as visited so future loads show the notification
        localStorage.setItem('visitedBefore', 'true');
      } catch (e) {
        // ignore
      }
      setVisitedBefore(true);

      // Prompt for location permission so the browser asks the user immediately
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(newLocation);
            setIsLocationDetected(true);
            setLocationStatus('detected');
            // Store location for future use
            try { localStorage.setItem('userLocation', JSON.stringify(newLocation)); } catch (e) {}
          },
          (error) => {
            // user denied or error — just keep default
            setLocationStatus('default');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
        // Also request notification permission proactively (user-friendly prompt)
        // but only if not already decided
        try {
          const stored = localStorage.getItem('systemNotifications');
          if (stored === null && 'Notification' in window) {
            // ask for permission but don't force — we'll prompt the user briefly
            // call requestNotificationPermission but don't await here to avoid blocking
            requestNotificationPermission();
          }
        } catch (e) {}
      }
    }

    // Check if location is stored in localStorage
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setLocation({ lat: parsed.lat, lng: parsed.lng });
        setIsLocationDetected(true);
        setLocationStatus('stored');
        return;
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
    }

    // Check if method is stored in localStorage
    const storedMethod = localStorage.getItem('calculationMethod');
    if (storedMethod) {
      setCalculationMethod(storedMethod);
    }

    // If no stored location, try to get current location
    setLocationStatus('detecting');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          setIsLocationDetected(true);
          setLocationStatus('detected');
          // Store location for future use
          localStorage.setItem('userLocation', JSON.stringify(newLocation));
        },
        (error) => {
          console.log('Could not get location:', error.message);
          setLocationStatus('default');
          // Keep default location (Riyadh, Saudi Arabia)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationStatus('default');
    }

    // Listen for location updates from the location button
    const handleLocationUpdate = (event) => {
      const { lat, lng } = event.detail;
      setLocation({ lat, lng });
      setIsLocationDetected(true);
      setLocationStatus('detected');
    };

    // Listen for system notification preference changes from settings
    const handleSystemNotificationsChanged = (event) => {
      try {
        const enabled = event.detail && event.detail.enabled;
        setNotificationsEnabled(Boolean(enabled));
      } catch (e) {}
    };

    window.addEventListener('systemNotificationsChanged', handleSystemNotificationsChanged);

    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
      window.removeEventListener('systemNotificationsChanged', handleSystemNotificationsChanged);
    };
  }, []);

  const getLocationBadge = () => {
    switch (locationStatus) {
      case 'detecting':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-warning/20 text-warning px-3 py-1 rounded-full">
            <span className="loading loading-spinner loading-xs"></span>
            Detecting location...
          </span>
        );
      case 'detected':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-success/20 text-success px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Using your location
          </span>
        );
      case 'stored':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-info/20 text-info px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Saved location
          </span>
        );
      case 'default':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-base-300 text-base-content/60 px-3 py-1 rounded-full">
            Default location (Riyadh)
          </span>
        );
    }
  };

  const handleNextPrayerChange = (prayerInfo) => {
    setNextPrayer(prayerInfo);
    // If the user has visited before (refresh), show the notification when next prayer becomes available
    if (visitedBefore) {
      try {
        const today = new Date().toDateString();
        const lastNotified = localStorage.getItem('lastPrayerNotification');

        // Only show the notification if we haven't shown/dismissed it today
        if (lastNotified !== today) {
          // Try to show system notification if enabled
          const showSystem = (() => {
            try {
              return localStorage.getItem('systemNotifications') === 'true';
            } catch (e) { return false; }
          })();

          if (showSystem && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const title = `Next Prayer: ${prayerInfo.name}`;
              const body = `${prayerInfo.time} — in ${prayerInfo.minutesUntil < 60 ? `${prayerInfo.minutesUntil}m` : `${Math.floor(prayerInfo.minutesUntil/60)}h ${prayerInfo.minutesUntil%60}m`}`;
              const n = new Notification(title, {
                body,
                icon: '/pwa-192x192.svg',
                tag: 'next-prayer'
              });
              // clicking the notification should focus the window
              n.onclick = () => { window.focus(); n.close(); };
              // Persist that we notified today
              localStorage.setItem('lastPrayerNotification', today);
            } catch (e) {
              // Fall back to in-app notification
              setShowNotification(true);
              localStorage.setItem('lastPrayerNotification', today);
            }
          } else if (showSystem && 'Notification' in window && Notification.permission !== 'granted') {
            // If user previously enabled system notifications flag but didn't give permission,
            // try requesting permission once more, then show in-app if denied.
            requestNotificationPermission().then((granted) => {
              if (granted) {
                try {
                  const title = `Next Prayer: ${prayerInfo.name}`;
                  const body = `${prayerInfo.time} — in ${prayerInfo.minutesUntil < 60 ? `${prayerInfo.minutesUntil}m` : `${Math.floor(prayerInfo.minutesUntil/60)}h ${prayerInfo.minutesUntil%60}m`}`;
                  const n = new Notification(title, { body, icon: '/pwa-192x192.svg', tag: 'next-prayer' });
                  n.onclick = () => { window.focus(); n.close(); };
                  localStorage.setItem('lastPrayerNotification', today);
                } catch (e) {
                  setShowNotification(true);
                  localStorage.setItem('lastPrayerNotification', today);
                }
              } else {
                setShowNotification(true);
                localStorage.setItem('lastPrayerNotification', today);
              }
            });
          } else {
            // No system notifications requested or supported — fall back to in-app
            setShowNotification(true);
            localStorage.setItem('lastPrayerNotification', today);
          }
        }
      } catch (e) {
        // If localStorage is not available, fall back to in-memory show
        setShowNotification(true);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Next Prayer Notification */}
      {showNotification && nextPrayer && (
        <div className="relative animate-fade-in">
          <div className="alert bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-l-4 border-primary shadow-lg">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-primary mb-1">Next Prayer: {nextPrayer.name}</h3>
                  <p className="text-base-content/80 text-sm">
                    <span className="font-semibold text-lg">{nextPrayer.time}</span>
                    <span className="ml-2 text-base-content/60">
                      ({nextPrayer.minutesUntil < 60 
                        ? `in ${nextPrayer.minutesUntil} minutes` 
                        : `in ${Math.floor(nextPrayer.minutesUntil / 60)}h ${nextPrayer.minutesUntil % 60}m`})
                    </span>
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    May Allah accept your prayers 🤲
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowNotification(false);
                    try {
                      // Persist dismissal for today so repeated callbacks won't re-open it
                      const today = new Date().toDateString();
                      localStorage.setItem('lastPrayerNotification', today);
                    } catch (e) {}
                  }}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Close notification"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
      
      <EnhancedPrayerTable
        latitude={location.lat}
        longitude={location.lng}
        calculationMethod={calculationMethod}
        onNextPrayerChange={handleNextPrayerChange}
      />
      
      {!isLocationDetected && (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">Using default location</h3>
            <div className="text-xs">Click "Get Your Location" above or visit Prayer Settings to set your location for accurate prayer times.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePrayerTable;
