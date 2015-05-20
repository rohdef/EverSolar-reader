from django.db import connections
from datetime import datetime, timedelta

def test():
    cursor = connections['everSolar'].cursor()
    cursor.execute("SELECT timestamp, pac, serial_number FROM inverter")
    data = cursor.fetchall()

    start = datetime.now()
    for d in data:
        timestamp = datetime.strptime(d[0], "%Y-%m-%d %H:%M:%S").timestamp()
        
    end = datetime.now()
    old = ((end-start).total_seconds())

    start = datetime.now()
    for d in data:
        parts = d[0].split(" ")
        parts = list(map(int, parts[0].split("-") + parts[1].split(":")))

        time = datetime(parts[0], parts[1], parts[2], 
                        hour=parts[3], minute=parts[4], second=parts[5]).timestamp()

    end = datetime.now()
    new = ((end-start).total_seconds())

    return [old, new]
