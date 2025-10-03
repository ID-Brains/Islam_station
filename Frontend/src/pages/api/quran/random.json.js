// Random Quran Verse API Endpoint
// Returns a random verse from the Quran with caching

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
    surah_id: 3,
    verse_number: 103,
    arabic_text: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
    translation: "And hold firmly to the rope of Allah all together and do not become divided.",
    surah_name: "Aal-E-Imran",
    surah_name_ar: "آل عمران",
    juz_number: 4
  },
  {
    id: 5,
    surah_id: 103,
    verse_number: 1,
    arabic_text: "وَالْعَصْرِ",
    translation: "By time",
    surah_name: "Al-Asr",
    surah_name_ar: "العصر",
    juz_number: 30
  },
  {
    id: 6,
    surah_id: 103,
    verse_number: 2,
    arabic_text: "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ",
    translation: "Indeed, mankind is in loss",
    surah_name: "Al-Asr",
    surah_name_ar: "العصر",
    juz_number: 30
  },
  {
    id: 7,
    surah_id: 103,
    verse_number: 3,
    arabic_text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
    translation: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.",
    surah_name: "Al-Asr",
    surah_name_ar: "العصر",
    juz_number: 30
  },
  {
    id: 8,
    surah_id: 2,
    verse_number: 286,
    arabic_text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond that it can bear",
    surah_name: "Al-Baqarah",
    surah_name_ar: "البقرة",
    juz_number: 3
  },
  {
    id: 9,
    surah_id: 94,
    verse_number: 7,
    arabic_text: "فَإِذَا فَرَغْتَ فَانصَبْ",
    translation: "So when you have finished [your duties], then stand up [for worship]",
    surah_name: "Al-Inshirah",
    surah_name_ar: "الشرح",
    juz_number: 30
  },
  {
    id: 10,
    surah_id: 94,
    verse_number: 8,
    arabic_text: "وَإِلَى رَبِّكَ فَارْغَبْ",
    translation: "And to your Lord direct [your] longing.",
    surah_name: "Al-Inshirah",
    surah_name_ar: "الشرح",
    juz_number: 30
  }
];

export async function get({ url }) {
  try {
    // Get a timestamp for the day to serve consistent "daily" verses
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayTimestamp = today.getTime();

    // Use timestamp as seed for "random" selection to get consistent daily verse
    const seedIndex = dayTimestamp % mockQuranData.length;
    const randomVerse = mockQuranData[seedIndex];

    // Add some variation if cache-busting is requested
    const bustCache = url.searchParams.get('bust') === 'true';
    if (bustCache) {
      const trulyRandomIndex = Math.floor(Math.random() * mockQuranData.length);
      randomVerse = mockQuranData[trulyRandomIndex];
    }

    return new Response(JSON.stringify({
      verse: randomVerse,
      timestamp: new Date().toISOString(),
      isDailyVerse: !bustCache
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': bustCache ? 'no-cache' : 'public, max-age=86400' // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Random Quran verse API error:', error);

    // Fallback to a known verse
    const fallbackVerse = mockQuranData[0];

    return new Response(JSON.stringify({
      verse: fallbackVerse,
      timestamp: new Date().toISOString(),
      isDailyVerse: true,
      error: 'Using fallback verse due to API error'
    }), {
      status: 200,
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}