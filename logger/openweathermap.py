import urllib.request
import json

openWeatherMapUrl = "api.openweathermap.org/data/2.5/weather?lat={0}&lon={1}&units={2}&APPID={3}"
api_key = "93a3e42c05923d726e91b6c5b0da386d"
units = "metric"

aarhus_chords = (56.15674, 10.21076)

def main():
    requestUrl = openWeatherMapUrl.format(aarhus_chords[0], aarhus_chords[1], units, api_key)
    print(requestUrl)
    response = urllib.request.urlopen(requestUrl)
    obj = json.loads(response.read())

    # Unix time GMT according to spec
    recieveTime = obj.get("dt")

    # City name
    name = obj.get("name")
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

    clouds = obj.get("clouds").get("all")

    weather = obj.get("weather")[0]
    weatherId = weather.get("id")
    weatherMain = weather.get("main")
    weatherDescription = weather.get("description")
    weatherIcon = weather.get("icon")


    # Undocumented, probably just tells us where the data comes from
    # Will monitor just in case
    base = obj.get("base")



if __name__ == '__main__':
    main()
