SELECT "mosque_id","name","address","city","country",
    ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
FROM "mosques"
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
    $3
)
ORDER BY distance_meters ASC;
