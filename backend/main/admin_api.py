"""
API адмінпанелі (React, /manage) — захищений namespace `/api/v1/admin/...`.

Окремо від публічного API (який AllowAny + read-only). Тут — TokenAuthentication
+ IsAdminUser. Вхід проходить через django-axes (захист від брутфорсу).
Фаза 1: автентифікація, статистика дашборда, модерація Відгуків і Питань FAQ.
"""
from datetime import timedelta

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
from groups.models import Group, GroupStaff
from circles.models import Circle, CircleBenefit, CircleSession
from gallery.models import GalleryCategory, GalleryAlbum, GalleryPhoto
from documents.models import Document, DocumentCategory
from menu.models import DailyMenu, MenuTemplate
from .models import Page, PageImage, Slider, Contact, StaffMember


_WEEKDAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']


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
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminUser])
def admin_meta(request):
    """Дані для випадаючих списків у формах контенту."""
    return Response({
        'news_categories': [{'id': c.id, 'name': c.name} for c in NewsCategory.objects.all()],
        'news_tags': [{'id': t.id, 'name': t.name} for t in NewsTag.objects.all()],
        'faq_categories': [{'id': c.id, 'name': c.name} for c in FAQCategory.objects.all()],
        'document_categories': [{'id': c.id, 'name': c.name} for c in DocumentCategory.objects.all()],
        'event_types': [{'value': v, 'label': lbl} for v, lbl in Event.EVENT_TYPE_CHOICES],
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
@authentication_classes([TokenAuthentication])
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
@authentication_classes([TokenAuthentication])
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
