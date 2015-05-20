#!/usr/bin/python3

import os
import urllib.request
import json
import sqlite3
import time
import sys
import traceback
import logging
from daemon import runner

# Note there's a bug in
# /usr/local/lib/python3.4/dist-packages/daemon/runner.py
# correct the lines for stdout_path and stdout_err to:
# open(..., 'a+', 1)

class App():
    def __init__(self):
        logger.info("Initializing OpenWeatherMap logger")
        self.conn = None
        self.cursor = None

        self.openWeatherMapUrl = "http://api.openweathermap.org/data/2.5/weather?lat={0}&lon={1}&units={2}&APPID={3}"
        self.api_key = "93a3e42c05923d726e91b6c5b0da386d"
        self.units = "metric"

        self.aarhus_coords = (56.15674, 10.21076)
        self.skanderborg_coords = (56.063696, 9.994724)
        self.moensted_coords = (56.443901, 9.194299)

        # Daemon config
        self.stdin_path = '/dev/null'
        self.stdout_path = '/var/log/openweather/out.log'
        self.stderr_path = '/var/log/openweather/err.log'
        self.pidfile_path =  '/var/run/openweather/openweather.pid'
        self.pidfile_timeout = 5

    def run(self):
        logger.info("Starting OpenWeatherMap logger")
        while True:
            logger.info("\tFetching data")
            try:
                try:
                    self.databasePre()
                    self.getData(self.skanderborg_coords)
                    self.getData(self.moensted_coords)
                except:
                    logger.error("Unexpected error: ", sys.exc_info()[0])
                    traceback.print_exc()
                self.databasePost()
            except:
                logger.error("Unexpected error: ", sys.exc_info()[0])
                traceback.print_exc()
            # Sleep 30 mins, data update from openweathermap is <2hours, whatever that means
            time.sleep(1800)

    def databasePre(self):
        self.conn = sqlite3.connect('/var/log/openweather/openWeather.db')
        self.cursor = self.conn.cursor()

        logger.info("\tLoading db")
        createFile = open('/home/rohdef/git/EverSolar-reader/logger/create_openweather.sql', 'r')
        self.cursor.execute(createFile.read())
        createFile.close()
        self.conn.commit()

    def databasePost(self):
        self.conn.close()

    # Data specification found at:
    # http://openweathermap.org/weather-data#current
    def getData(self, coords):
        requestUrl = self.openWeatherMapUrl.format(coords[0], coords[1], self.units, self.api_key)
        gotData = False

        while not gotData:
            try:
                response = urllib.request.urlopen(requestUrl)
                gotData = True
            except:
                logger.warn("\t\tError getting data, sleeping for two mins")
                time.sleep(120)

        obj = json.loads(response.readall().decode('utf-8'))

        # Unix time GMT according to spec
        recieveTime = obj.get("dt")

        # City name
        cityName = obj.get("name")
        coord = (obj.get("coord").get("lat"), obj.get("coord").get("lon"))

        sunrise = obj.get("sys").get("sunrise")
        sunset = obj.get("sys").get("sunset")

        main = obj.get("main")
        temperature = main.get("temp")
        humidity = main.get("humidity")
        pressure = main.get("pressure")
        pressure_sea_level = main.get("sea_level")
        pressure_gnd_level = main.get("grnd_level")

        windSpeed = obj.get("wind").get("speed")
        windDeg = obj.get("wind").get("deg")
        windGust = obj.get("wind").get("gust")
        if not windGust:
            windGust = windSpeed

        clouds = obj.get("clouds").get("all")

        weather = obj.get("weather")[0]
        weatherId = weather.get("id")
        weatherMain = weather.get("main")
        weatherDescription = weather.get("description")
        weatherIcon = weather.get("icon")

        # Undocumented, probably just tells us where the data comes from
        # Will monitor just in case
        base = obj.get("base")
        if not base:
            base = "Unknown"

        self.cursor.execute('''INSERT INTO openweather (recievetime,
                                               cityname,
                                               latitude,
                                               longitude,
                                               sunrise,
                                               sunset,
                                               temperature,
                                               humidity,
                                               pressure,
                                               pressure_sea,
                                               pressure_gnd,
                                               windSpeed,
                                               windDeg,
                                               windGust,
                                               clouds,
                                               weatherId,
                                               weatherMain,
                                               weatherDescription,
                                               weatherIcon,
                                               base)
                                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                            (recieveTime,
                             cityName,
                             coord[0],
                             coord[1],
                             sunrise,
                             sunset,
                             temperature,
                             humidity,
                             pressure,
                             pressure_sea_level,
                             pressure_gnd_level,
                             windSpeed,
                             windDeg,
                             windGust,
                             clouds,
                             weatherId,
                             weatherMain,
                             weatherDescription,
                             weatherIcon,
                             base))
        self.conn.commit()
        logger.info("\t\tData logged")

#if __name__ == '__main__':
#    a = App()
#    a.main()

logger = logging.getLogger("OpenWeatherMap")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler = logging.FileHandler("/var/log/openweather/run.log")
handler.setFormatter(formatter)
logger.addHandler(handler)
app = App()

daemon_runner = runner.DaemonRunner(app)
#This ensures that the logger file handle does not get closed during daemonization
daemon_runner.daemon_context.files_preserve=[handler.stream]
daemon_runner.do_action()
