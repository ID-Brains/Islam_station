// PrayerSettingsPage.jsx - Wrapper component that manages location state
import React, { useState, useEffect, useCallback } from 'react';
import PrayerSettings from './PrayerSettings.jsx';
import EnhancedPrayerTable from './EnhancedPrayerTable.jsx';

const PrayerSettingsPage = () => {
  const [location, setLocation] = useState({ lat: 24.7136, lng: 46.6753 });
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [prayerAdjustments, setPrayerAdjustments] = useState({});
  const [isLocationDetected, setIsLocationDetected] = useState(false);

  // Try to get user's location on mount
  useEffect(() => {
    // Check if location is stored in localStorage
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setLocation({ lat: parsed.lat, lng: parsed.lng });
        setIsLocationDetected(true);
        return;
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
    }

    // If no stored location, try to get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          setIsLocationDetected(true);
          // Store location for future use
          localStorage.setItem('userLocation', JSON.stringify(newLocation));
        },
        (error) => {
          console.log('Could not get location:', error.message);
          // Keep default location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, []);

  // Handle location change from PrayerSettings
  const handleLocationChange = useCallback((lat, lng) => {
    const newLocation = { lat, lng };
    setLocation(newLocation);
    setIsLocationDetected(true);
    // Store location for future use
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
  }, []);

  // Handle method change from PrayerSettings
  const handleMethodChange = useCallback((method) => {
    setCalculationMethod(method);
    // Store method preference
    localStorage.setItem('calculationMethod', method);
  }, []);

  // Handle adjustments change from PrayerSettings
  const handleAdjustmentsChange = useCallback((adjustments) => {
    setPrayerAdjustments(adjustments);
    // Store adjustments
    localStorage.setItem('prayerAdjustments', JSON.stringify(adjustments));
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    const savedMethod = localStorage.getItem('calculationMethod');
    if (savedMethod) {
      setCalculationMethod(savedMethod);
    }

    const savedAdjustments = localStorage.getItem('prayerAdjustments');
    if (savedAdjustments) {
      try {
        setPrayerAdjustments(JSON.parse(savedAdjustments));
      } catch (e) {
        console.error('Error parsing saved adjustments:', e);
      }
    }
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Settings Column */}
      <div className="lg:col-span-1">
        <PrayerSettings
          onLocationChange={handleLocationChange}
          onMethodChange={handleMethodChange}
          onAdjustmentsChange={handleAdjustmentsChange}
        />
      </div>

      {/* Prayer Times Column */}
      <div className="lg:col-span-2">
        <div className="bg-base-200 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Prayer Times
            {isLocationDetected && (
              <span className="ml-auto text-xs bg-success/20 text-success px-3 py-1 rounded-full">
                Using Your Location
              </span>
            )}
          </h2>

          <EnhancedPrayerTable
            latitude={location.lat}
            longitude={location.lng}
            calculationMethod={calculationMethod}
            prayerAdjustments={prayerAdjustments}
          />
        </div>
      </div>
    </div>
  );
};

export default PrayerSettingsPage;
