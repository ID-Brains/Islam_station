import localStorageManager from './LocalStorageManager.js';

class QuranBookmarkManager {
  constructor() {
    this.bookmarksKey = 'quran-bookmarks';
    this.categoriesKey = 'bookmark-categories';
    this.notesKey = 'bookmark-notes';
    this.lastReadKey = 'last-read-verse';
  }

  // Get all bookmarks
  getBookmarks() {
    try {
      return localStorageManager.get(this.bookmarksKey, []);
    } catch (error) {
      console.warn('Error getting bookmarks:', error);
      return [];
    }
  }

  // Add bookmark
  addBookmark(bookmark) {
    try {
      const bookmarks = this.getBookmarks();

      // Check if bookmark already exists
      const existingIndex = bookmarks.findIndex(
        b => b.surahId === bookmark.surahId && b.ayahNumber === bookmark.ayahNumber
      );

      if (existingIndex !== -1) {
        // Update existing bookmark
        bookmarks[existingIndex] = {
          ...bookmarks[existingIndex],
          ...bookmark,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new bookmark
        const newBookmark = {
          id: this.generateBookmarkId(),
          surahId: bookmark.surahId,
          ayahNumber: bookmark.ayahNumber,
          category: bookmark.category || 'favorites',
          note: bookmark.note || '',
          tags: bookmark.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...bookmark
        };
        bookmarks.unshift(newBookmark);
      }

      localStorageManager.set(this.bookmarksKey, bookmarks);
      return true;
    } catch (error) {
      console.warn('Error adding bookmark:', error);
      return false;
    }
  }

  // Remove bookmark
  removeBookmark(bookmarkId) {
    try {
      const bookmarks = this.getBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      localStorageManager.set(this.bookmarksKey, filteredBookmarks);
      return true;
    } catch (error) {
      console.warn('Error removing bookmark:', error);
      return false;
    }
  }

  // Update bookmark
  updateBookmark(bookmarkId, updates) {
    try {
      const bookmarks = this.getBookmarks();
      const bookmarkIndex = bookmarks.findIndex(b => b.id === bookmarkId);

      if (bookmarkIndex === -1) {
        return false;
      }

      bookmarks[bookmarkIndex] = {
        ...bookmarks[bookmarkIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorageManager.set(this.bookmarksKey, bookmarks);
      return true;
    } catch (error) {
      console.warn('Error updating bookmark:', error);
      return false;
    }
  }

  // Get bookmark by ID
  getBookmark(bookmarkId) {
    try {
      const bookmarks = this.getBookmarks();
      return bookmarks.find(b => b.id === bookmarkId) || null;
    } catch (error) {
      console.warn('Error getting bookmark:', error);
      return null;
    }
  }

  // Get bookmarks by category
  getBookmarksByCategory(category) {
    try {
      const bookmarks = this.getBookmarks();
      return bookmarks.filter(b => b.category === category);
    } catch (error) {
      console.warn('Error getting bookmarks by category:', error);
      return [];
    }
  }

  // Get bookmarks by Surah
  getBookmarksBySurah(surahId) {
    try {
      const bookmarks = this.getBookmarks();
      return bookmarks.filter(b => b.surahId === surahId);
    } catch (error) {
      console.warn('Error getting bookmarks by Surah:', error);
      return [];
    }
  }

  // Check if verse is bookmarked
  isVerseBookmarked(surahId, ayahNumber) {
    try {
      const bookmarks = this.getBookmarks();
      return bookmarks.some(b => b.surahId === surahId && b.ayahNumber === ayahNumber);
    } catch (error) {
      console.warn('Error checking if verse is bookmarked:', error);
      return false;
    }
  }

  // Get bookmark categories
  getBookmarkCategories() {
    try {
      return localStorageManager.get(this.categoriesKey, [
        'favorites',
        'memorization',
        'study',
        'reflection',
        'important',
        'teaching'
      ]);
    } catch (error) {
      console.warn('Error getting bookmark categories:', error);
      return [];
    }
  }

  // Add bookmark category
  addBookmarkCategory(category) {
    try {
      const categories = this.getBookmarkCategories();
      if (!categories.includes(category)) {
        categories.push(category);
        localStorageManager.set(this.categoriesKey, categories);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error adding bookmark category:', error);
      return false;
    }
  }

  // Get bookmark statistics
  getBookmarkStats() {
    try {
      const bookmarks = this.getBookmarks();
      const categories = this.getBookmarkCategories();

      const stats = {
        total: bookmarks.length,
        byCategory: {},
        bySurah: {},
        recentlyAdded: bookmarks.slice(0, 5)
      };

      // Count by category
      categories.forEach(category => {
        stats.byCategory[category] = bookmarks.filter(b => b.category === category).length;
      });

      // Count by Surah
      bookmarks.forEach(bookmark => {
        const surahKey = `surah-${bookmark.surahId}`;
        stats.bySurah[surahKey] = (stats.bySurah[surahKey] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.warn('Error getting bookmark stats:', error);
      return { total: 0, byCategory: {}, bySurah: {}, recentlyAdded: [] };
    }
  }

  // Export bookmarks
  exportBookmarks() {
    try {
      const data = {
        bookmarks: this.getBookmarks(),
        categories: this.getBookmarkCategories(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `islam-station-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.warn('Error exporting bookmarks:', error);
      return false;
    }
  }

  // Import bookmarks
  importBookmarks(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);

            if (data.bookmarks && Array.isArray(data.bookmarks)) {
              // Validate and add bookmarks
              const validBookmarks = data.bookmarks.filter(bookmark =>
                bookmark.surahId && bookmark.ayahNumber
              );

              // Add bookmarks one by one to avoid duplicates
              validBookmarks.forEach(bookmark => {
                this.addBookmark(bookmark);
              });

              // Import categories if available
              if (data.categories && Array.isArray(data.categories)) {
                data.categories.forEach(category => {
                  this.addBookmarkCategory(category);
                });
              }

              resolve({
                imported: validBookmarks.length,
                total: data.bookmarks.length
              });
            } else {
              reject(new Error('Invalid bookmark file format'));
            }
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

  // Set last read verse
  setLastReadVerse(surahId, ayahNumber) {
    try {
      const lastRead = {
        surahId,
        ayahNumber,
        timestamp: new Date().toISOString()
      };
      localStorageManager.set(this.lastReadKey, lastRead);
      return true;
    } catch (error) {
      console.warn('Error setting last read verse:', error);
      return false;
    }
  }

  // Get last read verse
  getLastReadVerse() {
    try {
      return localStorageManager.get(this.lastReadKey, null);
    } catch (error) {
      console.warn('Error getting last read verse:', error);
      return null;
    }
  }

  // Get reading progress
  getReadingProgress() {
    try {
      const bookmarks = this.getBookmarks();
      const categories = this.getBookmarkCategories();

      // Count verses in each category (especially memorization)
      const memorizationBookmarks = bookmarks.filter(b => b.category === 'memorization');
      const favoritesBookmarks = bookmarks.filter(b => b.category === 'favorites');

      return {
        totalBookmarks: bookmarks.length,
        memorizedVerses: memorizationBookmarks.length,
        favoriteVerses: favoritesBookmarks.length,
        lastRead: this.getLastReadVerse(),
        bookmarkCategories: categories.length,
        recentlyActive: bookmarks.filter(b => {
          const lastUpdate = new Date(b.updatedAt || b.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastUpdate > weekAgo;
        }).length
      };
    } catch (error) {
      console.warn('Error getting reading progress:', error);
      return {
        totalBookmarks: 0,
        memorizedVerses: 0,
        favoriteVerses: 0,
        lastRead: null,
        bookmarkCategories: 0,
        recentlyActive: 0
      };
    }
  }

  // Generate unique bookmark ID
  generateBookmarkId() {
    return 'bm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Search bookmarks
  searchBookmarks(query) {
    try {
      const bookmarks = this.getBookmarks();
      const lowercaseQuery = query.toLowerCase();

      return bookmarks.filter(bookmark => {
        // Search in notes and tags
        const noteMatch = bookmark.note && bookmark.note.toLowerCase().includes(lowercaseQuery);
        const tagMatch = bookmark.tags && bookmark.tags.some(tag =>
          tag.toLowerCase().includes(lowercaseQuery)
        );
        const categoryMatch = bookmark.category && bookmark.category.toLowerCase().includes(lowercaseQuery);

        return noteMatch || tagMatch || categoryMatch;
      });
    } catch (error) {
      console.warn('Error searching bookmarks:', error);
      return [];
    }
  }
}

// Create singleton instance
const quranBookmarkManager = new QuranBookmarkManager();

export default quranBookmarkManager;

// Export class for advanced usage
export { QuranBookmarkManager };