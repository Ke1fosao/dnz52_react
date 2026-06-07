"""
Утиліта для ресайзу та оптимізації зображень перед збереженням у сховище.
Викликається через pre_save-сигнал — файл ще в пам'яті, до storage.save().
Працює і з локальним FS, і з S3 (Supabase Storage).
"""
import logging
from io import BytesIO

logger = logging.getLogger('main.imaging')

try:
    from PIL import Image, ImageOps
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning('Pillow не встановлено — авто-ресайз зображень вимкнено.')


def downscale_image(instance, field_name, max_w=1600, max_h=1600, quality=82):
    """Ресайз і оптимізація нового завантаженого зображення (pre_save).

    Обробляє лише нові/змінені файли (_committed=False).
    Прибирає EXIF, зменшує до max_w×max_h, оптимізує JPEG/PNG.
    Замінює вміст field_file.file на оброблений BytesIO — до виклику storage.save().
    У разі помилки збережено оригінал (без збою).
    """
    if not PIL_AVAILABLE:
        return

    field_file = getattr(instance, field_name, None)
    if not field_file:
        return

    # _committed=True — файл вже в сховищі, не новий/не змінений
    if getattr(field_file, '_committed', True):
        return

    try:
        raw = field_file.file
        raw.seek(0)

        with Image.open(raw) as img:
            # Виправити орієнтацію за EXIF і прибрати метадані (приватність + вага)
            img = ImageOps.exif_transpose(img)

            w, h = img.size
            if max(w, h) > max(max_w, max_h):
                img.thumbnail((max_w, max_h), Image.LANCZOS)

            fname = (getattr(raw, 'name', '') or
                     getattr(field_file, 'name', '') or '')
            is_png = fname.lower().endswith('.png')

            buf = BytesIO()
            if is_png:
                if img.mode == 'P':
                    img = img.convert('RGBA')
                img.save(buf, 'PNG', optimize=True)
                content_type = 'image/png'
            else:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                img.save(buf, 'JPEG', quality=quality, optimize=True, progressive=True)
                content_type = 'image/jpeg'

            buf.seek(0)
            size = buf.getbuffer().nbytes

            from django.core.files.uploadedfile import InMemoryUploadedFile
            field_file.file = InMemoryUploadedFile(
                file=buf,
                field_name=field_name,
                name=getattr(raw, 'name', 'image.jpg'),
                content_type=content_type,
                size=size,
                charset=None,
            )

            logger.debug(
                'imaging: %s.%s → %dx%d px, %d KB',
                instance.__class__.__name__, field_name,
                img.width, img.height, size // 1024,
            )
    except Exception:
        logger.exception(
            'imaging: не вдалось обробити %s.%s — збережено оригінал',
            instance.__class__.__name__, field_name,
        )
