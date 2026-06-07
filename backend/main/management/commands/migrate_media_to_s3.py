"""
Завантажує всі файли з локальної MEDIA_ROOT у Supabase Storage (S3-сумісне).
Ключі обʼєктів = відносні шляхи (як їх зберігає FileField), тож після завантаження
посилання на медіа з бази даних працюють напряму.

Використання (з активним AWS_* у .env):
    python manage.py migrate_media_to_s3            # завантажити все
    python manage.py migrate_media_to_s3 --dry-run  # лише показати, що буде
    python manage.py migrate_media_to_s3 --skip-existing  # пропускати вже залиті
"""
import mimetypes
import os

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Завантажує всі файли з MEDIA_ROOT у Supabase Storage (S3).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Лише показати список.')
        parser.add_argument('--skip-existing', action='store_true',
                            help='Пропускати файли, що вже є у бакеті.')

    def handle(self, *args, **opts):
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        if not bucket:
            raise CommandError('AWS_STORAGE_BUCKET_NAME не задано у .env.')

        s3 = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            region_name=settings.AWS_S3_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(s3={'addressing_style': 'path'}, signature_version='s3v4'),
        )

        root = str(settings.MEDIA_ROOT)
        if not os.path.isdir(root):
            raise CommandError(f'Тека MEDIA_ROOT не існує: {root}')

        uploaded = skipped = failed = 0
        total_bytes = 0

        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                full = os.path.join(dirpath, name)
                key = os.path.relpath(full, root).replace(os.sep, '/')
                size = os.path.getsize(full)

                if opts['skip_existing']:
                    try:
                        s3.head_object(Bucket=bucket, Key=key)
                        skipped += 1
                        continue
                    except ClientError:
                        pass  # немає — завантажуємо

                if opts['dry_run']:
                    self.stdout.write(f'[dry-run] {key}  ({size/1024:.0f} КБ)')
                    uploaded += 1
                    total_bytes += size
                    continue

                ctype = mimetypes.guess_type(name)[0] or 'application/octet-stream'
                try:
                    s3.upload_file(full, bucket, key, ExtraArgs={'ContentType': ctype})
                    uploaded += 1
                    total_bytes += size
                    if uploaded % 25 == 0:
                        self.stdout.write(f'  …завантажено {uploaded}')
                except ClientError as e:
                    failed += 1
                    self.stderr.write(f'ПОМИЛКА {key}: {e}')

        self.stdout.write(self.style.SUCCESS(
            f'Готово: завантажено {uploaded}, пропущено {skipped}, помилок {failed}; '
            f'{total_bytes/1024/1024:.1f} МБ.'
        ))
