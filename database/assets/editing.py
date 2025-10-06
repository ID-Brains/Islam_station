import pandas as pd

# Load CSV
ayahs = pd.read_csv("/mnt/218516350360B13E/dev/Islam_station/database/assets/ayahs.csv")

# تحويل sajdah_no من float أو نص لـ int
ayahs["sajdah_no"] = ayahs["sajdah_no"].fillna(0).astype(int)

# برضه تحويل sajdah_ayah لـ 0/1 بدل True/False
ayahs["sajdah_ayah"] = ayahs["sajdah_ayah"].astype(int)

# حفظ CSV جديد جاهز للCOPY
ayahs.to_csv(
    "/mnt/218516350360B13E/dev/Islam_station/database/assets/ayahs_ready.csv",
    index=False,
    encoding="utf-8",
)
