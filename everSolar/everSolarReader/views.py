from django.shortcuts import render

from django.http import HttpResponse

from everSolarReader import history, test
import json

def index(request):
    return render(request, 'reader/index.html')

def script(request):
    return render(request, 'reader/index.js',content_type='text/javascript')

def data(request):
    data = json.dumps({
        "openWeather" : history.getWeatherData(),
        "everSolar" : history.getAverage(),
        "optimal" : history.getOptimal(),
    })
    return HttpResponse(data,content_type='application/json')

def total(request):
    data = json.dumps({
        "openWeather" : history.getAverageClouds(),
        "everSolar": history.getTotalProductionPerDay()
    })
    return HttpResponse(data,content_type='application/json')

def diff30(request):
    data = json.dumps({
        "diff" : history.getDiff(30),
        "openWeather" : history.getWeatherData(),
    })
    return HttpResponse(data,content_type='application/json')

def diff60(request):
    data = json.dumps({
        "diff" : history.getDiff(60),
        "openWeather" : history.getWeatherData(),
    })
    return HttpResponse(data,content_type='application/json')

def diff180(request):
    data = json.dumps({
        "diff" : history.getDiff(180),
        "openWeather" : history.getWeatherData(),
    })
    return HttpResponse(data,content_type='application/json')
