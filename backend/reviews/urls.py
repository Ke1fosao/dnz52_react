from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    path('', views.reviews_page, name='reviews_page'),
    path('<int:pk>/vote/<str:action>/', views.vote_review, name='vote_review'),
]
