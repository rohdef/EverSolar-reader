from django.db import connections
from datetime import datetime, timedelta

def average(data):
    sum = 0

    for d in data:
        sum += d[1]

    timestamp = data[0][0] + ((data[len(data)-1][0] - data[0][0]) /2) 
    return {"time": round(timestamp)*1000, "output": round((sum / len(data)))}

def getPVdata(averageInterval):
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT timestamp, pac, serial_number FROM inverter")
    data = cursor.fetchall()
    resData = []

    intervalStart = None
    intervalData = []

    last = None

    for d in data:
        parts = d[0].split(" ")
        parts = list(map(int, parts[0].split("-") + parts[1].split(":")))

        timestamp = datetime(parts[0], parts[1], parts[2], 
                        hour=parts[3], minute=parts[4], second=parts[5]).timestamp()
        if intervalStart is None:
            intervalStart = timestamp
            
#        if (intervalStart + averageInterval * 60) < timestamp:
#            temp = average(intervalData)
#            temp["inverter"] = d[2]
#            resData.append(temp)
#            intervalData = []
#            intervalStart = timestamp

        if last is None:
            last = [timestamp, d[1], d[2]]
        else:
            if (last[0] == timestamp) and (last[2] != d[2]):
                intervalData.append([timestamp, last[1] + d[1]])
                resData.append({"time": round(timestamp)*1000, "output": last[1] + d[1]})
                last = None
            else:
                intervalData.append(last)
                resData.append({"time": round(timestamp)*1000, "output": last[1]})
                last = [timestamp, d[1], d[2]]

    return resData

def getWeatherData():
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT recievetime, clouds FROM weather_monsted ORDER BY recievetime")
    data = cursor.fetchall()
    
    resData = []

    for d in data:
        resData.append({"time": (d[0]) * 1000, "clouds": d[1]})

    return resData

def getTotalProductionPerDay():
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT timestamp, serial_number, e_today FROM inverter")
    data = cursor.fetchall()
    
    resData = []

    date = None
    timeStamp = None
    dayData =[]

    for d in data:
        parts = d[0].split(" ")
        parts = list(map(int, parts[0].split("-") + parts[1].split(":")))

        timeData = datetime(parts[0], parts[1], parts[2], 
                        hour=parts[3], minute=parts[4], second=parts[5])
        delta = timedelta(hours = timeData.hour, 
                          minutes = timeData.minute, 
                          seconds = timeData.second)
        
        if date is None:
            date = timeData
            timeStamp = (timeData - delta).timestamp()

        if timeData.day != date.day:
            
            inverterOne = dayData[len(dayData)-1]
            for e in reversed(dayData):
                if e[0] != inverterOne[0]:
                    resData.append({"time": round(timeStamp*1000), "total": e[1] + inverterOne[1]})
                    break
                
            date = timeData
            timeStamp = (timeData - delta).timestamp()
            dayData = []

        dayData.append([d[1], d[2]])

    return resData

def getAverageClouds():
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT recievetime, clouds FROM weather_monsted ORDER BY recievetime")
    data = cursor.fetchall()
    
    resData = []
    
    day = None
    dayData = []

    for d in data:
        time = datetime.fromtimestamp(d[0])
        
        if day is None:
            day = time

        if day.day != time.day:
            sum = 0
            number = 0

            for e in dayData:
                if (8 <= e[0].hour <= 20):
                    sum += e[1]
                    number += 1

            delta = timedelta(hours = day.hour, minutes = day.minute, seconds = day.second)
            resData.append({
                "time": round(((day - delta).timestamp()) * 1000),
                "clouds": round(sum / number)
            })

            day = time
            dayData = []
            

        dayData.append([time, d[1]])
    
    return resData


def getOptimal():
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT start_time, max FROM differences_from_60_max ORDER BY start_time")
    data = cursor.fetchall()

    resData = []
    for d in data:
        resData.append({
            "time" : round(d[0].timestamp() * 1000),
            "max" : int(d[1]),
        })
    
    return resData


def getAverage():
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT start_time, avg_effect FROM differences_from_60_max ORDER BY start_time")
    data = cursor.fetchall()

    resData = []
    for d in data:
        resData.append({
            "time" : round(d[0].timestamp() * 1000),
            "output" : int(d[1]),
        })
    
    return resData

def getDiff(interval):
    cursor = connections['postgres'].cursor()
    cursor.execute("SELECT start_time, fraction FROM differences_from_" + str(interval) + "_max WHERE avg_effect > 23 ORDER BY start_time")
    data = cursor.fetchall()

    resData = []
    for d in data:
        resData.append({
            "time" : round(d[0].timestamp() * 1000),
            "diff" : float(d[1]) * 100,
        })
    
    return resData
