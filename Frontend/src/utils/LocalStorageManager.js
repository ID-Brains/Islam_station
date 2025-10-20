class LocalStorageManager {
  constructor() {
    this.prefix = 'islam-station-';
    this.defaultPreferences = {
      // Language Settings
      language: 'ar',
      showTranslation: true,
      showTransliteration: false,

      // Reading Preferences
      quranFont: 'amiri',
      fontSize: 'medium', // small, medium, large
      readingMode: 'continuous', // continuous, paged, verse-by-verse
      theme: 'islamic', // islamic, light, dark

      // Prayer Settings
      location: { lat: 21.4225, lng: 39.8262 }, // Default to Mecca
      calculationMethod: 'MuslimWorldLeague',
      notifications: true,
      adjustments: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
      },

      // UI Preferences
      sidebarCollapsed: false,
      showBismillah: true,
      showVerseNumbers: true,
      autoScroll: true,

      // Bookmark Categories
      bookmarkCategories: ['favorites', 'memorization', 'study', 'reflection'],

      // Reading Progress
      readingGoals: {
        daily: 5, // verses per day
        weekly: 35, // verses per week
        monthly: 150 // verses per month
      }
    };
  }

  // Get preference value
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const value = localStorage.getItem(fullKey);

      if (value === null) {
        return defaultValue !== null ? defaultValue : this.defaultPreferences[key];
      }

      // Parse JSON values
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.warn(`Error getting localStorage key ${key}:`, error);
      return defaultValue !== null ? defaultValue : this.defaultPreferences[key];
    }
  }

  // Set preference value
  set(key, value) {
    try {
      const fullKey = this.prefix + key;
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      localStorage.setItem(fullKey, valueToStore);
      return true;
    } catch (error) {
      console.warn(`Error setting localStorage key ${key}:`, error);
      return false;
    }
  }

  // Remove preference
  remove(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key ${key}:`, error);
      return false;
    }
  }

  // Get all preferences
  getAll() {
    const preferences = {};

    Object.keys(this.defaultPreferences).forEach(key => {
      preferences[key] = this.get(key);
    });

    return preferences;
  }

  // Set multiple preferences
  setMultiple(preferences) {
    const results = {};

    Object.keys(preferences).forEach(key => {
      results[key] = this.set(key, preferences[key]);
    });

    return results;
  }

  // Reset to defaults
  reset() {
    const results = {};

    Object.keys(this.defaultPreferences).forEach(key => {
      results[key] = this.set(key, this.defaultPreferences[key]);
    });

    return results;
  }

  // Clear all app data
  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }

  // Export preferences
  export() {
    try {
      const data = this.getAll();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `islam-station-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.warn('Error exporting preferences:', error);
      return false;
    }
  }

  // Import preferences
  import(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            const results = this.setMultiple(data);
            resolve(results);
          } catch (parseError) {
            reject(new Error('Invalid JSON file'));
          }
        };

        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Storage utilities
  getStorageInfo() {
    try {
      let totalSize = 0;
      let itemCount = 0;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          totalSize += localStorage.getItem(key).length;
          itemCount++;
        }
      });

      return {
        totalSize,
        itemCount,
        totalSizeKB: (totalSize / 1024).toFixed(2)
      };
    } catch (error) {
      console.warn('Error getting storage info:', error);
      return { totalSize: 0, itemCount: 0, totalSizeKB: '0' };
    }
  }

  // Check if localStorage is available
  isAvailable() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const localStorageManager = new LocalStorageManager();

export default localStorageManager;

// Export class for advanced usage
export { LocalStorageManager };