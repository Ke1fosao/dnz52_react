from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('', views.events_calendar, name='calendar'),
    path('event/<slug:slug>/', views.event_detail, name='event_detail'),
]
