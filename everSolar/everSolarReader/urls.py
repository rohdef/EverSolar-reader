from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^index.js$', views.script, name='script'),
    url(r'^data/$', views.data, name='data'),
    url(r'^total/$', views.total, name='total'),
]
