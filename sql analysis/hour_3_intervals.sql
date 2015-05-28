--DROP VIEW twenty_min_intervals;

CREATE MATERIALIZED VIEW hour_3_intervals AS (
	SELECT 
		(SELECT min(reading_time) FROM summed_production) + ( n    || ' minutes')::interval start_time,
		(SELECT min(reading_time) FROM summed_production) + ((n+180) || ' minutes')::interval end_time
	FROM generate_series(0, ((SELECT max(reading_time)::date - min(reading_time)::date FROM summed_production) + 1)*24*60, 180) n
);