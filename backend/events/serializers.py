from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    color = serializers.CharField(read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    image = serializers.ImageField(use_url=True, allow_null=True, required=False)
    is_multiday = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'event_type', 'event_type_display',
            'description', 'start_date', 'end_date', 'location', 'image',
            'color', 'is_multiday',
        ]
