CREATE VIEW differences_from_30_max AS (
SELECT a.start_time, a.avg_effect, o.max, (o.max-a.avg_effect) AS difference, ROUND((a.avg_effect/o.max), 4) AS fraction FROM avg_30_effects a
LEFT JOIN optimal_30_effects o ON EXTRACT(hours FROM a.start_time)=o.hours AND EXTRACT(minutes FROM a.start_time)=o.minutes
);