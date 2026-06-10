"""
API адмінпанелі (React, /manage) — захищений namespace `/api/v1/admin/...`.

Окремо від публічного API (який AllowAny + read-only). Тут — TokenAuthentication
+ IsAdminUser. Вхід проходить через django-axes (захист від брутфорсу).
Фаза 1: автентифікація, статистика дашборда, модерація Відгуків і Питань FAQ.
"""
from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.utils.text import slugify

from django.conf import settings as django_settings

from rest_framework import viewsets, serializers, mixins
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, action,
)
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response


class ExpiringTokenAuthentication(TokenAuthentication):
    """TokenAuthentication з перевіркою терміну дії (ADMIN_TOKEN_TTL у settings)."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        ttl = getattr(django_settings, 'ADMIN_TOKEN_TTL', 7 * 24 * 3600)
        if (timezone.now() - token.created).total_seconds() > ttl:
            token.delete()
            raise AuthenticationFailed('Сесія закінчилась. Увійдіть знову.')
        return user, token

from reviews.models import Review
from faq.models import FAQQuestionSubmission, FAQItem, FAQCategory
from news.models import News, NewsCategory, NewsTag
from events.models import Event, EventType
from groups.models import Group, GroupStaff
from circles.models import Circle, CircleBenefit, CircleSession
from gallery.models import GalleryCategory, GalleryAlbum, GalleryPhoto
from documents.models import Document, DocumentCategory
from enrollment.models import EnrollmentApplication
from tour.models import TourStop
from menu.models import DailyMenu, MenuTemplate
from specialists.models import (
    SpecialistPage, Specialist, SpecialistAlbum,
    SpecialistPageSection, SpecialistPagePhoto,
)
from .models import (
    Page, PageImage, Slider, Contact, StaffMember,
    ParentsAnnouncement, ParentsDocument, ParentsAdaptationPhoto,
    ParentsEnrollmentDoc, ParentsApplicationSample,
    AttestationDocument, AttestationStep, AttestationCategory,
    AttestationLaw, AttestationSettings, AISettings, ChatLog,
)
from .serializers import (
    ParentsAnnouncementSerializer, ParentsDocumentSerializer,
    ParentsAdaptationPhotoSerializer, ParentsEnrollmentDocSerializer,
    ParentsApplicationSampleSerializer,
    AttestationDocumentSerializer, AttestationStepSerializer,
    AttestationCategorySerializer, AttestationLawSerializer,
    AttestationSettingsSerializer,
)


_WEEKDAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']


# ============================================================================
# Серіалізатори (повні поля — лише для адмінів)
# ============================================================================
class AdminReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'author', 'child_group', 'rating', 'text', 'created_at',
                  'is_approved', 'likes', 'dislikes', 'admin_reply', 'ai_moderation']
        read_only_fields = ['author', 'child_group', 'rating', 'text', 'created_at',
                            'likes', 'dislikes', 'ai_moderation']


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


def _has_2fa(user):
    from django_otp.plugins.otp_totp.models import TOTPDevice
    return TOTPDevice.objects.filter(user=user, confirmed=True).exists()


def _user_payload(user):
    return {
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'is_superuser': user.is_superuser,
        'has_2fa': _has_2fa(user),
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
    # Двофакторна автентифікація: якщо є підтверджений TOTP-пристрій — вимагаємо код
    from django_otp.plugins.otp_totp.models import TOTPDevice
    confirmed = TOTPDevice.objects.filter(user=user, confirmed=True)
    if confirmed.exists():
        otp = (request.data.get('otp_token') or '').strip().replace(' ', '')
        if not otp:
            return Response({'detail': 'Введіть код із застосунку автентифікації.', 'otp_required': True}, status=401)
        if not any(d.verify_token(otp) for d in confirmed):
            return Response({'detail': 'Невірний код двофакторної автентифікації.', 'otp_required': True}, status=401)
    # Ротація токена: видаляємо старий і створюємо новий — сесія завжди свіжа
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response({'token': token.key, 'user': _user_payload(user)})


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Вихід виконано.'})


@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_me(request):
    return Response({'user': _user_payload(request.user)})


# ============================================================================
# Статистика для дашборда
# ============================================================================
_UA_MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']


@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
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
    new_applications = EnrollmentApplication.objects.filter(
        status=EnrollmentApplication.Status.NEW
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
    reviews_chart = [
        {'label': _UA_MONTHS[mm - 1],
         'value': Review.objects.filter(created_at__year=yy, created_at__month=mm).count()}
        for (yy, mm) in buckets
    ]

    from .models import PushSubscription
    subscriptions = PushSubscription.objects.filter(is_active=True).count()

    return Response({
        'pending_reviews': pending_reviews,
        'new_questions': new_questions,
        'new_applications': new_applications,
        'subscriptions': subscriptions,
        'totals': totals,
        'chart': chart,
        'reviews_chart': reviews_chart,
        'recent': _history_feed(8),
    })


# ============================================================================
# Модерація Відгуків
# ============================================================================
class AdminReviewViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                         mixins.DestroyModelMixin, viewsets.GenericViewSet):
    authentication_classes = [ExpiringTokenAuthentication]
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
    authentication_classes = [ExpiringTokenAuthentication]
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
# Заявки на зарахування (онлайн-форма від батьків)
# ============================================================================
class AdminEnrollmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    handled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EnrollmentApplication
        fields = ['id', 'child_name', 'child_birth_date', 'parent_name', 'phone',
                  'email', 'desired_start', 'note', 'status', 'status_display',
                  'admin_note', 'handled_by_name', 'handled_at', 'created_at']
        read_only_fields = ['child_name', 'child_birth_date', 'parent_name', 'phone',
                            'email', 'desired_start', 'note', 'status_display',
                            'handled_by_name', 'handled_at', 'created_at']

    def get_handled_by_name(self, obj):
        u = obj.handled_by
        return (u.get_full_name() or u.username) if u else None


class AdminEnrollmentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                             mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                             viewsets.GenericViewSet):
    authentication_classes = [ExpiringTokenAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = AdminEnrollmentSerializer
    pagination_class = None
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        qs = EnrollmentApplication.objects.all().order_by('-created_at')
        st = self.request.query_params.get('status')
        if st in dict(EnrollmentApplication.Status.choices):
            qs = qs.filter(status=st)
        return qs

    def perform_update(self, serializer):
        obj = serializer.save()
        closed = (EnrollmentApplication.Status.APPROVED,
                  EnrollmentApplication.Status.REJECTED,
                  EnrollmentApplication.Status.DONE)
        if obj.status in closed and obj.handled_at is None:
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
    event_type_display = serializers.CharField(source='type_label', read_only=True)

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
    authentication_classes = [ExpiringTokenAuthentication]
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None


class AdminNewsViewSet(_ContentViewSet):
    serializer_class = AdminNewsSerializer
    queryset = News.objects.all().order_by('-created_at').prefetch_related('tags')


class AdminEventViewSet(_ContentViewSet):
    serializer_class = AdminEventSerializer
    queryset = Event.objects.all().order_by('-start_date')


class AdminEventTypeSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = EventType
        fields = ['id', 'name', 'slug', 'color', 'order']
        extra_kwargs = {'slug': {'required': False}}


class AdminEventTypeViewSet(_ContentViewSet):
    serializer_class = AdminEventTypeSerializer
    queryset = EventType.objects.all().order_by('order', 'id')


class AdminFAQItemViewSet(_ContentViewSet):
    serializer_class = AdminFAQItemSerializer
    queryset = FAQItem.objects.all().order_by('order', 'id')


# ============================================================================
# Довідники (категорії / теги) та Документи
# ============================================================================
class AdminNewsCategorySerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug']
        extra_kwargs = {'slug': {'required': False}}


class AdminNewsTagSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = NewsTag
        fields = ['id', 'name', 'slug']
        extra_kwargs = {'slug': {'required': False}}


class AdminGalleryCategorySerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = GalleryCategory
        fields = ['id', 'name', 'slug', 'icon', 'color', 'order']
        extra_kwargs = {'slug': {'required': False}}


class AdminDocumentCategorySerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'slug', 'order']
        extra_kwargs = {'slug': {'required': False}}


class AdminFAQCategorySerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'

    class Meta:
        model = FAQCategory
        fields = ['id', 'name', 'slug', 'icon', 'color', 'order']
        extra_kwargs = {'slug': {'required': False}}


class AdminDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)
    category = serializers.PrimaryKeyRelatedField(queryset=DocumentCategory.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    file_size = serializers.CharField(source='get_file_size', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'category', 'category_name', 'file', 'file_size',
                  'description', 'is_published', 'downloads', 'created_at']
        read_only_fields = ['downloads', 'created_at']


class AdminNewsCategoryViewSet(_ContentViewSet):
    serializer_class = AdminNewsCategorySerializer
    queryset = NewsCategory.objects.all().order_by('name')


class AdminNewsTagViewSet(_ContentViewSet):
    serializer_class = AdminNewsTagSerializer
    queryset = NewsTag.objects.all().order_by('name')


class AdminGalleryCategoryViewSet(_ContentViewSet):
    serializer_class = AdminGalleryCategorySerializer
    queryset = GalleryCategory.objects.all().order_by('order', 'name')


class AdminDocumentCategoryViewSet(_ContentViewSet):
    serializer_class = AdminDocumentCategorySerializer
    queryset = DocumentCategory.objects.all().order_by('order', 'name')


class AdminFAQCategoryViewSet(_ContentViewSet):
    serializer_class = AdminFAQCategorySerializer
    queryset = FAQCategory.objects.all().order_by('order', 'name')


class AdminDocumentViewSet(_ContentViewSet):
    serializer_class = AdminDocumentSerializer
    queryset = Document.objects.all().order_by('-created_at')


@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_meta(request):
    """Дані для випадаючих списків у формах контенту."""
    return Response({
        'news_categories': [{'id': c.id, 'name': c.name} for c in NewsCategory.objects.all()],
        'news_tags': [{'id': t.id, 'name': t.name} for t in NewsTag.objects.all()],
        'faq_categories': [{'id': c.id, 'name': c.name} for c in FAQCategory.objects.all()],
        'document_categories': [{'id': c.id, 'name': c.name} for c in DocumentCategory.objects.all()],
        'event_types': [{'value': t.slug, 'label': t.name} for t in EventType.objects.all()],
        'groups': [{'id': g.id, 'name': g.name} for g in Group.objects.filter(is_published=True)],
        'news_statuses': [{'value': v, 'label': lbl} for v, lbl in News.Status.choices],
        'gallery_albums': [{'id': a.id, 'name': a.title} for a in GalleryAlbum.objects.all()],
        'gallery_categories': [{'id': c.id, 'name': c.name} for c in GalleryCategory.objects.all()],
        'age_groups': [{'value': v, 'label': lbl} for v, lbl in Group.AGE_CHOICES],
    })


# ============================================================================
# Сторінки сайту: Контакти (singleton), Слайдер, Штат, Сторінки (+фото-інлайн)
# ============================================================================
class AdminContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'address', 'phone', 'email', 'working_hours', 'map_embed',
                  'facebook_url', 'instagram_url', 'youtube_url']


@api_view(['GET', 'PATCH'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_contact(request):
    """Єдиний запис контактів (singleton)."""
    obj = Contact.objects.first()
    if obj is None:
        obj = Contact.objects.create(address='', phone='', email='', working_hours='')
    if request.method == 'PATCH':
        ser = AdminContactSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    return Response(AdminContactSerializer(obj).data)


class AdminSliderSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False, allow_null=True)
    video = serializers.FileField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Slider
        fields = ['id', 'title', 'description', 'image', 'video', 'link', 'order', 'is_active']


class AdminStaffMemberSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = StaffMember
        fields = ['id', 'full_name', 'position', 'photo', 'education', 'experience', 'category',
                  'awards', 'bio', 'email', 'phone', 'reception_hours', 'is_featured',
                  'accent_color', 'detail_url', 'order', 'is_active']


class AdminPageSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Page
        fields = ['id', 'title', 'slug', 'content', 'image', 'is_published', 'order', 'updated_at']
        read_only_fields = ['updated_at']
        extra_kwargs = {'slug': {'required': False}}


class AdminPageImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = PageImage
        fields = ['id', 'page', 'image', 'caption', 'order', 'is_active']


class AdminSliderViewSet(_ContentViewSet):
    serializer_class = AdminSliderSerializer
    queryset = Slider.objects.all().order_by('order', 'id')


class AdminTourStopSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = TourStop
        fields = ['id', 'title', 'description', 'image', 'order', 'is_published']


class AdminTourStopViewSet(_ContentViewSet):
    serializer_class = AdminTourStopSerializer
    queryset = TourStop.objects.all().order_by('order', 'id')


class AdminStaffMemberViewSet(_ContentViewSet):
    serializer_class = AdminStaffMemberSerializer
    queryset = StaffMember.objects.all().order_by('order', 'id')


class AdminPageViewSet(_ContentViewSet):
    serializer_class = AdminPageSerializer
    queryset = Page.objects.all().order_by('order', 'id')


class AdminPageImageViewSet(_ContentViewSet):
    serializer_class = AdminPageImageSerializer

    def get_queryset(self):
        qs = PageImage.objects.all().order_by('order', 'id')
        page = self.request.query_params.get('page')
        return qs.filter(page_id=page) if page else qs


# ============================================================================
# Групи (+ персонал) та Гуртки (+ переваги/розклад)
# ============================================================================
class AdminGroupSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'
    cover = serializers.ImageField(use_url=True, required=False, allow_null=True)
    album = serializers.PrimaryKeyRelatedField(queryset=GalleryAlbum.objects.all(), required=False, allow_null=True)
    age_group_display = serializers.CharField(source='get_age_group_display', read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'slug', 'age_group', 'age_group_display', 'motto', 'description',
                  'cover', 'color', 'album', 'order', 'is_published']
        extra_kwargs = {'slug': {'required': False}}


class AdminGroupStaffSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = GroupStaff
        fields = ['id', 'group', 'role', 'full_name', 'photo', 'birth_date', 'education', 'experience', 'motto', 'order']


class AdminCircleSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'name'
    cover = serializers.ImageField(use_url=True, required=False, allow_null=True)
    album = serializers.PrimaryKeyRelatedField(queryset=GalleryAlbum.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Circle
        fields = ['id', 'name', 'slug', 'tagline', 'leader', 'age_group', 'schedule', 'duration',
                  'format', 'price', 'icon', 'color', 'cover', 'goal', 'description', 'album',
                  'is_featured', 'order', 'is_published']
        extra_kwargs = {'slug': {'required': False}}


class AdminCircleBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircleBenefit
        fields = ['id', 'circle', 'icon', 'title', 'text', 'order']


class AdminCircleSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircleSession
        fields = ['id', 'circle', 'day', 'time', 'note', 'order']


class AdminGroupViewSet(_ContentViewSet):
    serializer_class = AdminGroupSerializer
    queryset = Group.objects.all().order_by('order', 'name')


class AdminGroupStaffViewSet(_ContentViewSet):
    serializer_class = AdminGroupStaffSerializer

    def get_queryset(self):
        qs = GroupStaff.objects.all().order_by('order', 'id')
        g = self.request.query_params.get('group')
        return qs.filter(group_id=g) if g else qs


class AdminCircleViewSet(_ContentViewSet):
    serializer_class = AdminCircleSerializer
    queryset = Circle.objects.all().order_by('order', 'name')


class AdminCircleBenefitViewSet(_ContentViewSet):
    serializer_class = AdminCircleBenefitSerializer

    def get_queryset(self):
        qs = CircleBenefit.objects.all().order_by('order', 'id')
        c = self.request.query_params.get('circle')
        return qs.filter(circle_id=c) if c else qs


class AdminCircleSessionViewSet(_ContentViewSet):
    serializer_class = AdminCircleSessionSerializer

    def get_queryset(self):
        qs = CircleSession.objects.all().order_by('order', 'id')
        c = self.request.query_params.get('circle')
        return qs.filter(circle_id=c) if c else qs


# ============================================================================
# Меню: денні меню (CRUD) + шаблон тижня-основи (7 днів, редагування разом)
# ============================================================================
_MEAL_FIELDS = ['breakfast', 'second_breakfast', 'lunch', 'snack', 'dinner']


class AdminDailyMenuSerializer(serializers.ModelSerializer):
    weekday_display = serializers.SerializerMethodField()
    has_any_meal = serializers.ReadOnlyField()

    class Meta:
        model = DailyMenu
        fields = ['id', 'date', 'weekday_display', 'breakfast', 'second_breakfast',
                  'lunch', 'snack', 'dinner', 'note', 'is_published', 'has_any_meal',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_weekday_display(self, obj):
        return _WEEKDAYS_UK[obj.date.weekday()]


class AdminMenuTemplateSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = MenuTemplate
        fields = ['weekday', 'weekday_display', 'breakfast', 'second_breakfast',
                  'lunch', 'snack', 'dinner', 'note', 'is_active']


class AdminDailyMenuViewSet(_ContentViewSet):
    """CRUD денних меню. Лукап за pk (для редагування), сортування — найновіші зверху."""
    serializer_class = AdminDailyMenuSerializer
    queryset = DailyMenu.objects.all().order_by('-date')

    @action(detail=True, methods=['post'])
    def duplicate_next_week(self, request, pk=None):
        """Копіює меню на ту саму дату +7 днів. Якщо меню на цю дату вже існує — 400."""
        original = self.get_object()
        new_date = original.date + timedelta(days=7)
        if DailyMenu.objects.filter(date=new_date).exists():
            return Response(
                {'detail': f'Меню на {new_date.strftime("%d.%m.%Y")} вже існує.'},
                status=400,
            )
        copy = DailyMenu.objects.create(
            date=new_date,
            breakfast=original.breakfast,
            second_breakfast=original.second_breakfast,
            lunch=original.lunch,
            snack=original.snack,
            dinner=original.dinner,
            note=original.note,
            is_published=original.is_published,
        )
        return Response(self.get_serializer(copy).data, status=201)


@api_view(['GET', 'PUT'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_menu_templates(request):
    """Шаблон-основа меню по днях тижня. Завжди повертає 7 днів (Пн-Нд),
    навіть якщо для якогось дня запису ще немає (тоді — порожні поля).

    GET  → список із 7 елементів.
    PUT  → приймає список елементів {weekday, ...страви...}; для кожного робить
           update_or_create за днем тижня. Повертає оновлений список із 7.
    """
    if request.method == 'PUT':
        items = request.data if isinstance(request.data, list) else request.data.get('templates', [])
        for item in items:
            wd = item.get('weekday')
            try:
                wd = int(wd)
            except (TypeError, ValueError):
                continue
            if wd not in range(7):
                continue
            MenuTemplate.objects.update_or_create(
                weekday=wd,
                defaults={
                    **{f: (item.get(f) or '') for f in _MEAL_FIELDS},
                    'note': item.get('note') or '',
                    'is_active': bool(item.get('is_active', True)),
                },
            )

    existing = {t.weekday: t for t in MenuTemplate.objects.all()}
    result = []
    for wd, label in MenuTemplate.WEEKDAY_CHOICES:
        tpl = existing.get(wd)
        if tpl:
            result.append(AdminMenuTemplateSerializer(tpl).data)
        else:
            result.append({
                'weekday': wd, 'weekday_display': label,
                'breakfast': '', 'second_breakfast': '', 'lunch': '',
                'snack': '', 'dinner': '', 'note': '', 'is_active': True,
            })
    return Response(result)


# ============================================================================
# Галерея: альбоми + фото (масове завантаження, поворот 90°, сортування)
# ============================================================================
class AdminGalleryAlbumSerializer(_AutoSlugMixin, serializers.ModelSerializer):
    slug_source = 'title'
    cover = serializers.ImageField(use_url=True, required=False, allow_null=True)
    category = serializers.PrimaryKeyRelatedField(queryset=GalleryCategory.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    photos_count = serializers.IntegerField(source='photos.count', read_only=True)

    class Meta:
        model = GalleryAlbum
        fields = ['id', 'title', 'slug', 'description', 'cover', 'category',
                  'category_name', 'photos_count', 'created_at', 'is_published']
        read_only_fields = ['created_at']
        extra_kwargs = {'slug': {'required': False}}


class AdminGalleryPhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = GalleryPhoto
        fields = ['id', 'album', 'image', 'title', 'description', 'order']


class AdminGalleryAlbumViewSet(_ContentViewSet):
    serializer_class = AdminGalleryAlbumSerializer
    queryset = GalleryAlbum.objects.all().select_related('category').order_by('-created_at')


class AdminGalleryPhotoViewSet(_ContentViewSet):
    serializer_class = AdminGalleryPhotoSerializer

    def get_queryset(self):
        qs = GalleryPhoto.objects.all().order_by('order', 'id')
        album = self.request.query_params.get('album')
        return qs.filter(album_id=album) if album else qs

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Масове завантаження фото в альбом (FormData: album + кілька 'images')."""
        album = GalleryAlbum.objects.filter(pk=request.data.get('album')).first()
        if not album:
            return Response({'detail': 'Альбом не знайдено.'}, status=400)
        files = request.FILES.getlist('images')
        if not files:
            return Response({'detail': 'Не передано жодного фото.'}, status=400)
        start = album.photos.count()
        created = [GalleryPhoto.objects.create(album=album, image=f, order=start + i)
                   for i, f in enumerate(files)]
        ser = AdminGalleryPhotoSerializer(created, many=True, context=self.get_serializer_context())
        return Response(ser.data, status=201)

    @action(detail=True, methods=['post'])
    def rotate(self, request, pk=None):
        """Поворот фото на 90° (direction: 'cw' за год. стрілкою / 'ccw' проти) через PIL."""
        photo = self.get_object()
        if not photo.image:
            return Response({'detail': 'Фото відсутнє.'}, status=400)
        degrees = -90 if request.data.get('direction', 'cw') == 'cw' else 90
        try:
            from PIL import Image
            path = photo.image.path
            with Image.open(path) as img:
                img.rotate(degrees, expand=True).save(path)
        except Exception as e:
            return Response({'detail': f'Не вдалося повернути: {e}'}, status=400)
        return Response(self.get_serializer(photo).data)


# ============================================================================
# Батькам — 5 пласких моделей (реюз публічних серіалізаторів)
# ============================================================================
class AdminParentsAnnouncementViewSet(_ContentViewSet):
    serializer_class = ParentsAnnouncementSerializer
    queryset = ParentsAnnouncement.objects.all().order_by('order', '-id')


class AdminParentsDocumentViewSet(_ContentViewSet):
    serializer_class = ParentsDocumentSerializer
    queryset = ParentsDocument.objects.all().order_by('order', 'title')


class AdminParentsAdaptationPhotoViewSet(_ContentViewSet):
    serializer_class = ParentsAdaptationPhotoSerializer
    queryset = ParentsAdaptationPhoto.objects.all().order_by('order', '-id')


class AdminParentsEnrollmentDocViewSet(_ContentViewSet):
    serializer_class = ParentsEnrollmentDocSerializer
    queryset = ParentsEnrollmentDoc.objects.all().order_by('order', 'id')


class AdminParentsApplicationSampleViewSet(_ContentViewSet):
    serializer_class = ParentsApplicationSampleSerializer
    queryset = ParentsApplicationSample.objects.all().order_by('order', '-id')


# ============================================================================
# Атестація — 4 списки + налаштування (singleton)
# ============================================================================
class AdminAttestationDocumentViewSet(_ContentViewSet):
    serializer_class = AttestationDocumentSerializer
    queryset = AttestationDocument.objects.all().order_by('order', 'id')


class AdminAttestationStepViewSet(_ContentViewSet):
    serializer_class = AttestationStepSerializer
    queryset = AttestationStep.objects.all().order_by('order', 'id')


class AdminAttestationCategoryViewSet(_ContentViewSet):
    serializer_class = AttestationCategorySerializer
    queryset = AttestationCategory.objects.all().order_by('order', 'id')


class AdminAttestationLawViewSet(_ContentViewSet):
    serializer_class = AttestationLawSerializer
    queryset = AttestationLaw.objects.all().order_by('order', 'id')


@api_view(['GET', 'PATCH'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_attestation_settings(request):
    """Єдиний запис налаштувань сторінки атестації (singleton)."""
    obj = AttestationSettings.get_solo()
    if request.method == 'PATCH':
        ser = AttestationSettingsSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    return Response(AttestationSettingsSerializer(obj).data)


# ============================================================================
# Спеціалісти — master-detail: сторінка → спеціалісти(+альбоми), розділи(+фото)
# ============================================================================
class AdminSpecialistPageSerializer(serializers.ModelSerializer):
    page_type_display = serializers.CharField(source='get_page_type_display', read_only=True)
    specialists_count = serializers.IntegerField(source='specialists.count', read_only=True)
    sections_count = serializers.IntegerField(source='sections.count', read_only=True)

    class Meta:
        model = SpecialistPage
        fields = ['id', 'page_type', 'page_type_display', 'title', 'intro', 'description',
                  'theme_title', 'theme_period', 'theme_text',
                  'specialists_count', 'sections_count']


class AdminSpecialistSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Specialist
        fields = ['id', 'page', 'full_name', 'position', 'photo', 'birth_date',
                  'education', 'experience', 'category', 'motto', 'bio', 'order']


class AdminSpecialistAlbumSerializer(serializers.ModelSerializer):
    album_title = serializers.CharField(source='album.title', read_only=True)
    album_cover = serializers.ImageField(source='album.cover', use_url=True, read_only=True)

    class Meta:
        model = SpecialistAlbum
        fields = ['id', 'specialist', 'album', 'album_title', 'album_cover', 'description', 'order']


class AdminSpecialistPageSectionSerializer(serializers.ModelSerializer):
    photos_count = serializers.IntegerField(source='photos.count', read_only=True)
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)

    class Meta:
        model = SpecialistPageSection
        fields = ['id', 'page', 'title', 'subtitle', 'description', 'icon', 'accent', 'kind',
                  'kind_display', 'link_album', 'link_news_slug', 'link_external_url',
                  'link_label', 'order', 'is_active', 'photos_count']


class AdminSpecialistPagePhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = SpecialistPagePhoto
        fields = ['id', 'section', 'image', 'caption', 'order', 'is_active']


class AdminSpecialistPageViewSet(_ContentViewSet):
    serializer_class = AdminSpecialistPageSerializer
    queryset = SpecialistPage.objects.all().order_by('id')


class AdminSpecialistViewSet(_ContentViewSet):
    serializer_class = AdminSpecialistSerializer

    def get_queryset(self):
        qs = Specialist.objects.all().order_by('order', 'id')
        page = self.request.query_params.get('page')
        return qs.filter(page_id=page) if page else qs


class AdminSpecialistAlbumViewSet(_ContentViewSet):
    serializer_class = AdminSpecialistAlbumSerializer

    def get_queryset(self):
        qs = SpecialistAlbum.objects.all().select_related('album').order_by('order', 'id')
        sp = self.request.query_params.get('specialist')
        return qs.filter(specialist_id=sp) if sp else qs


class AdminSpecialistPageSectionViewSet(_ContentViewSet):
    serializer_class = AdminSpecialistPageSectionSerializer

    def get_queryset(self):
        qs = SpecialistPageSection.objects.all().order_by('order', 'id')
        page = self.request.query_params.get('page')
        return qs.filter(page_id=page) if page else qs


class AdminSpecialistPagePhotoViewSet(_ContentViewSet):
    serializer_class = AdminSpecialistPagePhotoSerializer

    def get_queryset(self):
        qs = SpecialistPagePhoto.objects.all().order_by('order', 'id')
        section = self.request.query_params.get('section')
        return qs.filter(section_id=section) if section else qs


# ============================================================================
# СИСТЕМНЕ (Фаза 9): користувачі/права, історія змін, push-розсилка
# ============================================================================
User = get_user_model()


class IsSuperUser(IsAdminUser):
    """Доступ лише суперкористувачам (керування акаунтами)."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_active and u.is_staff and u.is_superuser)


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email',
                  'is_staff', 'is_superuser', 'is_active', 'last_login', 'date_joined']
        read_only_fields = ['last_login', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


def _is_false(data, key):
    return key in data and data[key] in (False, 'false', 'False', '0', 0)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Керування акаунтами (лише суперкористувачі). Хеші паролів не віддаються;
    пароль задається окремою дією set_password. Захист від самоблокування."""
    authentication_classes = [ExpiringTokenAuthentication]
    permission_classes = [IsSuperUser]
    serializer_class = AdminUserSerializer
    pagination_class = None
    http_method_names = ['get', 'post', 'patch', 'delete']
    queryset = User.objects.all().order_by('-is_superuser', '-is_staff', 'username')

    def create(self, request, *args, **kwargs):
        pwd = request.data.get('password') or ''
        if len(pwd) < 6:
            return Response({'detail': 'Пароль має містити щонайменше 6 символів.'}, status=400)
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        user.set_password(pwd)
        user.save(update_fields=['password'])
        return Response(self.get_serializer(user).data, status=201)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            if _is_false(request.data, 'is_superuser'):
                return Response({'detail': 'Не можна зняти власні права суперкористувача.'}, status=400)
            if _is_false(request.data, 'is_active'):
                return Response({'detail': 'Не можна деактивувати власний акаунт.'}, status=400)
            if _is_false(request.data, 'is_staff'):
                return Response({'detail': 'Не можна зняти власний доступ до адмінпанелі.'}, status=400)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().pk == request.user.pk:
            return Response({'detail': 'Не можна видалити власний акаунт.'}, status=400)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        pwd = request.data.get('password') or ''
        if len(pwd) < 6:
            return Response({'detail': 'Пароль має містити щонайменше 6 символів.'}, status=400)
        user = self.get_object()
        user.set_password(pwd)
        user.save(update_fields=['password'])
        return Response({'detail': 'Пароль змінено.'})


# --- Історія змін (simple_history, read-only) ---
_HISTORY_TYPE = {'+': 'створено', '~': 'змінено', '-': 'видалено'}


def _history_feed(limit=40):
    """Об'єднана стрічка останніх змін по моделях із HistoricalRecords."""
    items = []

    def collect(qs, label, repr_fn):
        for h in qs.select_related('history_user')[:limit]:
            items.append({
                'model': label,
                'repr': repr_fn(h),
                'type': h.history_type,
                'type_display': _HISTORY_TYPE.get(h.history_type, h.history_type),
                'user': (h.history_user.get_full_name() or h.history_user.username) if h.history_user else 'Система',
                'date': h.history_date,
            })

    try:
        collect(News.history.all(), 'Новина', lambda h: h.title)
        collect(Page.history.all(), 'Сторінка', lambda h: h.title)
        collect(DailyMenu.history.all(), 'Меню', lambda h: f"Меню на {h.date.strftime('%d.%m.%Y')}")
    except Exception:
        pass
    items.sort(key=lambda x: x['date'], reverse=True)
    return items[:limit]


@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_history(request):
    return Response({'items': _history_feed(50)})


# --- Push-розсилка ---
@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_push_subscriptions(request):
    from urllib.parse import urlparse
    from .models import PushSubscription
    qs = PushSubscription.objects.all().order_by('-created_at')
    items = [{
        'id': s.id,
        'user_agent': s.user_agent or '—',
        'topics': s.topics or [],
        'is_active': s.is_active,
        'created_at': s.created_at,
        'host': urlparse(s.endpoint).netloc if s.endpoint else '',
    } for s in qs[:50]]
    return Response({'total': qs.count(), 'active': qs.filter(is_active=True).count(), 'items': items})


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_push_send(request):
    title = (request.data.get('title') or '').strip()
    body = (request.data.get('body') or '').strip()
    topic = (request.data.get('topic') or '').strip()
    url = (request.data.get('url') or '').strip() or {'news': '/news', 'events': '/events'}.get(topic, '/')
    if not title or not body:
        return Response({'detail': 'Вкажіть заголовок і текст сповіщення.'}, status=400)
    from .push import send_to_all, send_to_topic
    sent = send_to_topic(topic, title, body, url) if topic else send_to_all(title, body, url)
    return Response({'sent': sent})


# ============================================================================
# Власний профіль (будь-який персонал) + 2FA (TOTP)
# ============================================================================
@api_view(['GET', 'PATCH'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_profile(request):
    """Редагування ВЛАСНОГО профілю. Права (is_staff/superuser) тут не змінюються."""
    u = request.user
    if request.method == 'PATCH':
        for f in ('first_name', 'last_name', 'email'):
            if f in request.data:
                setattr(u, f, (request.data.get(f) or '').strip())
        new_username = (request.data.get('username') or '').strip()
        if new_username and new_username != u.username:
            if User.objects.exclude(pk=u.pk).filter(username=new_username).exists():
                return Response({'detail': 'Такий логін уже зайнятий.'}, status=400)
            u.username = new_username
        u.save()
    return Response({
        'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name,
        'email': u.email, 'is_superuser': u.is_superuser, 'has_2fa': _has_2fa(u),
    })


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_change_password(request):
    """Зміна власного пароля (з підтвердженням поточного)."""
    u = request.user
    if not u.check_password(request.data.get('old_password') or ''):
        return Response({'detail': 'Поточний пароль невірний.'}, status=400)
    new = request.data.get('new_password') or ''
    if len(new) < 6:
        return Response({'detail': 'Новий пароль має містити щонайменше 6 символів.'}, status=400)
    u.set_password(new)
    u.save(update_fields=['password'])
    return Response({'detail': 'Пароль змінено.'})


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_2fa_setup(request):
    """Починає налаштування TOTP: створює непідтверджений пристрій, повертає otpauth-URL для QR."""
    from django_otp.plugins.otp_totp.models import TOTPDevice
    u = request.user
    if _has_2fa(u):
        return Response({'detail': '2FA вже увімкнено.'}, status=400)
    TOTPDevice.objects.filter(user=u, confirmed=False).delete()
    dev = TOTPDevice.objects.create(user=u, name='default', confirmed=False)
    return Response({'config_url': dev.config_url})


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_2fa_confirm(request):
    """Підтверджує TOTP кодом із застосунку → вмикає 2FA."""
    from django_otp.plugins.otp_totp.models import TOTPDevice
    u = request.user
    token = (request.data.get('token') or '').strip().replace(' ', '')
    dev = TOTPDevice.objects.filter(user=u, confirmed=False).order_by('-id').first()
    if not dev:
        return Response({'detail': 'Спершу почніть налаштування 2FA.'}, status=400)
    if not token or not dev.verify_token(token):
        return Response({'detail': 'Невірний код. Спробуйте ще раз.'}, status=400)
    dev.confirmed = True
    dev.save()
    TOTPDevice.objects.filter(user=u, confirmed=False).delete()
    return Response({'detail': 'Двофакторну автентифікацію увімкнено.', 'has_2fa': True})


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_2fa_disable(request):
    """Вимикає 2FA (з підтвердженням пароля)."""
    from django_otp.plugins.otp_totp.models import TOTPDevice
    u = request.user
    if not u.check_password(request.data.get('password') or ''):
        return Response({'detail': 'Введіть поточний пароль для вимкнення 2FA.'}, status=400)
    TOTPDevice.objects.filter(user=u).delete()
    return Response({'detail': 'Двофакторну автентифікацію вимкнено.', 'has_2fa': False})


# ============================================================================
# ШІ (Gemini): налаштування авто-модерації + генерація тексту
# ============================================================================
class AdminAISettingsSerializer(serializers.ModelSerializer):
    ai_configured = serializers.SerializerMethodField()

    class Meta:
        model = AISettings
        fields = ['auto_moderate_reviews', 'ai_configured']

    def get_ai_configured(self, obj):
        from . import ai
        return ai.is_configured()


@api_view(['GET', 'PATCH'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_ai_settings(request):
    obj = AISettings.get_solo()
    if request.method == 'PATCH':
        ser = AdminAISettingsSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
    return Response(AdminAISettingsSerializer(obj).data)


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_ai_generate(request):
    """Генерація HTML-тексту з короткого брифу. kind визначає стиль/довжину."""
    from . import ai
    brief = (request.data.get('brief') or '').strip()
    kind = (request.data.get('kind') or 'generic').strip()
    tone = (request.data.get('tone') or 'warm').strip()
    
    if len(brief) < 3:
        return Response({'detail': 'Опишіть коротко, про що має бути текст.'}, status=400)
    if not ai.is_configured():
        return Response({'detail': 'ШІ не налаштовано (немає ключа в .env).'}, status=503)
    try:
        text = ai.generate_text(brief, kind, tone)
    except ai.AIError as e:
        return Response({'detail': f'ШІ зараз недоступний: {e}'}, status=502)
    return Response({'text': text})

# ============================================================================
# Аналітика чатів ШІ
# ============================================================================
from .models import ChatLog

class AdminChatLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatLog
        fields = ['id', 'question', 'sources_found', 'created_at']

from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache

@method_decorator(never_cache, name='dispatch')
class AdminChatLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Доступ до історії чатів для керівництва.
    Додає custom endpoint /analyze/ для генерації аналітики ШІ.
    """
    queryset = ChatLog.objects.all().order_by('-created_at')
    serializer_class = AdminChatLogSerializer
    pagination_class = None
    authentication_classes = [ExpiringTokenAuthentication]
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def analyze(self, request):
        from django.utils import timezone
        import datetime
        from . import ai
        
        days = int(request.data.get('days', 7))
        hide_answered = bool(request.data.get('hide_answered', True))
        
        start_date = timezone.now() - datetime.timedelta(days=days)
        qs = self.get_queryset().filter(created_at__gte=start_date)
        
        if hide_answered:
            qs = qs.filter(sources_found=False)
            
        logs_data = [{'q': item.question, 'found': item.sources_found} for item in qs]
        if not logs_data:
            return Response({'detail': 'За вибраний період немає запитів для аналізу.'}, status=400)
            
        if not ai.is_configured():
            return Response({'detail': 'ШІ не налаштовано.'}, status=503)
            
        try:
            report = ai.analyze_chat_logs(logs_data, hide_answered=hide_answered)
            return Response({'report': report})
        except ai.AIError as e:
            return Response({'detail': f'Помилка ШІ: {e}'}, status=502)
\ n @ a p i _ v i e w ( [ ' G E T ' ] ) \ n @ a u t h e n t i c a t i o n _ c l a s s e s ( [ E x p i r i n g T o k e n A u t h e n t i c a t i o n ] ) \ n @ p e r m i s s i o n _ c l a s s e s ( [ I s A d m i n U s e r ] ) \ n d e f   g e t _ u p c o m i n g _ h o l i d a y _ a p i ( r e q u e s t ) : \ n         f r o m   . h o l i d a y s   i m p o r t   g e t _ u p c o m i n g _ h o l i d a y \ n         h o l i d a y   =   g e t _ u p c o m i n g _ h o l i d a y ( d a y s _ a h e a d = 1 4 ) \ n         r e t u r n   R e s p o n s e ( { ' h o l i d a y ' :   h o l i d a y } ) \ n  
 

@api_view(['GET'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAdminUser])
def admin_upcoming_holiday(request):
    from .holidays import get_upcoming_holiday
    holiday = get_upcoming_holiday(days_ahead=14)
    return Response(holiday)

