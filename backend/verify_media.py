"""Pereveryaye chy vsi shlyaxy z BD znaxodyatsya v media-optimized/"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dnz52_site.settings")
django.setup()
sys.stdout.reconfigure(encoding="utf-8")

from django.apps import apps
from django.db.models.fields.files import ImageFieldFile, FieldFile

OPTIMIZED = Path("media-optimized")
ORIGINAL = Path("media")

print(f"=== Збираю всі шляхи до файлів з БД ===\n")

# Збираємо всі ImageField/FileField шляхи з усіх моделей
all_db_paths = []  # list of (model, field, value)

for model in apps.get_models():
    for field in model._meta.get_fields():
        if not hasattr(field, 'upload_to'):
            continue
        # ImageField / FileField
        for obj in model.objects.all():
            file_field = getattr(obj, field.name, None)
            if file_field and hasattr(file_field, 'name') and file_field.name:
                all_db_paths.append((
                    model.__name__,
                    field.name,
                    file_field.name,  # це шлях відносно MEDIA_ROOT
                ))

print(f"Знайдено {len(all_db_paths)} файлових шляхів у БД")
print()

# Також додамо все що зберігається через RichTextField (CKEditor) — їх не легко зловити, пропустимо
# Перевіримо що з цих шляхів є/немає в оптимізованій папці

missing_in_optimized = []
present = 0
print("=== Перевіряю наявність у media-optimized/ ===\n")

for model, field, rel_path in all_db_paths:
    full_path = OPTIMIZED / rel_path
    if full_path.exists():
        present += 1
    else:
        missing_in_optimized.append((model, field, rel_path))

print(f"✓ Знайдено в media-optimized/: {present}/{len(all_db_paths)}")
print(f"✗ ВТРАЧЕНО в media-optimized/: {len(missing_in_optimized)}")
print()

if missing_in_optimized:
    print("=== Перші 30 втрачених ===")
    for model, field, path in missing_in_optimized[:30]:
        # перевіряємо чи воно є в оригіналі
        orig_exists = (ORIGINAL / path).exists()
        marker = "[є в оригіналі]" if orig_exists else "[НЕМАЄ в оригіналі]"
        print(f"  {marker} {model}.{field}: {path}")

print()
print("=== Також зчитаю файли з RichTextField/uploads через CKEditor ===")
# CKEditor зазвичай зберігає у media/uploads/
uploads_orig = ORIGINAL / 'uploads'
uploads_opt = OPTIMIZED / 'uploads'
if uploads_orig.exists():
    orig_uploads = {p.relative_to(uploads_orig) for p in uploads_orig.rglob("*") if p.is_file()}
    opt_uploads = {p.relative_to(uploads_opt) for p in uploads_opt.rglob("*") if p.is_file()} if uploads_opt.exists() else set()
    missing_uploads = orig_uploads - opt_uploads
    print(f"  Файлів в media/uploads/ (CKEditor): {len(orig_uploads)}")
    print(f"  Файлів в media-optimized/uploads/: {len(opt_uploads)}")
    if missing_uploads:
        print(f"  ⚠ Втрачено uploads: {len(missing_uploads)}")
        for m in list(missing_uploads)[:10]:
            print(f"     uploads/{m}")
else:
    print("  Папки uploads/ немає в оригіналі — все ОК")
