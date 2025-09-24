import pandas as pd

# Load data
surahs = pd.read_csv("surahs.csv")
ayahs = pd.read_csv("ayahs.csv")

# Prepare surah_id for each ayah
surah_ids = []
current_surah = 1

for total in surahs["total_ayah_surah"]:
    surah_ids.extend([current_surah] * total)
    current_surah += 1

# Check lengths
if len(surah_ids) != len(ayahs):
    raise ValueError(f"Number of ayahs ({len(ayahs)}) does not match sum of surah ayahs ({len(surah_ids)})")

# Add surah_id column
ayahs["surah_id"] = surah_ids

# Save new file
ayahs.to_csv("ayahs_with_surahid.csv", index=False, encoding="utf-8")
print("✅ New file 'ayahs_with_surahid.csv' created successfully with surah_id column")
