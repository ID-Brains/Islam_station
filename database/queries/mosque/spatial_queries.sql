SELECT "mosque_id","name","address","city","country",
    ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
FROM "mosques"
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
    $3
)
ORDER BY distance_meters ASC;

SELECT "mosque_id","name","address","city","country"
FROM "mosques"
WHERE "name" ILIKE '%' || $1 || '%'
ORDER BY "name" ASC;

SELECT "mosque_id","name","address","city","country"
FROM "mosques"
WHERE location && ST_MakeEnvelope($2, $1, $4, $3, 4326)
ORDER BY "name" ASC;
