from rest_framework import serializers

from .models import FAQItem, FAQQuestionSubmission


class FAQItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQItem
        fields = ['id', 'question', 'answer', 'likes', 'order']


class FAQAskSerializer(serializers.ModelSerializer):
    """Створення запитання від відвідувача. `website` — honeypot проти ботів."""
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = FAQQuestionSubmission
        fields = ['id', 'name', 'phone', 'question', 'website']
        extra_kwargs = {
            'name':     {'required': True, 'min_length': 2, 'max_length': 100},
            'phone':    {'required': True, 'min_length': 5, 'max_length': 50},
            'question': {'required': True, 'min_length': 5},
        }

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError('Виявлено спам.')
        return value

    def create(self, validated_data):
        validated_data.pop('website', None)
        return FAQQuestionSubmission.objects.create(**validated_data)
