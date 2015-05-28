CREATE VIEW weather_monsted AS
SELECT * FROM "openweather" WHERE "cityname" = 'Karup' OR "cityname" = 'Stoholm';