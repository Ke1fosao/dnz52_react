"""
Django management command — генерує .webp версії всіх зображень у media/.
Запуск:  python manage.py generate_webp
         python manage.py generate_webp --quality 80 --force

WebP займає на 25-35% менше місця за JPEG при тій самій якості.
Фронтенд (OptimizedImage) автоматично віддає .webp сучасним браузерам.
"""
import os
from django.conf import settings
from django.core.management.base import BaseCommand

try:
    from PIL import Image
except ImportError:
    Image = None


class Command(BaseCommand):
    help = 'Генерує .webp версії зображень у MEDIA_ROOT'

    def add_arguments(self, parser):
        parser.add_argument('--quality', type=int, default=82, help='Якість WebP (1-100)')
        parser.add_argument('--force', action='store_true', help='Перегенерувати навіть якщо .webp існує')

    def handle(self, *args, **opts):
        if Image is None:
            self.stderr.write('Pillow не встановлено. pip install pillow')
            return

        quality = opts['quality']
        force = opts['force']
        media_root = settings.MEDIA_ROOT

        if not os.path.isdir(media_root):
            self.stderr.write(f'MEDIA_ROOT не існує: {media_root}')
            return

        exts = ('.jpg', '.jpeg', '.png')
        created, skipped, failed = 0, 0, 0

        for root, _dirs, files in os.walk(media_root):
            for fname in files:
                if not fname.lower().endswith(exts):
                    continue
                src_path = os.path.join(root, fname)
                base, _ = os.path.splitext(src_path)
                webp_path = base + '.webp'

                if os.path.exists(webp_path) and not force:
                    skipped += 1
                    continue

                try:
                    with Image.open(src_path) as im:
                        # RGBA → зберігаємо прозорість, інакше RGB
                        if im.mode in ('RGBA', 'LA', 'P'):
                            im = im.convert('RGBA')
                        else:
                            im = im.convert('RGB')
                        im.save(webp_path, 'WEBP', quality=quality, method=6)
                    created += 1
                    if created % 25 == 0:
                        self.stdout.write(f'  ...{created} згенеровано')
                except Exception as e:
                    failed += 1
                    self.stderr.write(f'  ✗ {fname}: {e}')

        self.stdout.write(self.style.SUCCESS(
            f'Готово! Створено: {created}, пропущено (вже є): {skipped}, помилок: {failed}'
        ))
