// PrayerSettings.jsx - React component for prayer calculation methods and settings
import React, { useState, useEffect } from 'react';

const PrayerSettings = ({ onLocationChange, onMethodChange }) => {
  const [currentLocation, setCurrentLocation] = useState({ lat: 24.7136, lng: 46.6753 });
  const [selectedMethod, setSelectedMethod] = useState('MuslimWorldLeague');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [adjustments, setAdjustments] = useState({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  });

  // Prayer calculation methods
  const prayerMethods = [
    {
      id: 'MuslimWorldLeague',
      name: 'Muslim World League',
      description: 'Most widely used method, recommended for Europe and Americas'
    },
    {
      id: 'UmmAlQura',
      name: 'Umm al-Qura',
      description: 'Used in Saudi Arabia, later Maghrib time'
    },
    {
      id: 'Egyptian',
      name: 'Egyptian General Authority',
      description: 'Used in Egypt and parts of Africa'
    },
    {
      id: 'Karachi',
      name: 'University of Karachi',
      description: 'Used in Pakistan, Bangladesh, India'
    },
    {
      id: 'Tehran',
      name: 'Institute of Geophysics',
      description: 'Used in Iran and some Shia communities'
    },
    {
      id: 'Gulf',
      name: 'Gulf Region',
      description: 'Used in Gulf countries (except Saudi Arabia)'
    },
    {
      id: 'Moonsighting',
      name: 'Moonsighting Committee',
      description: 'Global moonsighting method'
    },
    {
      id: 'NorthAmerica',
      name: 'Islamic Society of North America',
      description: 'Specifically for North America'
    }
  ];

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setCurrentLocation(newLocation);
        setIsGettingLocation(false);
        setUseManualLocation(false);

        // Notify parent component
        if (onLocationChange) {
          onLocationChange(latitude, longitude);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle manual location change
  const handleManualLocationChange = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError('Please enter valid latitude and longitude coordinates');
      return;
    }

    const newLocation = { lat, lng };
    setCurrentLocation(newLocation);
    setLocationError('');

    // Notify parent component
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  // Handle method change
  const handleMethodChange = (method) => {
    setSelectedMethod(method);

    // Notify parent component
    if (onMethodChange) {
      onMethodChange(method);
    }
  };

  // Handle adjustment changes
  const handleAdjustmentChange = (prayer, value) => {
    setAdjustments(prev => ({
      ...prev,
      [prayer]: parseInt(value) || 0
    }));
  };

  // Toggle manual location
  const toggleManualLocation = () => {
    setUseManualLocation(!useManualLocation);
    if (!useManualLocation) {
      // When switching to manual, pre-fill current location
      setManualLocation({
        lat: currentLocation.lat.toString(),
        lng: currentLocation.lng.toString()
      });
    }
  };

  useEffect(() => {
    // Initialize with default location
    if (onLocationChange) {
      onLocationChange(currentLocation.lat, currentLocation.lng);
    }
    if (onMethodChange) {
      onMethodChange(selectedMethod);
    }
  }, []);

  return (
    <div className="bg-base-200 rounded-2xl p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Prayer Settings
      </h2>

      {/* Location Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-base-content mb-4">Location</h3>

        <div className="space-y-4">
          {/* Current Location Display */}
          <div className="bg-base-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Current Location</p>
                <p className="font-mono text-sm">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="btn btn-primary btn-sm"
                  aria-label="Get current location"
                >
                  {isGettingLocation ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Get'
                  )}
                </button>

                <button
                  onClick={() => {
                    // copy coords to clipboard for convenience
                    navigator.clipboard?.writeText(`${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
                  }}
                  className="btn btn-ghost btn-sm"
                  title="Copy coordinates"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Manual Location Toggle */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Use manual coordinates</span>
              <input
                type="checkbox"
                checked={useManualLocation}
                onChange={toggleManualLocation}
                className="toggle toggle-primary"
              />
            </label>
          </div>

          {/* Manual Location Input */}
          {useManualLocation && (
            <div className="bg-base-100 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    value={manualLocation.lat}
                    onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                    className="input input-bordered input-sm bg-base-200"
                    placeholder="24.7136"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    value={manualLocation.lng}
                    onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                    className="input input-bordered input-sm bg-base-200"
                    placeholder="46.6753"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleManualLocationChange}
                  className="btn btn-secondary btn-sm"
                >
                  Update Location
                </button>
                <button
                  onClick={() => setManualLocation({ lat: '', lng: '' })}
                  className="btn btn-ghost btn-sm"
                >
                  Clear
                </button>
                <p className="text-xs text-base-content/60 ml-auto">Enter coordinates and press Update</p>
              </div>
            </div>
          )}

          {/* Location Error */}
          {locationError && (
            <div className="alert alert-error alert-sm">
              <svg className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{locationError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Method */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-base-content mb-4">Calculation Method</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className="select select-bordered"
            value={selectedMethod}
            onChange={(e) => handleMethodChange(e.target.value)}
            aria-label="Select prayer calculation method"
          >
            {prayerMethods.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <div className="p-3 bg-base-100 rounded-xl">
            <p className="font-medium">{prayerMethods.find(p => p.id === selectedMethod)?.name}</p>
            <p className="text-sm text-base-content/60">{prayerMethods.find(p => p.id === selectedMethod)?.description}</p>
          </div>
        </div>
      </div>

      {/* Prayer Time Adjustments */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-base-content mb-4">Prayer Time Adjustments</h3>

        <div className="bg-base-100 rounded-xl p-4 space-y-3">
          <p className="text-sm text-base-content/60 mb-3">
            Adjust prayer times by minutes (positive for later, negative for earlier)
          </p>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(adjustments).map(([prayer, adjustment]) => (
              <div key={prayer} className="flex items-center justify-between p-2">
                <div>
                  <span className="capitalize font-medium">{prayer}</span>
                  <p className="text-xs text-base-content/60">minutes offset</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustmentChange(prayer, adjustment - 1)}
                    className="btn btn-outline btn-xs"
                    aria-label={`Decrease ${prayer}`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-16 text-center"
                    value={adjustment}
                    onChange={(e) => handleAdjustmentChange(prayer, parseInt(e.target.value) || 0)}
                  />
                  <button
                    onClick={() => handleAdjustmentChange(prayer, adjustment + 1)}
                    className="btn btn-outline btn-xs"
                    aria-label={`Increase ${prayer}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setAdjustments({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 })}
              className="btn btn-ghost btn-sm"
            >
              Reset adjustments
            </button>
            <p className="text-xs text-base-content/60 ml-auto">Use the inputs to fine-tune times</p>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div>
        <h3 className="text-lg font-semibold text-base-content mb-4">Additional Settings</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Show Hanafi Asr time</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-secondary"
              onChange={() => { /* controlled toggle placeholder */ }}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Show midnight time</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-secondary"
              onChange={() => { /* controlled toggle placeholder */ }}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Use 12-hour format</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-secondary"
              defaultChecked
              onChange={() => { /* controlled toggle placeholder */ }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default PrayerSettings;