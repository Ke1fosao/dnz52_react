from rest_framework import serializers

from .models import (
    Page, PageImage, Slider, Contact,
    ParentsAnnouncement, ParentsDocument, ParentsAdaptationPhoto,
    ParentsEnrollmentDoc, ParentsApplicationSample,
    StaffMember,
    AttestationDocument, AttestationStep, AttestationCategory,
    AttestationLaw, AttestationSettings,
)


class PageImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = PageImage
        fields = ['id', 'image', 'caption', 'order', 'is_active']


class PageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, allow_null=True)
    images = PageImageSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = [
            'id', 'title', 'slug', 'content', 'image',
            'created_at', 'updated_at', 'is_published', 'order', 'images',
        ]


class PageListSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, allow_null=True)

    class Meta:
        model = Page
        fields = ['id', 'title', 'slug', 'image', 'order']


class SliderSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)
    video = serializers.FileField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Slider
        fields = ['id', 'title', 'description', 'image', 'video', 'link', 'order', 'is_active']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'address', 'phone', 'email', 'working_hours', 'map_embed',
            'facebook_url', 'instagram_url', 'youtube_url',
        ]


class ParentsAnnouncementSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ParentsAnnouncement
        fields = ['id', 'title', 'image', 'link', 'order', 'is_active']


class ParentsDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True, allow_null=True, required=False)
    url = serializers.SerializerMethodField()

    class Meta:
        model = ParentsDocument
        fields = [
            'id', 'title', 'description', 'link_type', 'external_url',
            'internal_slug', 'file', 'icon', 'accent', 'order', 'is_active', 'url',
        ]

    def get_url(self, obj):
        return obj.get_url()


class ParentsAdaptationPhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ParentsAdaptationPhoto
        fields = ['id', 'title', 'image', 'order', 'is_active']


class ParentsEnrollmentDocSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentsEnrollmentDoc
        fields = ['id', 'title', 'note', 'order', 'is_active']


class ParentsApplicationSampleSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ParentsApplicationSample
        fields = ['id', 'title', 'image', 'caption', 'order', 'is_active']


class StaffMemberSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, allow_null=True)
    awards_list = serializers.ReadOnlyField()

    class Meta:
        model = StaffMember
        fields = [
            'id', 'full_name', 'position', 'photo', 'education', 'experience',
            'category', 'awards', 'awards_list', 'bio', 'email', 'phone',
            'reception_hours', 'is_featured', 'accent_color', 'detail_url',
            'order', 'is_active',
        ]


class AttestationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttestationDocument
        fields = [
            'id', 'title', 'subtitle', 'category', 'url', 'icon',
            'accent', 'order', 'is_active',
        ]


class AttestationStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttestationStep
        fields = ['id', 'title', 'description', 'order', 'is_active']


class AttestationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttestationCategory
        fields = ['id', 'title', 'description', 'icon', 'color', 'order', 'is_active']


class AttestationLawSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttestationLaw
        fields = ['id', 'title', 'url', 'order', 'is_active']


class AttestationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttestationSettings
        fields = [
            'id', 'hero_lead', 'intro_html', 'docs_section_subtitle',
            'contact_title', 'contact_html',
        ]
