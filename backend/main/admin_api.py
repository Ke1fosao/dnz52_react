"""
API адмінпанелі (React, /manage) — захищений namespace `/api/v1/admin/...`.

Окремо від публічного API (який AllowAny + read-only). Тут — TokenAuthentication
+ IsAdminUser. Вхід проходить через django-axes (захист від брутфорсу).
Фаза 1: автентифікація, статистика дашборда, модерація Відгуків і Питань FAQ.
"""
from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from rest_framework import viewsets, serializers, mixins
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, action,
)
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from reviews.models import Review
from faq.models import FAQQuestionSubmission


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
