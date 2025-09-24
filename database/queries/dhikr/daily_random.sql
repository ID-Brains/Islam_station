SELECT "dhikr_id","category_id","text_ar","text_en","benefits_ar","benefits_en","reference"
FROM "dhikr"
WHERE "category_id" = $1
ORDER BY RANDOM()
LIMIT 1;
