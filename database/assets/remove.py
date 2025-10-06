import csv
from pyarabic.araby import strip_tashkeel

input_csv = "Dataset.csv"
output_csv = "output.csv"

with (
    open(input_csv, "r", encoding="utf-8") as infile,
    open(output_csv, "w", encoding="utf-8", newline="") as outfile,
):
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    for row in reader:
        cleaned_row = [strip_tashkeel(cell) for cell in row]
        writer.writerow(cleaned_row)

print("Arabic Tashkeel removed using pyArabic and saved to", output_csv)
