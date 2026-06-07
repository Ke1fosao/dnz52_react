"""
Django management command — генерує .webp версії всіх зображень.
Працює з будь-яким бекендом сховища (локальна ФС і S3/Supabase Storage).

Запуск:
  python manage.py generate_webp                 # генерувати нові
  python manage.py generate_webp --force         # перегенерувати навіть якщо .webp вже є
  python manage.py generate_webp --quality 80    # якість (default 82)
  python manage.py generate_webp --dry-run       # показати без змін

Принцип: читає ImageField з БД, конвертує в пам'яті, зберігає через default_storage.
         Шлях: gallery/photos/photo.jpg → gallery/photos/photo.webp
"""
import os
import re
from io import BytesIO

from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# (app_label, model_name, field_name) — ті самі, що у image_signals.py
_IMAGE_FIELDS = [
    ('main', 'Page',                     'image'),
    ('main', 'PageImage',                'image'),
    ('main', 'Slider',                   'image'),
    ('main', 'ParentsAnnouncement',      'image'),
    ('main', 'ParentsAdaptationPhoto',   'image'),
    ('main', 'ParentsApplicationSample', 'image'),
    ('main', 'StaffMember',              'photo'),
    ('gallery', 'GalleryAlbum',          'cover'),
    ('gallery', 'GalleryPhoto',          'image'),
    ('news', 'News',                     'image'),
    ('groups', 'Group',                  'cover'),
    ('groups', 'GroupStaff',             'photo'),
    ('circles', 'Circle',                'cover'),
    ('specialists', 'Specialist',        'photo'),
    ('specialists', 'SpecialistPagePhoto', 'image'),
    ('events', 'Event',                  'image'),
]


def _webp_name(storage_name: str) -> str:
    """gallery/photos/photo.jpg → gallery/photos/photo.webp"""
    return re.sub(r'\.(jpe?g|png)$', '.webp', storage_name, flags=re.IGNORECASE)


class Command(BaseCommand):
    help = 'Генерує .webp версії зображень через default_storage (локальна ФС або S3)'

    def add_arguments(self, parser):
        parser.add_argument('--quality', type=int, default=82, help='Якість WebP (1-100)')
        parser.add_argument('--force', action='store_true', help='Перегенерувати навіть якщо .webp вже є')
        parser.add_argument('--dry-run', action='store_true', help='Показати без змін')

    def handle(self, *args, **opts):
        if not PIL_AVAILABLE:
            self.stderr.write('Pillow не встановлено. pip install pillow')
            return

        quality = opts['quality']
        force = opts['force']
        dry = opts['dry_run']

        from django.apps import apps
        created = skipped = failed = 0

        for app_label, model_name, field_name in _IMAGE_FIELDS:
            try:
                model = apps.get_model(app_label, model_name)
            except Exception as exc:
                self.stderr.write(f'Модель {app_label}.{model_name} недоступна: {exc}')
                continue

            qs = model.objects.exclude(**{f'{field_name}__isnull': True}).exclude(**{f'{field_name}__exact': ''})
            for instance in qs.iterator():
                field_file = getattr(instance, field_name, None)
                if not field_file or not field_file.name:
                    continue

                storage_name = field_file.name
                # Пропускаємо якщо розширення вже .webp або не підтримуємо
                if not re.search(r'\.(jpe?g|png)$', storage_name, re.IGNORECASE):
                    continue

                webp_name = _webp_name(storage_name)

                if not force and default_storage.exists(webp_name):
                    skipped += 1
                    continue

                if dry:
                    self.stdout.write(f'  [dry] {storage_name} → {webp_name}')
                    created += 1
                    continue

                try:
                    with default_storage.open(storage_name, 'rb') as fh:
                        raw = fh.read()

                    with Image.open(BytesIO(raw)) as img:
                        if img.mode in ('RGBA', 'LA', 'P'):
                            img = img.convert('RGBA')
                        else:
                            img = img.convert('RGB')

                        buf = BytesIO()
                        img.save(buf, 'WEBP', quality=quality, method=6)
                        buf.seek(0)

                    from django.core.files.base import ContentFile
                    if default_storage.exists(webp_name):
                        default_storage.delete(webp_name)
                    default_storage.save(webp_name, ContentFile(buf.read()))
                    created += 1
                    if created % 25 == 0:
                        self.stdout.write(f'  ...{created} згенеровано')
                except Exception as exc:
                    failed += 1
                    self.stderr.write(f'  ✗ {storage_name}: {exc}')

        action = '[DRY-RUN] Буде' if dry else 'Готово! Створено'
        self.stdout.write(self.style.SUCCESS(
            f'{action}: {created}, пропущено (вже є): {skipped}, помилок: {failed}'
        ))
