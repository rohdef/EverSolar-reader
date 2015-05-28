﻿CREATE VIEW differences_from_180_max AS (
SELECT a.start_time, a.avg_effect, o.max, (o.max-a.avg_effect) AS difference, ROUND((a.avg_effect/o.max), 4) AS fraction FROM avg_180_effects a
LEFT JOIN optimal_180_effects o ON EXTRACT(hours FROM a.start_time)=o.hours AND EXTRACT(minutes FROM a.start_time)=o.minutes
);