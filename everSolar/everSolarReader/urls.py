from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^index.js$', views.script, name='script'),
    url(r'^data/$', views.data, name='data'),
    url(r'^noise/$', views.noise, name='noise'),
    url(r'^total/$', views.total, name='total'),
    url(r'^diff30/$', views.diff30, name='diff30'),
    url(r'^diff60/$', views.diff60, name='diff60'),
    url(r'^diff180/$', views.diff180, name='diff180'),
]
