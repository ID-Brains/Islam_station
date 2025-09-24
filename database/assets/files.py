import pandas as pd

df = pd.read_csv("output.csv")

surahs = df[["surah_no", "surah_name_en", "surah_name_ar", "surah_name_roman", "total_ayah_surah", "place_of_revelation"]]
ayahs = df[["ayah_no_surah", "ayah_no_quran", "ayah_ar", "ayah_en", "ruko_no", "juz_no", "manzil_no",
            "hizb_quarter", "sajdah_ayah", "sajdah_no", "total_ayah_quran", "no_of_word_ayah", "list_of_words" ]]

surahs.to_csv("surahs.csv", index=False)
ayahs.to_csv("ayahs.csv", index=False)
