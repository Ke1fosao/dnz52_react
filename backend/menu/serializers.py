from rest_framework import serializers

from .models import DailyMenu


class DailyMenuSerializer(serializers.ModelSerializer):
    has_any_meal = serializers.ReadOnlyField()

    class Meta:
        model = DailyMenu
        fields = [
            'id', 'date', 'breakfast', 'second_breakfast', 'lunch',
            'snack', 'dinner', 'note', 'is_published', 'has_any_meal',
            'created_at', 'updated_at',
        ]
