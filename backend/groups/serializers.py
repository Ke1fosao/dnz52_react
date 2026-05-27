from rest_framework import serializers

from .models import Group, GroupStaff


class GroupStaffSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, allow_null=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = GroupStaff
        fields = [
            'id', 'role', 'role_display', 'full_name', 'photo', 'birth_date',
            'education', 'experience', 'motto', 'order',
        ]


class GroupListSerializer(serializers.ModelSerializer):
    cover = serializers.ImageField(use_url=True, allow_null=True)
    age_group_display = serializers.CharField(source='get_age_group_display', read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'slug', 'age_group', 'age_group_display',
            'motto', 'cover', 'color', 'order',
        ]


class GroupDetailSerializer(serializers.ModelSerializer):
    cover = serializers.ImageField(use_url=True, allow_null=True)
    age_group_display = serializers.CharField(source='get_age_group_display', read_only=True)
    staff = GroupStaffSerializer(many=True, read_only=True)
    album_slug = serializers.SlugRelatedField(source='album', slug_field='slug', read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'slug', 'age_group', 'age_group_display',
            'motto', 'description', 'cover', 'color', 'album_slug',
            'order', 'is_published', 'staff',
        ]
