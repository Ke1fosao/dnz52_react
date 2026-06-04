"""
API адмінпанелі (React, /manage) — захищений namespace `/api/v1/admin/...`.

Окремо від публічного API (який AllowAny + read-only). Тут — TokenAuthentication
+ IsAdminUser. Вхід проходить через django-axes (захист від брутфорсу).
Фаза 1: автентифікація, статистика дашборда, модерація Відгуків і Питань FAQ.
"""
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.utils.text import slugify

from rest_framework import viewsets, serializers, mixins
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, action,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from reviews.models import Review
from faq.models import FAQQuestionSubmission, FAQItem, FAQCategory
from news.models import News, NewsCategory, NewsTag
from events.models import Event
from groups.models import Group


# ============================================================================
# Серіалізатори (повні поля — лише для адмінів)
# ============================================================================
class AdminReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'author', 'child_group', 'rating', 'text', 'created_at',
                  'is_approved', 'likes', 'dislikes', 'admin_reply']
        read_only_fields = ['author', 'child_group', 'rating', 'text', 'created_at',
                            'likes', 'dislikes']


class AdminQuestionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FAQQuestionSubmission
        fields = ['id', 'name', 'phone', 'question', 'created_at', 'status',
                  'status_display', 'callback_date', 'handled_at', 'handled_by_name',
                  'admin_note']
        read_only_fields = ['name', 'phone', 'question', 'created_at', 'handled_at']

    def get_handled_by_name(self, obj):
        return obj.handled_by.get_full_name() or obj.handled_by.username if obj.handled_by else None


def _user_payload(user):
    return {
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'is_superuser': user.is_superuser,
    }


# ============================================================================
# Автентифікація
# ============================================================================
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def admin_login(request):
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    if not username or not password:
        return Response({'detail': 'Введіть логін і пароль.'}, status=400)
    try:
        user = authenticate(request, username=username, password=password)
    except PermissionDenied:
        # django-axes заблокував через забагато невдалих спроб
        return Response(
            {'detail': 'Забагато невдалих спроб входу. Спробуйте за годину.'},
            status=403,
        )
    if user is None:
        return Response({'detail': 'Невірний логін або пароль.'}, status=400)
    if not user.is_staff:
        return Response({'detail': 'У цього акаунта немає доступу до адмінпанелі.'}, status=403)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': _user_payload(user)})


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminUser])
def admin_logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Вихід виконано.'})


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminUser])
def admin_me(request):
    return Response({'user': _user_payload(request.user)})


# ============================================================================
# Статистика для дашборда
# ============================================================================
_UA_MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminUser])
def admin_stats(request):
    from news.models import News
    from events.models import Event
    from gallery.models import GalleryAlbum
    from groups.models import Group
    from circles.models import Circle
    from documents.models import Document
    from faq.models import FAQItem

    pending_reviews = Review.objects.filter(is_approved=False).count()
    new_questions = FAQQuestionSubmission.objects.filter(
        status=FAQQuestionSubmission.Status.NEW
    ).count()

    totals = {
        'news': News.objects.count(),
        'events': Event.objects.count(),
        'albums': GalleryAlbum.objects.count(),
        'groups': Group.objects.count(),
        'circles': Circle.objects.count(),
        'documents': Document.objects.count(),
        'reviews': Review.objects.count(),
        'faq': FAQItem.objects.count(),
    }

    # Графік: кількість новин за останні 6 місяців
    first_of_month = timezone.now().date().replace(day=1)
    y, m = first_of_month.year, first_of_month.month
    buckets = []
    for _ in range(6):
        buckets.append((y, m))
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    buckets.reverse()
    chart = [
        {'label': _UA_MONTHS[mm - 1],
         'value': News.objects.filter(created_at__year=yy, created_at__month=mm).count()}
        for (yy, mm) in buckets
    ]

    return Response({
        'pending_reviews': pending_reviews,
        'new_questions': new_questions,
        'totals': totals,
        'chart': chart,
    })


# ============================================================================
# Модерація Відгуків
# ============================================================================
class AdminReviewViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                         mixins.DestroyModelMixin, viewsets.GenericViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = AdminReviewSerializer
    pagination_class = None

    def get_queryset(self):
        # Спершу ті, що на модерації, потім нові
        qs = Review.objects.all().order_by('is_approved', '-created_at')
        st = self.request.query_params.get('status')
        if st == 'pending':
            qs = qs.filter(is_approved=False)
        elif st == 'approved':
            qs = qs.filter(is_approved=True)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        review = self.get_object()
        review.is_approved = True
        review.save(update_fields=['is_approved'])
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        review = self.get_object()
        review.is_approved = False
        review.save(update_fields=['is_approved'])
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        review = self.get_object()
        review.admin_reply = (request.data.get('reply') or '').strip()
        review.save(update_fields=['admin_reply'])
        return Response(self.get_serializer(review).data)


# ============================================================================
# Модерація Питань FAQ (надісланих відвідувачами)
# ============================================================================
class AdminQuestionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                           mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                           viewsets.GenericViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = AdminQuestionSerializer
    pagination_class = None
    http_method_names = ['get', 'patch', 'delete']  # без PUT

    def get_queryset(self):
        qs = FAQQuestionSubmission.objects.all().order_by('-created_at')
        st = self.request.query_params.get('status')
        if st in ('new', 'in_progress', 'callback', 'done'):
            qs = qs.filter(status=st)
        return qs

    def perform_update(self, serializer):
        obj = serializer.save()
        # При закритті — фіксуємо хто і коли обробив
        if obj.status == FAQQuestionSubmission.Status.DONE and obj.handled_at is None:
            obj.handled_at = timezone.now()
            obj.handled_by = self.request.user
            obj.save(update_fields=['handled_at', 'handled_by'])


# ============================================================================
# Редагування контенту (Новини, Події, FAQ-питання-відповіді)
# ============================================================================

# Транслітерація укр → латиниця для ASCII-слагів (SlugField не приймає кирилицю)
_TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'iu', 'я': 'ia', "'": '', '’': '', 'ʼ': '',
}


def _translit(text):
    return ''.join(_TRANSLIT.get(ch, ch) for ch in (text or '').lower())


def _unique_slug(model, title, instance=None):
    base = slugify(_translit(title))[:45] or 'item'
    slug = base
    i = 2
    qs = model.objects.exclude(pk=instance.pk) if instance else model.objects.all()
    while qs.filter(slug=slug).exists():
        slug = f'{base}-{i}'
        i += 1
    return slug


class _AutoSlugMixin:
    """Автоматично генерує slug із title, якщо його не задано."""
    slug_source = 'title'

    def validate(self, attrs):
        model = self.Meta.model
        creating = self.instance is None
        title = attrs.get(self.slug_source) or (getattr(self.instance, self.slug_source, '') if self.instance else '')
        if (creating and not attrs.get('slug')) or ('slug' in attrs and not attrs['slug']):
            attrs['slug'] = _unique_slug(model, title, self.instance)
        return attrs


class AdminNewsSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(queryset=NewsCategory.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=NewsTag.objects.all(), required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = News
        fields = ['id', 'title', 'slug', 'category', 'category_name', 'tags', 'content',
                  'image', 'status', 'status_display', 'publish_at', 'is_published',
                  'views', 'created_at']
        read_only_fields = ['is_published', 'views', 'created_at']
        extra_kwargs = {'slug': {'required': False}}


class AdminEventSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False, allow_null=True)
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), required=False, allow_null=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'slug', 'event_type', 'event_type_display', 'start_date',
                  'end_date', 'location', 'description', 'image', 'group', 'is_published', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {'slug': {'required': False}}


class AdminFAQItemSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=FAQCategory.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = FAQItem
        fields = ['id', 'question', 'answer', 'category', 'category_name', 'order', 'is_published', 'likes']
        read_only_fields = ['likes']


class _ContentViewSet(viewsets.ModelViewSet):
    """Спільна база для CRUD контенту: TokenAuth + IsAdminUser + multipart."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None


class AdminNewsViewSet(_ContentViewSet):
    serializer_class = AdminNewsSerializer
    queryset = News.objects.all().order_by('-created_at').prefetch_related('tags')


class AdminEventViewSet(_ContentViewSet):
    serializer_class = AdminEventSerializer
    queryset = Event.objects.all().order_by('-start_date')


class AdminFAQItemViewSet(_ContentViewSet):
    serializer_class = AdminFAQItemSerializer
    queryset = FAQItem.objects.all().order_by('order', 'id')


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminUser])
def admin_meta(request):
    """Дані для випадаючих списків у формах контенту."""
    return Response({
        'news_categories': [{'id': c.id, 'name': c.name} for c in NewsCategory.objects.all()],
        'news_tags': [{'id': t.id, 'name': t.name} for t in NewsTag.objects.all()],
        'faq_categories': [{'id': c.id, 'name': c.name} for c in FAQCategory.objects.all()],
        'event_types': [{'value': v, 'label': lbl} for v, lbl in Event.EVENT_TYPE_CHOICES],
        'groups': [{'id': g.id, 'name': g.name} for g in Group.objects.filter(is_published=True)],
        'news_statuses': [{'value': v, 'label': lbl} for v, lbl in News.Status.choices],
    })
