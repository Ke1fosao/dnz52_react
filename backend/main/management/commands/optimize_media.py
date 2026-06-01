"""
Django management command — стискає зображення у media/ НА МІСЦІ (in-place).
Зменшує розмір файлів без помітної втрати якості для веб.

Запуск:
  python manage.py optimize_media                 # стиснути (max 1920px, q=82)
  python manage.py optimize_media --dry-run       # лише показати що буде (без змін)
  python manage.py optimize_media --max-width 1600 --quality 80
  python manage.py optimize_media --min-kb 150    # чіпати лише файли більші за 150 КБ

ВАЖЛИВО: перезаписує оригінали! Зробіть бекап media/ перед першим запуском.
PDF та інші документи НЕ чіпаються — лише .jpg/.jpeg/.png.
"""
import os
from django.conf import settings
from django.core.management.base import BaseCommand

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None


class Command(BaseCommand):
    help = 'Стискає зображення у MEDIA_ROOT на місці (зменшує обсяг диску)'

    def add_arguments(self, parser):
        parser.add_argument('--max-width', type=int, default=1920,
                            help='Макс. ширина/висота px (більші — зменшуються)')
        parser.add_argument('--quality', type=int, default=82, help='Якість JPEG/WebP (1-100)')
        parser.add_argument('--min-kb', type=int, default=80,
                            help='Чіпати лише файли більші за N КБ')
        parser.add_argument('--dry-run', action='store_true', help='Показати без змін')

    def handle(self, *args, **opts):
        if Image is None:
            self.stderr.write('Pillow не встановлено.')
            return

        max_side = opts['max_width']
        quality = opts['quality']
        min_bytes = opts['min_kb'] * 1024
        dry = opts['dry_run']
        media_root = settings.MEDIA_ROOT

        if not os.path.isdir(media_root):
            self.stderr.write(f'MEDIA_ROOT не існує: {media_root}')
            return

        exts = ('.jpg', '.jpeg', '.png')
        total_before = total_after = 0
        processed = skipped = failed = 0

        for root, _dirs, files in os.walk(media_root):
            for fname in files:
                if not fname.lower().endswith(exts):
                    continue
                path = os.path.join(root, fname)
                try:
                    size_before = os.path.getsize(path)
                except OSError:
                    continue

                if size_before < min_bytes:
                    skipped += 1
                    continue

                try:
                    with Image.open(path) as im:
                        # Виправляємо орієнтацію за EXIF, прибираємо метадані
                        im = ImageOps.exif_transpose(im)
                        is_png = path.lower().endswith('.png')

                        # Зменшуємо якщо більше max_side
                        w, h = im.size
                        if max(w, h) > max_side:
                            im.thumbnail((max_side, max_side), Image.LANCZOS)

                        if dry:
                            # приблизна оцінка — не зберігаємо
                            processed += 1
                            total_before += size_before
                            continue

                        if is_png:
                            # PNG: зберігаємо з оптимізацією; якщо без прозорості — можна в JPEG,
                            # але лишаємо PNG щоб не міняти розширення/шляхи в БД
                            if im.mode == 'P':
                                im = im.convert('RGBA')
                            im.save(path, 'PNG', optimize=True)
                        else:
                            if im.mode in ('RGBA', 'LA', 'P'):
                                im = im.convert('RGB')
                            im.save(path, 'JPEG', quality=quality, optimize=True, progressive=True)

                    size_after = os.path.getsize(path)
                    total_before += size_before
                    total_after += size_after
                    processed += 1
                    if processed % 25 == 0:
                        saved_mb = (total_before - total_after) / (1024 * 1024)
                        self.stdout.write(f'  ...{processed} оброблено, звільнено {saved_mb:.1f} MB')
                except Exception as e:
                    failed += 1
                    self.stderr.write(f'  ✗ {fname}: {e}')

        mb = lambda b: b / (1024 * 1024)
        if dry:
            self.stdout.write(self.style.WARNING(
                f'[DRY-RUN] Буде оброблено {processed} файлів '
                f'(сумарно {mb(total_before):.1f} MB). Пропущено дрібних: {skipped}.'
            ))
        else:
            saved = total_before - total_after
            self.stdout.write(self.style.SUCCESS(
                f'Готово! Оброблено: {processed}, пропущено: {skipped}, помилок: {failed}\n'
                f'Було: {mb(total_before):.1f} MB -> Стало: {mb(total_after):.1f} MB '
                f'(звільнено {mb(saved):.1f} MB)'
            ))
