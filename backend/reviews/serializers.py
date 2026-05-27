from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Серіалізатор для читання опублікованих відгуків."""

    class Meta:
        model = Review
        fields = [
            'id', 'author', 'child_group', 'rating', 'text',
            'created_at', 'likes', 'dislikes',
        ]
        read_only_fields = ['id', 'created_at', 'likes', 'dislikes']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення відгуку (POST з модерацією).

    Поле `website` — honeypot для захисту від ботів. Якщо заповнене —
    відхиляємо запит у view. На клієнті не показуємо.
    """
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    # rating перевизначаємо як IntegerField щоб працювали min_value/max_value
    # (у моделі він з choices → DRF за замовчуванням робить ChoiceField без цих опцій)
    rating = serializers.IntegerField(required=True, min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = ['id', 'author', 'child_group', 'rating', 'text', 'website']
        extra_kwargs = {
            'author':      {'required': True, 'min_length': 2, 'max_length': 100},
            'child_group': {'required': False, 'allow_blank': True, 'max_length': 100},
            'text':        {'required': True, 'min_length': 5},
        }

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError('Виявлено спам.')
        return value

    def create(self, validated_data):
        # honeypot не зберігаємо, відгук створюється з is_approved=False (модерація)
        validated_data.pop('website', None)
        return Review.objects.create(is_approved=False, **validated_data)
