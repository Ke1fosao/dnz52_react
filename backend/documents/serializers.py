from rest_framework import serializers

from .models import Document, DocumentCategory


class DocumentCategorySerializer(serializers.ModelSerializer):
    documents_count = serializers.SerializerMethodField()

    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'slug', 'order', 'documents_count']

    def get_documents_count(self, obj):
        return obj.document_set.filter(is_published=True).count()


class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)
    category = DocumentCategorySerializer(read_only=True)
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'category', 'file', 'file_size', 'description',
            'created_at', 'is_published', 'downloads',
        ]

    def get_file_size(self, obj):
        try:
            return obj.get_file_size()
        except (FileNotFoundError, ValueError):
            return None
