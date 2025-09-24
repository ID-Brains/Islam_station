SELECT 
    s."surah_id",s."surah_no",s."surah_name_ar",s."surah_name_en",s."surah_name_roman",s."place_of_revelation",s."total_ayah_surah",
    a."ayah_id",a."ayah_no_surah",a."ayah_no_quran",a."ayah_ar",a."ayah_en",a."juz_no",a."ruko_no",a."manzil_no",a."hizb_quarter",a."sajdah_ayah",a."sajdah_no",a."total_ayah_quran",a."no_of_word_ayah",a."list_of_words"
FROM "surahs" s
JOIN "ayahs" a ON a."surah_id" = s."surah_id"
WHERE s."surah_name_ar" ILIKE $1 OR s."surah_name_en" ILIKE $2
ORDER BY a."ayah_no_surah";
