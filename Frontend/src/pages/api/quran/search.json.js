// Quran Search API Endpoint
// Handles advanced Quran search with multiple languages and search types

export async function get({ url }) {
  try {
    const params = url.searchParams;
    const query = params.get('q');
    const searchType = params.get('search_type') || 'fulltext';
    const language = params.get('language') || 'both';
    const limit = parseInt(params.get('limit')) || 20;
    const offset = parseInt(params.get('offset')) || 0;
    const surahFilter = params.get('surah_filter');

    // Validate required parameters
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({
        error: 'Search query must be at least 2 characters long',
        results: []
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Mock Quran database for development
    // In production, this would connect to a real Quran database
    const mockQuranData = [
      {
        id: 1,
        surah_id: 1,
        verse_number: 1,
        arabic_text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
        translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
        surah_name: "Al-Fatihah",
        surah_name_ar: "الفاتحة",
        juz_number: 1
      },
      {
        id: 2,
        surah_id: 1,
        verse_number: 2,
        arabic_text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        translation: "All praise is due to Allah, Lord of the worlds",
        surah_name: "Al-Fatihah",
        surah_name_ar: "الفاتحة",
        juz_number: 1
      },
      {
        id: 3,
        surah_id: 2,
        verse_number: 255,
        arabic_text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.",
        surah_name: "Al-Baqarah",
        surah_name_ar: "البقرة",
        juz_number: 3
      },
      {
        id: 4,
        surah_id: 103,
        verse_number: 1,
        arabic_text: "وَالْعَصْرِ",
        translation: "By time",
        surah_name: "Al-Asr",
        surah_name_ar: "العصر",
        juz_number: 30
      },
      {
        id: 5,
        surah_id: 103,
        verse_number: 2,
        arabic_text: "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ",
        translation: "Indeed, mankind is in loss",
        surah_name: "Al-Asr",
        surah_name_ar: "العصر",
        juz_number: 30
      },
      {
        id: 6,
        surah_id: 103,
        verse_number: 3,
        arabic_text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
        translation: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.",
        surah_name: "Al-Asr",
        surah_name_ar: "العصر",
        juz_number: 30
      }
    ];

    // Search functionality
    let results = mockQuranData.filter(verse => {
      const searchQuery = query.toLowerCase().trim();
      const arabicMatch = verse.arabic_text.toLowerCase().includes(searchQuery);
      const translationMatch = verse.translation.toLowerCase().includes(searchQuery);
      const surahNameMatch = verse.surah_name.toLowerCase().includes(searchQuery);
      const surahNameArMatch = verse.surah_name_ar.includes(searchQuery);

      // Apply language filter
      if (language === 'arabic' && !arabicMatch) return false;
      if (language === 'english' && !translationMatch && !surahNameMatch) return false;
      if (language === 'both' && !arabicMatch && !translationMatch && !surahNameMatch && !surahNameArMatch) return false;

      // Apply search type filter
      if (searchType === 'exact') {
        return verse.arabic_text.includes(query) ||
               verse.translation.toLowerCase().includes(query.toLowerCase());
      }
      if (searchType === 'arabic') {
        return arabicMatch || surahNameArMatch;
      }
      if (searchType === 'translation') {
        return translationMatch || surahNameMatch;
      }

      return arabicMatch || translationMatch || surahNameMatch || surahNameArMatch;
    });

    // Apply surah filter if specified
    if (surahFilter) {
      results = results.filter(verse => verse.surah_id === parseInt(surahFilter));
    }

    // Apply pagination
    const totalResults = results.length;
    results = results.slice(offset, offset + limit);

    // Return search results
    return new Response(JSON.stringify({
      query,
      searchType,
      language,
      totalResults,
      offset,
      limit,
      results,
      hasMore: offset + limit < totalResults
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Quran search API error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      results: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}