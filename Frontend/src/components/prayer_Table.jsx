import { useEffect, useState } from 'react';

// Next Prayer Display Component
export const NextPrayerDisplay = () => {
  const [nextPrayer, setNextPrayer] = useState({ name: 'Loading...', time: 0 });

  const handleNextPrayerChange = (prayerInfo) => {
    setNextPrayer(prayerInfo);
  };

  return { nextPrayer, handleNextPrayerChange };
};

const PrayerTable = ({ latitude = 21.4225, longitude = 39.8262, onNextPrayerChange }) => {
  const [prayers, setPrayers] = useState([]);
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/prayer/pTimes?latitude=${latitude}&longitude=${longitude}`);
        const data = await response.json();
        
        // API returns { location: {...}, prayer_times: { fajr: "...", ... } }
        const prayerTimes = data.prayer_times;
        
        const prayerList = [
          { name: 'Imsak', time: prayerTimes.imsak || '05:20' },
          { name: 'Fajr', time: prayerTimes.fajr || '05:30' },
          { name: 'Sunrise', time: prayerTimes.sunrise || '06:45' },
          { name: 'Dhuhr', time: prayerTimes.dhuhr || '12:15' },
          { name: 'Asr', time: prayerTimes.asr || '15:45' },
          { name: 'Maghrib', time: prayerTimes.maghrib || '18:20' },
          { name: 'Isha', time: prayerTimes.isha || '19:45' }
        ];
        
        setPrayers(prayerList);
        
        // Calculate next prayer
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const prayerMinutes = prayerList.map(prayer => {
          const [hours, minutes] = prayer.time.split(':');
          return parseInt(hours) * 60 + parseInt(minutes);
        });
        
        let nextIndex = prayerMinutes.findIndex(minutes => minutes > currentMinutes);
        if (nextIndex === -1) nextIndex = 0; // Next day Fajr
        
        setNextPrayer(nextIndex);
        
        // Call callback with next prayer info
        if (onNextPrayerChange) {
          const nextPrayerInfo = {
            name: prayerList[nextIndex].name,
            time: prayerList[nextIndex].time,
            minutesUntil: prayerMinutes[nextIndex] - currentMinutes
          };
          onNextPrayerChange(nextPrayerInfo);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Fallback to hardcoded (24-hour format)
        setPrayers([
          { name: 'Imsak', time: '05:20' },
          { name: 'Fajr', time: '05:30' },
          { name: 'Sunrise', time: '06:45' },
          { name: 'Dhuhr', time: '12:15' },
          { name: 'Asr', time: '15:45' },
          { name: 'Maghrib', time: '18:20' },
          { name: 'Isha', time: '19:45' }
        ]);
      }
    };

    fetchPrayerTimes();
  }, [latitude, longitude]);

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Prayer</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {prayers.map((prayer, index) => (
            <tr
              key={prayer.name}
              className={index === nextPrayer ? 'bg-primary text-primary-content' : index === 0 ? 'bg-base-200' : ''}
            >
              <td>{prayer.name}</td>
              <td>{prayer.time}</td>
              <td>{index === nextPrayer ? 'Next' : index < nextPrayer ? 'Completed' : 'Upcoming'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrayerTable;