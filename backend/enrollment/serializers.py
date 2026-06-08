from rest_framework import serializers

from .models import EnrollmentApplication


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    """Публічне створення заявки. `website` — honeypot проти ботів."""
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = EnrollmentApplication
        fields = ['id', 'child_name', 'child_birth_date', 'parent_name',
                  'phone', 'email', 'desired_start', 'note', 'website']
        extra_kwargs = {
            'child_name':  {'required': True, 'min_length': 2, 'max_length': 150},
            'parent_name': {'required': True, 'min_length': 2, 'max_length': 150},
            'phone':       {'required': True, 'min_length': 5, 'max_length': 50},
            'child_birth_date': {'required': True},
            'email':         {'required': False, 'allow_blank': True},
            'desired_start': {'required': False, 'allow_blank': True},
            'note':          {'required': False, 'allow_blank': True},
        }

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError('Виявлено спам.')
        return value

    def create(self, validated_data):
        validated_data.pop('website', None)
        return EnrollmentApplication.objects.create(**validated_data)
