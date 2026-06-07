"""
Management command: backup_db_and_media

Створює резервну копію:
  • SQLite бази даних (за замовчуванням) або дампу PostgreSQL (`--postgres`)
  • media-файлів (за умови LOCAL_MEDIA=true у .env; S3-файли у Supabase вже резервуються сервісом)

Використання:
  python manage.py backup_db_and_media
  python manage.py backup_db_and_media --postgres        # pg_dump (потребує pg_dump у PATH)
  python manage.py backup_db_and_media --output /tmp/bak # інша тека

Файли зберігаються у:
  backups/
    db/   ← SQLite .sqlite3 або PostgreSQL .sql.gz
    media/ ← .tar.gz архів папки media/

Формат імені файлу: dnz52_<дата>_<час>.<розширення>
Старі бекапи (старші за --keep-days днів, за замовч. 30) автоматично видаляються.
"""

import gzip
import os
import shutil
import subprocess
import tarfile
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        'Резервна копія бази даних і media-файлів. '
        'SQLite за замовч., --postgres для pg_dump.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            default=None,
            help='Тека для збереження бекапів (за замовч.: <BASE_DIR>/backups)',
        )
        parser.add_argument(
            '--postgres',
            action='store_true',
            default=False,
            help='Дамп PostgreSQL через pg_dump замість копіювання SQLite',
        )
        parser.add_argument(
            '--keep-days',
            type=int,
            default=30,
            help='Видаляти бекапи старші за N днів (за замовч.: 30)',
        )
        parser.add_argument(
            '--no-media',
            action='store_true',
            default=False,
            help='Пропустити бекап media-файлів',
        )

    def handle(self, *args, **options):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base = Path(options['output'] or settings.BASE_DIR / 'backups')

        db_dir = base / 'db'
        media_dir = base / 'media'
        db_dir.mkdir(parents=True, exist_ok=True)
        media_dir.mkdir(parents=True, exist_ok=True)

        # ── 1. Бекап БД ─────────────────────────────────────────────────
        if options['postgres']:
            self._backup_postgres(db_dir, timestamp)
        else:
            self._backup_sqlite(db_dir, timestamp)

        # ── 2. Бекап media ───────────────────────────────────────────────
        if not options['no_media']:
            self._backup_media(media_dir, timestamp)

        # ── 3. Очищення старих бекапів ────────────────────────────────────
        self._cleanup(base, keep_days=options['keep_days'])

        self.stdout.write(self.style.SUCCESS(
            f'OK: Bekap zaversheno. Faily zbereheni u: {base}'
        ))

    # ──────────────────────────────────────────────────────────────────
    # Внутрішні методи
    # ──────────────────────────────────────────────────────────────────

    def _backup_sqlite(self, db_dir: Path, timestamp: str):
        """Копіює файл SQLite через shutil.copy2 (атомарна копія)."""
        db_conf = settings.DATABASES.get('default', {})
        db_path = db_conf.get('NAME', '')
        if not db_path or db_path == ':memory:':
            self.stdout.write(self.style.WARNING(
                'SQLite не налаштовано або використовується :memory: — пропускаємо бекап БД.'
            ))
            return

        src = Path(db_path)
        if not src.exists():
            raise CommandError(f'Файл бази даних не знайдено: {src}')

        dst = db_dir / f'dnz52_{timestamp}.sqlite3'
        shutil.copy2(src, dst)
        self.stdout.write(f'  БД (SQLite): {dst} ({dst.stat().st_size // 1024} KB)')

    def _backup_postgres(self, db_dir: Path, timestamp: str):
        """Дамп PostgreSQL через pg_dump → gzip."""
        db_conf = settings.DATABASES.get('default', {})
        db_name = db_conf.get('NAME', '')
        db_host = db_conf.get('HOST', 'localhost')
        db_port = db_conf.get('PORT', '5432')
        db_user = db_conf.get('USER', '')
        db_pass = db_conf.get('PASSWORD', '')

        if not db_name:
            raise CommandError('DATABASE не налаштовано у settings.DATABASES.')

        dst = db_dir / f'dnz52_{timestamp}.sql.gz'
        cmd = [
            'pg_dump',
            f'--host={db_host}',
            f'--port={db_port}',
            f'--username={db_user}',
            '--no-password',
            '--format=plain',
            db_name,
        ]
        env = os.environ.copy()
        if db_pass:
            env['PGPASSWORD'] = db_pass

        try:
            proc = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            raise CommandError(f'pg_dump завершився з помилкою:\n{e.stderr.decode()}') from e
        except FileNotFoundError:
            raise CommandError('pg_dump не знайдено. Встановіть postgresql-client.') from None

        with gzip.open(dst, 'wb') as f:
            f.write(proc.stdout)

        self.stdout.write(f'  БД (PostgreSQL): {dst} ({dst.stat().st_size // 1024} KB)')

    def _backup_media(self, media_dir: Path, timestamp: str):
        """Архівує папку MEDIA_ROOT у .tar.gz."""
        media_root = Path(getattr(settings, 'MEDIA_ROOT', ''))
        if not media_root or not media_root.exists():
            self.stdout.write(self.style.WARNING(
                'MEDIA_ROOT не налаштовано або папка не існує — пропускаємо бекап media. '
                '(У Supabase Storage файли зберігаються на S3 і резервуються сервісом.)'
            ))
            return

        dst = media_dir / f'dnz52_media_{timestamp}.tar.gz'
        with tarfile.open(dst, 'w:gz') as tar:
            tar.add(media_root, arcname='media')

        self.stdout.write(f'  Media: {dst} ({dst.stat().st_size // 1024} KB)')

    def _cleanup(self, base: Path, keep_days: int):
        """Видаляє бекапи старші за keep_days днів."""
        cutoff = datetime.now() - timedelta(days=keep_days)
        removed = 0
        for f in base.rglob('dnz52_*'):
            if f.is_file() and datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
                f.unlink()
                removed += 1
        if removed:
            self.stdout.write(f'  Видалено застарілих бекапів: {removed}')
