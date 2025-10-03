// Surah List API Endpoint
// Returns list of all 114 surahs with basic information

const surahList = [
  { id: 1, name: "Al-Fatihah", name_ar: "الفاتحة", english_meaning: "The Opener", revelation_type: "Meccan", verses_count: 7, juz_number: 1 },
  { id: 2, name: "Al-Baqarah", name_ar: "البقرة", english_meaning: "The Cow", revelation_type: "Medinan", verses_count: 286, juz_number: 1 },
  { id: 3, name: "Aal-E-Imran", name_ar: "آل عمران", english_meaning: "Family of Imran", revelation_type: "Medinan", verses_count: 200, juz_number: 3 },
  { id: 4, name: "An-Nisa", name_ar: "النساء", english_meaning: "The Women", revelation_type: "Medinan", verses_count: 176, juz_number: 4 },
  { id: 5, name: "Al-Ma'idah", name_ar: "المائدة", english_meaning: "The Table Spread", revelation_type: "Medinan", verses_count: 120, juz_number: 6 },
  { id: 6, name: "Al-An'am", name_ar: "الأنعام", english_meaning: "The Cattle", revelation_type: "Meccan", verses_count: 165, juz_number: 7 },
  { id: 7, name: "Al-A'raf", name_ar: "الأعراف", english_meaning: "The Heights", revelation_type: "Meccan", verses_count: 206, juz_number: 8 },
  { id: 8, name: "Al-Anfal", name_ar: "الأنفال", english_meaning: "The Spoils of War", revelation_type: "Medinan", verses_count: 75, juz_number: 9 },
  { id: 9, name: "At-Tawbah", name_ar: "التوبة", english_meaning: "The Repentance", revelation_type: "Medinan", verses_count: 129, juz_number: 10 },
  { id: 10, name: "Yunus", name_ar: "يونس", english_meaning: "Jonah", revelation_type: "Meccan", verses_count: 109, juz_number: 11 },
  { id: 11, name: "Hud", name_ar: "هود", english_meaning: "Hud", revelation_type: "Meccan", verses_count: 123, juz_number: 12 },
  { id: 12, name: "Yusuf", name_ar: "يوسف", english_meaning: "Joseph", revelation_type: "Meccan", verses_count: 111, juz_number: 12 },
  { id: 13, name: "Ar-Ra'd", name_ar: "الرعد", english_meaning: "The Thunder", revelation_type: "Medinan", verses_count: 43, juz_number: 13 },
  { id: 14, name: "Ibrahim", name_ar: "إبراهيم", english_meaning: "Abraham", revelation_type: "Meccan", verses_count: 52, juz_number: 13 },
  { id: 15, name: "Al-Hijr", name_ar: "الحجر", english_meaning: "The Stoneland", revelation_type: "Meccan", verses_count: 99, juz_number: 14 },
  { id: 16, name: "An-Nahl", name_ar: "النحل", english_meaning: "The Bee", revelation_type: "Meccan", verses_count: 128, juz_number: 14 },
  { id: 17, name: "Al-Isra", name_ar: "الإسراء", english_meaning: "The Night Journey", revelation_type: "Meccan", verses_count: 111, juz_number: 15 },
  { id: 18, name: "Al-Kahf", name_ar: "الكهف", english_meaning: "The Cave", revelation_type: "Meccan", verses_count: 110, juz_number: 15 },
  { id: 19, name: "Maryam", name_ar: "مريم", english_meaning: "Mary", revelation_type: "Meccan", verses_count: 98, juz_number: 16 },
  { id: 20, name: "Ta-Ha", name_ar: "طه", english_meaning: "Ta-Ha", revelation_type: "Meccan", verses_count: 135, juz_number: 16 },
  { id: 21, name: "Al-Anbiya", name_ar: "الأنبياء", english_meaning: "The Prophets", revelation_type: "Meccan", verses_count: 112, juz_number: 17 },
  { id: 22, name: "Al-Hajj", name_ar: "الحج", english_meaning: "The Pilgrimage", revelation_type: "Medinan", verses_count: 78, juz_number: 17 },
  { id: 23, name: "Al-Mu'minun", name_ar: "المؤمنون", english_meaning: "The Believers", revelation_type: "Meccan", verses_count: 118, juz_number: 18 },
  { id: 24, name: "An-Nur", name_ar: "النور", english_meaning: "The Light", revelation_type: "Medinan", verses_count: 64, juz_number: 18 },
  { id: 25, name: "Al-Furqan", name_ar: "الفرقان", english_meaning: "The Criterion", revelation_type: "Meccan", verses_count: 77, juz_number: 19 },
  { id: 26, name: "Ash-Shu'ara", name_ar: "الشعراء", english_meaning: "The Poets", revelation_type: "Meccan", verses_count: 227, juz_number: 19 },
  { id: 27, name: "An-Naml", name_ar: "النمل", english_meaning: "The Ant", revelation_type: "Meccan", verses_count: 93, juz_number: 19 },
  { id: 28, name: "Al-Qasas", name_ar: "القصص", english_meaning: "The Stories", revelation_type: "Meccan", verses_count: 88, juz_number: 20 },
  { id: 29, name: "Al-Ankabut", name_ar: "العنكبوت", english_meaning: "The Spider", revelation_type: "Meccan", verses_count: 69, juz_number: 20 },
  { id: 30, name: "Ar-Rum", name_ar: "الروم", english_meaning: "The Romans", revelation_type: "Meccan", verses_count: 60, juz_number: 21 },
  { id: 31, name: "Luqman", name_ar: "لقمان", english_meaning: "Luqman", revelation_type: "Meccan", verses_count: 34, juz_number: 21 },
  { id: 32, name: "As-Sajdah", name_ar: "السجدة", english_meaning: "The Prostration", revelation_type: "Meccan", verses_count: 30, juz_number: 21 },
  { id: 33, name: "Al-Ahzab", name_ar: "الأحزاب", english_meaning: "The Combined Forces", revelation_type: "Medinan", verses_count: 73, juz_number: 22 },
  { id: 34, name: "Saba", name_ar: "سبأ", english_meaning: "Sheba", revelation_type: "Meccan", verses_count: 54, juz_number: 22 },
  { id: 35, name: "Fatir", name_ar: "فاطر", english_meaning: "The Originator", revelation_type: "Meccan", verses_count: 45, juz_number: 22 },
  { id: 36, name: "Ya-Sin", name_ar: "يس", english_meaning: "Ya Sin", revelation_type: "Meccan", verses_count: 83, juz_number: 23 },
  { id: 37, name: "As-Saffat", name_ar: "الصافات", english_meaning: "Those who set the Ranks", revelation_type: "Meccan", verses_count: 182, juz_number: 23 },
  { id: 38, name: "Sad", name_ar: "ص", english_meaning: "The Letter Sad", revelation_type: "Meccan", verses_count: 88, juz_number: 23 },
  { id: 39, name: "Az-Zumar", name_ar: "الزمر", english_meaning: "The Troops", revelation_type: "Meccan", verses_count: 75, juz_number: 23 },
  { id: 40, name: "Ghafir", name_ar: "غافر", english_meaning: "The Forgiver", revelation_type: "Meccan", verses_count: 85, juz_number: 24 },
  { id: 41, name: "Fussilat", name_ar: "فصلت", english_meaning: "Explained in Detail", revelation_type: "Meccan", verses_count: 54, juz_number: 24 },
  { id: 42, name: "Ash-Shura", name_ar: "الشورى", english_meaning: "The Consultation", revelation_type: "Meccan", verses_count: 53, juz_number: 25 },
  { id: 43, name: "Az-Zukhruf", name_ar: "الزخرف", english_meaning: "The Ornaments of Gold", revelation_type: "Meccan", verses_count: 89, juz_number: 25 },
  { id: 44, name: "Ad-Dukhan", name_ar: "الدخان", english_meaning: "The Smoke", revelation_type: "Meccan", verses_count: 59, juz_number: 25 },
  { id: 45, name: "Al-Jathiyah", name_ar: "الجاثية", english_meaning: "The Crouching", revelation_type: "Meccan", verses_count: 37, juz_number: 25 },
  { id: 46, name: "Al-Ahqaf", name_ar: "الأحقاف", english_meaning: "The Wind-Curved Sandhills", revelation_type: "Meccan", verses_count: 35, juz_number: 26 },
  { id: 47, name: "Muhammad", name_ar: "محمد", english_meaning: "Muhammad", revelation_type: "Medinan", verses_count: 38, juz_number: 26 },
  { id: 48, name: "Al-Fath", name_ar: "الفتح", english_meaning: "The Victory", revelation_type: "Medinan", verses_count: 29, juz_number: 26 },
  { id: 49, name: "Al-Hujurat", name_ar: "الحجرات", english_meaning: "The Rooms", revelation_type: "Medinan", verses_count: 18, juz_number: 26 },
  { id: 50, name: "Qaf", name_ar: "ق", english_meaning: "The Letter Qaf", revelation_type: "Meccan", verses_count: 45, juz_number: 26 },
  { id: 51, name: "Adh-Dhariyat", name_ar: "الذاريات", english_meaning: "The Winnowing Winds", revelation_type: "Meccan", verses_count: 60, juz_number: 27 },
  { id: 52, name: "At-Tur", name_ar: "الطور", english_meaning: "The Mount", revelation_type: "Meccan", verses_count: 49, juz_number: 27 },
  { id: 53, name: "An-Najm", name_ar: "النجم", english_meaning: "The Star", revelation_type: "Meccan", verses_count: 62, juz_number: 27 },
  { id: 54, name: "Al-Qamar", name_ar: "القمر", english_meaning: "The Moon", revelation_type: "Meccan", verses_count: 55, juz_number: 27 },
  { id: 55, name: "Ar-Rahman", name_ar: "الرحمن", english_meaning: "The Beneficent", revelation_type: "Medinan", verses_count: 78, juz_number: 27 },
  { id: 56, name: "Al-Waqi'ah", name_ar: "الواقعة", english_meaning: "The Inevitable", revelation_type: "Meccan", verses_count: 96, juz_number: 27 },
  { id: 57, name: "Al-Hadid", name_ar: "الحديد", english_meaning: "The Iron", revelation_type: "Medinan", verses_count: 29, juz_number: 27 },
  { id: 58, name: "Al-Mujadila", name_ar: "المجادلة", english_meaning: "The Pleading Woman", revelation_type: "Medinan", verses_count: 22, juz_number: 28 },
  { id: 59, name: "Al-Hashr", name_ar: "الحشر", english_meaning: "The Exile", revelation_type: "Medinan", verses_count: 24, juz_number: 28 },
  { id: 60, name: "Al-Mumtahanah", name_ar: "الممتحنة", english_meaning: "She that is to be examined", revelation_type: "Medinan", verses_count: 13, juz_number: 28 },
  { id: 61, name: "As-Saff", name_ar: "الصف", english_meaning: "The Ranks", revelation_type: "Medinan", verses_count: 14, juz_number: 28 },
  { id: 62, name: "Al-Jumu'ah", name_ar: "الجمعة", english_meaning: "The Friday", revelation_type: "Medinan", verses_count: 11, juz_number: 28 },
  { id: 63, name: "Al-Munafiqun", name_ar: "المنافقون", english_meaning: "The Hypocrites", revelation_type: "Medinan", verses_count: 11, juz_number: 28 },
  { id: 64, name: "At-Taghabun", name_ar: "التغابن", english_meaning: "The Mutual Disillusion", revelation_type: "Medinan", verses_count: 18, juz_number: 28 },
  { id: 65, name: "At-Talaq", name_ar: "الطلاق", english_meaning: "The Divorce", revelation_type: "Medinan", verses_count: 12, juz_number: 28 },
  { id: 66, name: "At-Tahrim", name_ar: "التحريم", english_meaning: "The Prohibition", revelation_type: "Medinan", verses_count: 12, juz_number: 28 },
  { id: 67, name: "Al-Mulk", name_ar: "الملك", english_meaning: "The Dominion", revelation_type: "Meccan", verses_count: 30, juz_number: 29 },
  { id: 68, name: "Al-Qalam", name_ar: "القلم", english_meaning: "The Pen", revelation_type: "Meccan", verses_count: 52, juz_number: 29 },
  { id: 69, name: "Al-Haqqah", name_ar: "الحاقة", english_meaning: "The Reality", revelation_type: "Meccan", verses_count: 52, juz_number: 29 },
  { id: 70, name: "Al-Ma'arij", name_ar: "المعارج", english_meaning: "The Ascending Stairways", revelation_type: "Meccan", verses_count: 44, juz_number: 29 },
  { id: 71, name: "Nuh", name_ar: "نوح", english_meaning: "Noah", revelation_type: "Meccan", verses_count: 28, juz_number: 29 },
  { id: 72, name: "Al-Jinn", name_ar: "الجن", english_meaning: "The Jinn", revelation_type: "Meccan", verses_count: 28, juz_number: 29 },
  { id: 73, name: "Al-Muzzammil", name_ar: "المزمل", english_meaning: "The Enshrouded One", revelation_type: "Meccan", verses_count: 20, juz_number: 29 },
  { id: 74, name: "Al-Muddaththir", name_ar: "المدثر", english_meaning: "The Cloaked One", revelation_type: "Meccan", verses_count: 56, juz_number: 29 },
  { id: 75, name: "Al-Qiyamah", name_ar: "القيامة", english_meaning: "The Resurrection", revelation_type: "Meccan", verses_count: 40, juz_number: 29 },
  { id: 76, name: "Al-Insan", name_ar: "الإنسان", english_meaning: "The Man", revelation_type: "Medinan", verses_count: 31, juz_number: 29 },
  { id: 77, name: "Al-Mursalat", name_ar: "المرسلات", english_meaning: "The Emissaries", revelation_type: "Meccan", verses_count: 50, juz_number: 29 },
  { id: 78, name: "An-Naba'", name_ar: "النبأ", english_meaning: "The Tidings", revelation_type: "Meccan", verses_count: 40, juz_number: 30 },
  { id: 79, name: "An-Nazi'at", name_ar: "النازعات", english_meaning: "Those who drag forth", revelation_type: "Meccan", verses_count: 46, juz_number: 30 },
  { id: 80, name: "'Abasa", name_ar: "عبس", english_meaning: "He frowned", revelation_type: "Meccan", verses_count: 42, juz_number: 30 },
  { id: 81, name: "At-Takwir", name_ar: "التكوير", english_meaning: "The Overthrowing", revelation_type: "Meccan", verses_count: 29, juz_number: 30 },
  { id: 82, name: "Al-Infitar", name_ar: "الانفطار", english_meaning: "The Cleaving", revelation_type: "Meccan", verses_count: 19, juz_number: 30 },
  { id: 83, name: "Al-Mutaffifin", name_ar: "المطففين", english_meaning: "Defrauding", revelation_type: "Meccan", verses_count: 36, juz_number: 30 },
  { id: 84, name: "Al-Inshiqaq", name_ar: "الانشقاق", english_meaning: "The Splitting Open", revelation_type: "Meccan", verses_count: 25, juz_number: 30 },
  { id: 85, name: "Al-Buruj", name_ar: "البروج", english_meaning: "The Mansions of the Stars", revelation_type: "Meccan", verses_count: 22, juz_number: 30 },
  { id: 86, name: "At-Tariq", name_ar: "الطارق", english_meaning: "The Nightcomer", revelation_type: "Meccan", verses_count: 17, juz_number: 30 },
  { id: 87, name: "Al-A'la", name_ar: "الأعلى", english_meaning: "The Most High", revelation_type: "Meccan", verses_count: 19, juz_number: 30 },
  { id: 88, name: "Al-Ghashiyah", name_ar: "الغاشية", english_meaning: "The Overwhelming", revelation_type: "Meccan", verses_count: 26, juz_number: 30 },
  { id: 89, name: "Al-Fajr", name_ar: "الفجر", english_meaning: "The Dawn", revelation_type: "Meccan", verses_count: 30, juz_number: 30 },
  { id: 90, name: "Al-Balad", name_ar: "البلد", english_meaning: "The City", revelation_type: "Meccan", verses_count: 20, juz_number: 30 },
  { id: 91, name: "Ash-Shams", name_ar: "الشمس", english_meaning: "The Sun", revelation_type: "Meccan", verses_count: 15, juz_number: 30 },
  { id: 92, name: "Al-Lail", name_ar: "الليل", english_meaning: "The Night", revelation_type: "Meccan", verses_count: 21, juz_number: 30 },
  { id: 93, name: "Ad-Duhaa", name_ar: "الضحى", english_meaning: "The Morning Hours", revelation_type: "Meccan", verses_count: 11, juz_number: 30 },
  { id: 94, name: "Ash-Sharh", name_ar: "الشرح", english_meaning: "The Relief", revelation_type: "Meccan", verses_count: 8, juz_number: 30 },
  { id: 95, name: "At-Tin", name_ar: "التين", english_meaning: "The Fig", revelation_type: "Meccan", verses_count: 8, juz_number: 30 },
  { id: 96, name: "Al-Alaq", name_ar: "العلق", english_meaning: "The Clot", revelation_type: "Meccan", verses_count: 19, juz_number: 30 },
  { id: 97, name: "Al-Qadr", name_ar: "القدر", english_meaning: "The Power", revelation_type: "Meccan", verses_count: 5, juz_number: 30 },
  { id: 98, name: "Al-Bayyinah", name_ar: "البينة", english_meaning: "The Clear Proof", revelation_type: "Medinan", verses_count: 8, juz_number: 30 },
  { id: 99, name: "Az-Zalzalah", name_ar: "الزلزلة", english_meaning: "The Earthquake", revelation_type: "Medinan", verses_count: 8, juz_number: 30 },
  { id: 100, name: "Al-Adiyat", name_ar: "العاديات", english_meaning: "The Chargers", revelation_type: "Meccan", verses_count: 11, juz_number: 30 },
  { id: 101, name: "Al-Qari'ah", name_ar: "القارعة", english_meaning: "The Calamity", revelation_type: "Meccan", verses_count: 11, juz_number: 30 },
  { id: 102, name: "At-Takathur", name_ar: "التكاثر", english_meaning: "The Rivalry in world increase", revelation_type: "Meccan", verses_count: 8, juz_number: 30 },
  { id: 103, name: "Al-Asr", name_ar: "العصر", english_meaning: "The Time", revelation_type: "Meccan", verses_count: 3, juz_number: 30 },
  { id: 104, name: "Al-Humazah", name_ar: "الهمزة", english_meaning: "The Backbiter", revelation_type: "Meccan", verses_count: 9, juz_number: 30 },
  { id: 105, name: "Al-Fil", name_ar: "الفيل", english_meaning: "The Elephant", revelation_type: "Meccan", verses_count: 5, juz_number: 30 },
  { id: 106, name: "Quraysh", name_ar: "قريش", english_meaning: "Quraysh", revelation_type: "Meccan", verses_count: 4, juz_number: 30 },
  { id: 107, name: "Al-Ma'un", name_ar: "الماعون", english_meaning: "The Small Kindnesses", revelation_type: "Meccan", verses_count: 7, juz_number: 30 },
  { id: 108, name: "Al-Kawthar", name_ar: "الكوثر", english_meaning: "The Abundance", revelation_type: "Meccan", verses_count: 3, juz_number: 30 },
  { id: 109, name: "Al-Kafirun", name_ar: "الكافرون", english_meaning: "The Disbelievers", revelation_type: "Meccan", verses_count: 6, juz_number: 30 },
  { id: 110, name: "An-Nasr", name_ar: "النصر", english_meaning: "The Victory", revelation_type: "Medinan", verses_count: 3, juz_number: 30 },
  { id: 111, name: "Al-Masad", name_ar: "المسد", english_meaning: "The Palm Fiber", revelation_type: "Meccan", verses_count: 5, juz_number: 30 },
  { id: 112, name: "Al-Ikhlas", name_ar: "الإخلاص", english_meaning: "The Sincerity", revelation_type: "Meccan", verses_count: 4, juz_number: 30 },
  { id: 113, name: "Al-Falaq", name_ar: "الفلق", english_meaning: "The Dawn", revelation_type: "Meccan", verses_count: 5, juz_number: 30 },
  { id: 114, name: "An-Nas", name_ar: "الناس", english_meaning: "The Mankind", revelation_type: "Meccan", verses_count: 6, juz_number: 30 }
];

export async function get({ url }) {
  try {
    const params = url.searchParams;
    const search = params.get('search');
    const revelationType = params.get('revelation_type');
    const limit = parseInt(params.get('limit')) || 114;
    const offset = parseInt(params.get('offset')) || 0;

    let filteredSurahs = [...surahList];

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredSurahs = filteredSurahs.filter(surah =>
        surah.name.toLowerCase().includes(searchTerm) ||
        surah.name_ar.includes(searchTerm) ||
        surah.english_meaning.toLowerCase().includes(searchTerm) ||
        surah.id.toString() === searchTerm
      );
    }

    // Apply revelation type filter
    if (revelationType) {
      filteredSurahs = filteredSurahs.filter(surah =>
        surah.revelation_type.toLowerCase() === revelationType.toLowerCase()
      );
    }

    // Apply pagination
    const totalResults = filteredSurahs.length;
    filteredSurahs = filteredSurahs.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      totalResults,
      offset,
      limit,
      surahs: filteredSurahs,
      hasMore: offset + limit < totalResults
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Surah list API error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      surahs: []
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}