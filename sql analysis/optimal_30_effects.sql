--DROP VIEW optima_30_effects;

CREATE VIEW optimal_30_effects AS (
SELECT e.hours, e.minutes, MAX(e.avg_effect)
FROM
	(SELECT start_time, EXTRACT(hours FROM start_time) AS hours, EXTRACT(minutes FROM start_time) AS minutes, avg_effect FROM avg_30_effects) AS e
GROUP BY e.hours, e.minutes
ORDER BY e.hours, e.minutes
);

-- 22 days, 12.15 4664
-- 18.30 2286