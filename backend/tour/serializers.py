from rest_framework import serializers

from .models import TourStop


class TourStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourStop
        fields = ['id', 'title', 'description', 'image', 'order']
