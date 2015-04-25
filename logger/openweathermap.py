#!/usr/bin/python3

import urllib.request
import json
import sqlite3
import time
import sys
import traceback
import logging
from daemon import runne

class App():
    def __init__(self):
        self.conn = None
        self.cursor = None

        self.openWeatherMapUrl = "http://api.openweathermap.org/data/2.5/weather?lat={0}&lon={1}&units={2}&APPID={3}"
        self.api_key = "93a3e42c05923d726e91b6c5b0da386d"
        self.units = "metric"

        self.aarhus_chords = (56.15674, 10.21076)


    def run(self):
        while True:
            try:
                try:
                    self.databasePre()
                    self.getData()
                except:
                    print("Unexpected error: ", sys.exc_info()[0])
                    traceback.print_exc()
                self.databasePost()
            except:
                logger.error("Unexpected error: ", sys.exc_info()[0])
                traceback.print_exc()
            # Sleep 30 mins, data update from openweathermap is <2hours, whatever that means
            time.sleep(1800)

    def databasePre(self):
        self.conn = sqlite3.connect('openWeather.db')
        self.cursor = conn.cursor()

        createFile = open('create_openweather.sql', 'r')
        cursor.execute(createFile.read())
        createFile.close()
        conn.commit()

    def databasePost(self):
        self.conn.close()

    # Data specification found at:
    # http://openweathermap.org/weather-data#current
    def getData():
        requestUrl = self.openWeatherMapUrl.format(self.aarhus_chords[0], self.aarhus_chords[1], self.units, self.api_key)
        gotData = False

        while not gotData:
            try:
                response = urllib.request.urlopen(requestUrl)
                gotData = True
            except:
                logger.warn("Error getting data, sleeping for two mins")
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

if __name__ == '__main__':
    a = App()
    a.main()

app = App()
logger = logging.getLogger("DaemonLog")
logger.setLevel(logging.WARNING)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler = logging.FileHandler("/var/log/testdaemon/testdaemon.log")
handler.setFormatter(formatter)
logger.addHandler(handler)

daemon_runner = runner.DaemonRunner(app)
#This ensures that the logger file handle does not get closed during daemonization
daemon_runner.daemon_context.files_preserve=[handler.stream]
daemon_runner.do_action()
