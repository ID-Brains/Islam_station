import { useEffect, useState, useCallback, useMemo } from 'react';

const EnhancedPrayerTable = ({
  latitude = 24.7136,
  longitude = 46.6753,
  calculationMethod = 'MuslimWorldLeague',
  prayerAdjustments = {},
  onNextPrayerChange
}) => {
  const [prayers, setPrayers] = useState([]);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [location, setLocation] = useState({ lat: latitude, lng: longitude });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Update location when props change
  useEffect(() => {
    setLocation({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  // Prayer calculation methods configurations (memoized to avoid infinite fetch loop)
  const calculationMethods = useMemo(() => ({
    MuslimWorldLeague: { fajr: 18, isha: 17 },
    Egyptian: { fajr: 19.5, isha: 17.5 },
    UmmAlQura: { fajr: 18.5, isha: '90 min after maghrib' },
    UniversityOfIslamicSciences: { fajr: 18, isha: 18 },
    UAE: { fajr: 19.2, isha: '90 min after maghrib' },
    Kuwait: { fajr: 18, isha: 17.5 },
    Qatar: { fajr: 18, isha: '90 min after maghrib' },
    Singapore: { fajr: 20, isha: 18 },
    NorthAmerica: { fajr: 15, isha: 15 },
    Turkey: { fajr: 18, isha: 17 }
  }), []);

  // Calculate prayer times using simplified method
  const calculatePrayerTimes = useCallback((lat, lng, method, date = new Date()) => {
    try {
      const methodConfig = calculationMethods[method] || calculationMethods.MuslimWorldLeague;

      // Simplified calculation for demo
      // In production, use a proper prayer calculation library
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);

      // Calculate basic times (simplified)
      const baseTimes = {
        fajr: calculateTime(5, 30 + methodConfig.fajr / 10, dayOfYear),
        sunrise: calculateTime(6, 45, dayOfYear),
        dhuhr: calculateTime(12, 15, dayOfYear),
        asr: calculateTime(15, 45, dayOfYear),
        maghrib: calculateTime(18, 20, dayOfYear),
        isha: calculateTime(19, 45 + (methodConfig.isha === '90 min after maghrib' ? 1.5 : methodConfig.isha / 10), dayOfYear)
      };

      // Apply prayer adjustments
      const adjustedTimes = {};
      Object.keys(baseTimes).forEach(prayer => {
        const adjustment = prayerAdjustments[prayer] || 0;
        adjustedTimes[prayer] = adjustTime(baseTimes[prayer], adjustment);
      });

      return {
        imsak: adjustTime(adjustedTimes.fajr, -10),
        ...adjustedTimes
      };
    } catch (error) {
      console.error('Error calculating prayer times:', error);
      return null;
    }
  }, [calculationMethods, prayerAdjustments]);

  // Helper function to calculate prayer time
  const calculateTime = useCallback((baseHour, baseMinute, dayOfYear) => {
    // Simplified calculation - in production use proper astronomical calculations
    const seasonalAdjustment = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.5; // ±30 minutes
    const hour = Math.floor(baseHour + seasonalAdjustment);
    const minute = Math.floor(baseMinute + (seasonalAdjustment * 60) % 60);

    return formatTime(hour, minute);
  }, []);

  // Helper function to adjust time by minutes
  const adjustTime = useCallback((time, adjustment) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + adjustment;

    let adjustedHours = Math.floor(totalMinutes / 60);
    let adjustedMinutes = totalMinutes % 60;

    if (adjustedHours >= 24) adjustedHours -= 24;
    if (adjustedHours < 0) adjustedHours += 24;

    return formatTime(adjustedHours, adjustedMinutes);
  }, []);

  // Helper function to format time
  const formatTime = useCallback((hours, minutes) => {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  // Fetch prayer times
  const fetchPrayerTimes = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Try to fetch from API first
      const apiResponse = await fetch(
        `http://localhost:8000/api/prayer/pTimes?latitude=${location.lat}&longitude=${location.lng}&method=${calculationMethod}`
      );

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const prayerTimes = data.prayer_times;

        const prayerList = [
          { name: 'Imsak', time: prayerTimes.imsak || calculateTime(5, 20) },
          { name: 'Fajr', time: prayerTimes.fajr || calculateTime(5, 30) },
          { name: 'Sunrise', time: prayerTimes.sunrise || calculateTime(6, 45) },
          { name: 'Dhuhr', time: prayerTimes.dhuhr || calculateTime(12, 15) },
          { name: 'Asr', time: prayerTimes.asr || calculateTime(15, 45) },
          { name: 'Maghrib', time: prayerTimes.maghrib || calculateTime(18, 20) },
          { name: 'Isha', time: prayerTimes.isha || calculateTime(19, 45) }
        ];

        setPrayers(prayerList);
      } else {
        throw new Error('API not available');
      }
    } catch (apiError) {
      // Fallback to local calculation
      console.log('Using local calculation as fallback');
      const calculatedTimes = calculatePrayerTimes(location.lat, location.lng, calculationMethod);

      if (calculatedTimes) {
        const prayerList = [
          { name: 'Imsak', time: calculatedTimes.imsak },
          { name: 'Fajr', time: calculatedTimes.fajr },
          { name: 'Sunrise', time: calculatedTimes.sunrise },
          { name: 'Dhuhr', time: calculatedTimes.dhuhr },
          { name: 'Asr', time: calculatedTimes.asr },
          { name: 'Maghrib', time: calculatedTimes.maghrib },
          { name: 'Isha', time: calculatedTimes.isha }
        ];

        setPrayers(prayerList);
      } else {
        throw new Error('Failed to calculate prayer times');
      }
    }

    setLastUpdated(new Date());
    setIsLoading(false);
  }, [location, calculationMethod, calculatePrayerTimes]);

  // Calculate next prayer
  const calculateNextPrayer = useCallback(() => {
    if (prayers.length === 0) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayerMinutes = prayers.map(prayer => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      return parseInt(hours) * 60 + parseInt(minutes);
    });

    let nextIndex = prayerMinutes.findIndex(minutes => minutes > currentMinutes);
    if (nextIndex === -1) nextIndex = 1; // Next day Fajr (skip Imsak)

    setNextPrayer(nextIndex);

    // Call callback with next prayer info
    if (onNextPrayerChange && nextIndex !== null) {
      const nextPrayerInfo = {
        name: prayers[nextIndex].name,
        time: prayers[nextIndex].time,
        minutesUntil: prayerMinutes[nextIndex] - currentMinutes < 0
          ? (24 * 60) - currentMinutes + prayerMinutes[nextIndex]
          : prayerMinutes[nextIndex] - currentMinutes
      };
      onNextPrayerChange(nextPrayerInfo);
    }
  }, [prayers, onNextPrayerChange]);

  // Update location
  const updateLocation = useCallback((lat, lng) => {
    setLocation({ lat, lng });
  }, []);

  // Fetch prayer times when location or method changes
  useEffect(() => {
    fetchPrayerTimes();
    // We intentionally depend on stable primitives here (lat/lng/method/adjustments snapshot)
    // to avoid re-running due to changing function identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, calculationMethod, JSON.stringify(prayerAdjustments)]);

  // Calculate next prayer every minute
  useEffect(() => {
    calculateNextPrayer();
    const interval = setInterval(calculateNextPrayer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [calculateNextPrayer]);

  // Get prayer status
  const getPrayerStatus = (index) => {
    if (nextPrayer === null) return 'Loading';
    if (index === nextPrayer) return 'Next';
    if (index < nextPrayer) return 'Completed';
    return 'Upcoming';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Next': return 'bg-primary text-primary-content';
      case 'Completed': return 'bg-base-300 text-base-content';
      case 'Upcoming': return 'bg-base-200';
      default: return 'bg-base-200';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/70">Calculating prayer times...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <svg className="w-16 h-16 mx-auto text-error/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-error mb-2">{error}</p>
        <button onClick={fetchPrayerTimes} className="btn btn-primary btn-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="enhanced-prayer-table">
      {/* Location and Method Info */}
      <div className="mb-4 p-3 bg-base-100 rounded-lg">
        <div className="flex items-center justify-between text-sm text-base-content/70">
          <span>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          <span>Method: {calculationMethod}</span>
          {lastUpdated && (
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Prayer Times Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Prayer</th>
              <th>Time</th>
              <th>Status</th>
              <th>Countdown</th>
            </tr>
          </thead>
          <tbody>
            {prayers.map((prayer, index) => {
              const status = getPrayerStatus(index);
              const statusColor = getStatusColor(status);

              return (
                <tr
                  key={prayer.name}
                  className={`${statusColor} transition-colors`}
                >
                  <td className="font-medium">{prayer.name}</td>
                  <td className="font-mono">{prayer.time}</td>
                  <td>
                    <span className="badge badge-ghost">
                      {status}
                    </span>
                  </td>
                  <td>
                    {status === 'Next' && (
                      <PrayerCountdown prayerTime={prayer.time} />
                    )}
                    {status === 'Completed' && (
                      <span className="text-xs opacity-70">Completed</span>
                    )}
                    {status === 'Upcoming' && (
                      <PrayerCountdown prayerTime={prayer.time} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={fetchPrayerTimes}
          className="btn btn-outline btn-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh Prayer Times
        </button>
      </div>
    </div>
  );
};

// Prayer Countdown Component
const PrayerCountdown = ({ prayerTime }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = prayerTime.split(':').map(Number);

      let prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);

      // If prayer time has passed today, set for tomorrow
      if (prayerDate <= now) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }

      const diff = prayerDate - now;
      const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hoursRemaining > 0) {
        setCountdown(`${hoursRemaining}h ${minutesRemaining}m`);
      } else {
        setCountdown(`${minutesRemaining}m`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [prayerTime]);

  return <span className="text-xs font-medium">{countdown}</span>;
};

export default EnhancedPrayerTable;