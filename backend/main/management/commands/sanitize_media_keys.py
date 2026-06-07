"""
Транслітерує не-ASCII / небезпечні назви медіа-файлів у безпечні ключі
(Supabase Storage S3 не приймає кирилицю/пробіли у ключах) і ОДНОЧАСНО оновлює
посилання у БД (усі FileField/ImageField) та перейменовує локальні файли.

Ідемпотентна: файли з уже безпечними назвами пропускає.
Запускати на ЛОКАЛЬНІЙ БД (джерело істини), потім re-dump → loaddata у Supabase.

    python manage.py sanitize_media_keys --dry-run
    python manage.py sanitize_media_keys
"""
import os
import re

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import FileField

# Українська транслітерація (спрощена офіційна таблиця КМУ)
_UA = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'iu', 'я': 'ia', 'ʼ': '', "'": '',
    'ё': 'e', 'ы': 'y', 'э': 'e', 'ъ': '',
}


def _translit(s: str) -> str:
    out = []
    for ch in s:
        low = ch.lower()
        if low in _UA:
            t = _UA[low]
            out.append(t.upper() if ch.isupper() and t else t)
        else:
            out.append(ch)
    return ''.join(out)


def safe_key(rel: str) -> str:
    """Транслітерує й чистить кожен сегмент шляху, лишаючи A-Za-z0-9._-"""
    parts = rel.split('/')
    cleaned = []
    for p in parts:
        p = _translit(p)
        p = re.sub(r'[^A-Za-z0-9._-]', '_', p)
        p = re.sub(r'_+', '_', p).strip('_')
        cleaned.append(p or '_')
    return '/'.join(cleaned)


def _is_safe(rel: str) -> bool:
    return all(ord(c) < 128 for c in rel) and not any(c in rel for c in ' %#?')


class Command(BaseCommand):
    help = 'Транслітерує не-ASCII назви медіа у ASCII; оновлює БД і локальні файли.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **opts):
        dry = opts['dry_run']
        media_root = str(settings.MEDIA_ROOT)
        mapping = {}   # old_rel -> new_rel
        used = set()
        changed = 0

        for model in apps.get_models():
            file_fields = [f.name for f in model._meta.fields if isinstance(f, FileField)]
            if not file_fields:
                continue
            for obj in model.objects.all().iterator():
                for fname in file_fields:
                    val = getattr(obj, fname)
                    old_rel = getattr(val, 'name', '') or ''
                    if not old_rel or _is_safe(old_rel):
                        continue
                    if old_rel in mapping:
                        new_rel = mapping[old_rel]
                    else:
                        new_rel = safe_key(old_rel)
                        base, ext = os.path.splitext(new_rel)
                        cand, i = new_rel, 1
                        while cand in used:
                            cand = f'{base}_{i}{ext}'
                            i += 1
                        new_rel = cand
                        mapping[old_rel] = new_rel
                        used.add(new_rel)
                    if new_rel == old_rel:
                        continue
                    changed += 1
                    self.stdout.write(f'{old_rel}  ->  {new_rel}')
                    if not dry:
                        type(obj).objects.filter(pk=obj.pk).update(**{fname: new_rel})

        renamed = 0
        for old_rel, new_rel in mapping.items():
            old_abs = os.path.join(media_root, old_rel.replace('/', os.sep))
            new_abs = os.path.join(media_root, new_rel.replace('/', os.sep))
            if os.path.exists(old_abs) and not os.path.exists(new_abs):
                if not dry:
                    os.makedirs(os.path.dirname(new_abs), exist_ok=True)
                    os.rename(old_abs, new_abs)
                renamed += 1

        # 3) Прибрати будь-які не-ASCII файли, що ЛИШИЛИСЬ на диску (зокрема осиротілі,
        #    не звʼязані з жодним записом) — інакше Supabase відхилить їх при заливанні.
        orphans = 0
        all_file_fields = [
            (model, f.name)
            for model in apps.get_models()
            for f in model._meta.fields if isinstance(f, FileField)
        ]
        for dp, _dirs, fs in os.walk(media_root):
            for f in fs:
                abs_old = os.path.join(dp, f)
                rel_old = os.path.relpath(abs_old, media_root).replace(os.sep, '/')
                if _is_safe(rel_old):
                    continue
                rel_new = safe_key(rel_old)
                base, ext = os.path.splitext(rel_new)
                i = 1
                while os.path.exists(os.path.join(media_root, rel_new.replace('/', os.sep))) and rel_new != rel_old:
                    rel_new = f'{base}_{i}{ext}'
                    i += 1
                if rel_new == rel_old:
                    continue
                orphans += 1
                self.stdout.write(f'[disk] {rel_old}  ->  {rel_new}')
                if not dry:
                    abs_new = os.path.join(media_root, rel_new.replace('/', os.sep))
                    os.makedirs(os.path.dirname(abs_new), exist_ok=True)
                    os.rename(abs_old, abs_new)
                    for model, fld in all_file_fields:
                        model.objects.filter(**{fld: rel_old}).update(**{fld: rel_new})

        self.stdout.write(self.style.SUCCESS(
            f'{"[dry-run] " if dry else ""}Оновлено посилань у БД: {changed}; '
            f'перейменовано файлів: {renamed}; залишкових на диску: {orphans}'
        ))
