CREATE VIEW differences_from_max AS (
SELECT a.start_time, a.avg_effect, o.max, (o.max-a.avg_effect) AS difference, ROUND(((o.max-a.avg_effect)/o.max), 4) AS percent FROM avg_effects a
LEFT JOIN optimal_effects o ON EXTRACT(hours FROM a.start_time)=o.hours AND EXTRACT(minutes FROM a.start_time)=o.minutes
);