DROP VIEW summed_production;

CREATE VIEW summed_production AS
SELECT to_timestamp("timestamp", 'YYYY-MM-DD HH24:MI:SS') AS "reading_time", SUM(pac) AS "effect"
  FROM "inverter" GROUP BY "timestamp" ORDER BY "timestamp";
