--DROP MATERIALIZED VIEW avg_effects;

CREATE MATERIALIZED VIEW avg_180_effects AS (

SELECT f.start_time, f.end_time, ROUND(AVG(m.effect)) avg_effect
FROM summed_production m
RIGHT JOIN hour_3_intervals f 
        ON m.reading_time >= f.start_time AND m.reading_time < f.end_time
WHERE m.effect IS NOT NULL AND m.effect > 0
GROUP BY f.start_time, f.end_time
ORDER BY f.start_time
);