// HomePrayerTable.jsx - Home page prayer table with auto location detection
import React, { useState, useEffect } from 'react';
import EnhancedPrayerTable from './EnhancedPrayerTable.jsx';

const HomePrayerTable = () => {
  const [location, setLocation] = useState({ lat: 24.7136, lng: 46.6753 });
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [locationStatus, setLocationStatus] = useState('detecting');

  useEffect(() => {
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

    window.addEventListener('locationUpdated', handleLocationUpdate);

    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">Today's Prayer Times</h3>
        {getLocationBadge()}
      </div>
      
      <EnhancedPrayerTable
        latitude={location.lat}
        longitude={location.lng}
        calculationMethod={calculationMethod}
        onNextPrayerChange={() => {}}
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
