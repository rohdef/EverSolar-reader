import urllib.request
import xml.etree.ElementTree as ET

def main():
    response = urllib.request.urlopen("http://www.yr.no/place/Denmark/Central_Jutland/Aarhus/forecast_hour_by_hour.xml")
    xml = response.read()

    root = ET.fromstring(xml)
    print(root.tag)
    forecast = root.find("forecast").find("tabular")

    for time in forecast:
        symbol = time.find("symbol")
        symbolNumber = symbol.attrib["number"] # Our magic variable
        symbolNumberEx = symbol.attrib["numberEx"] # Eh, ain't this the same as the other
        symbolName = symbol.attrib["name"]
        symbolVar = symbol.attrib["var"]

        precipitation = time.find("precipitation").attrib["value"]

        windDirection = time.find("windDirection")
        windDirectionDeg = windDirection.attrib["deg"]
        windDirectionCode = windDirection.attrib["code"]
        windDirectionName = windDirection.attrib["name"]

        windSpeed = time.find("windSpeed")
        windSpeedMps = windSpeed.attrib["mps"]
        windSpeedName = windSpeed.attrib["name"]

        temperature = time.find("temperature")
        temperatureUnit = temperature.attrib["unit"]
        temperatureValue = temperature.attrib["value"]

        pressure = time.find("pressure")
        pressureUnit = pressure.attrib["unit"]
        pressureValue = pressure.attrib["value"]

        print("Number " + symbolNumber)
        print("Precip " + precipitation)
        print("Wind direction " + windDirectionDeg)
        print("Wind speed " + windSpeedMps)
        print("Temperature " + temperatureValue)
        print("Pressure " + pressureValue)

if __name__ == '__main__':
    main()
