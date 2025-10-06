import pandas as pd

df = pd.read_csv("/mnt/218516350360B13E/dev/Islam_station/database/assets/surahs.csv")

# إزالة أي صفوف تكرارية بناءً على surah_no
df = df.drop_duplicates(subset=["surah_no"])

# حفظ الملف مصحح
df.to_csv(
    "/mnt/218516350360B13E/dev/Islam_station/database/assets/surahs_fixed.csv",
    index=False,
)
