"""Stiskaye foto v media/ dlya zalyttya na PythonAnywhere.
Maksymalnyy rozmir: 1600px, yakist 80%.
ZBERIGAYE ORYHINALNI ROZSHYRENNYA (.jpeg/.webp/.jfif/.png) — bez konvertatsii!
SVG/PDF prosto kopyuyutsya.
"""
import os
import sys
import shutil
from pathlib import Path
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding="utf-8")

MAX_SIZE = 1600
QUALITY = 80
SRC = Path("media")
DST = Path("media-optimized")

# Razshyrennya kartynok yaki mozhna stiskaty (zberigayuchy format)
IMG_EXTS = {".jpg", ".jpeg", ".jfif", ".png", ".webp"}

if DST.exists():
    shutil.rmtree(DST)

stats = {"compressed": 0, "copied": 0, "saved_mb": 0, "errors": 0}


def save_with_original_format(img, dst_path: Path):
    """Save image preserving original format detected by extension."""
    ext = dst_path.suffix.lower()
    if ext == ".png":
        img.save(dst_path, "PNG", optimize=True)
    elif ext == ".webp":
        # Make sure RGB or RGBA
        img.save(dst_path, "WEBP", quality=QUALITY, method=6)
    else:
        # .jpg, .jpeg, .jfif — all are JPEG
        if img.mode != "RGB":
            # flatten transparency to white
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                bg.paste(img, mask=img.split()[-1])
            elif img.mode == "P":
                bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[-1])
            else:
                bg.paste(img.convert("RGB"))
            img = bg
        img.save(dst_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def process_file(src_path: Path):
    rel = src_path.relative_to(SRC)
    dst_path = DST / rel
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    ext = src_path.suffix.lower()
    orig_size = src_path.stat().st_size

    if ext in IMG_EXTS:
        try:
            with Image.open(src_path) as img:
                img = ImageOps.exif_transpose(img)
                w, h = img.size
                if max(w, h) > MAX_SIZE:
                    img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
                save_with_original_format(img, dst_path)
                new_size = dst_path.stat().st_size
                stats["compressed"] += 1
                stats["saved_mb"] += (orig_size - new_size) / (1024 * 1024)
                return
        except Exception as e:
            print(f"  ! Помилка з {rel}: {e}. Копіюю як є.")
            stats["errors"] += 1

    # everything else — copy as is (svg, pdf, gif, etc.)
    shutil.copy2(src_path, dst_path)
    stats["copied"] += 1


print(f"=== Обробляю {SRC}/ ===")
all_files = [p for p in SRC.rglob("*") if p.is_file()]
print(f"Всього файлів: {len(all_files)}\n")

for i, f in enumerate(all_files, 1):
    if i % 50 == 0:
        print(f"  ...{i}/{len(all_files)}")
    process_file(f)

print()
print(f"✓ Стиснуто (картинки): {stats['compressed']}")
print(f"✓ Скопійовано без змін: {stats['copied']}")
print(f"✓ Збережено: {stats['saved_mb']:.1f} MB")
if stats["errors"]:
    print(f"⚠ Помилок: {stats['errors']}")
print()
print("=== Розмір media-optimized/ ===")
total = sum(p.stat().st_size for p in DST.rglob("*") if p.is_file())
print(f"  {total / (1024*1024):.1f} MB")

# Перевірка: чи всі шляхи збереглись?
src_paths = {p.relative_to(SRC) for p in SRC.rglob("*") if p.is_file()}
dst_paths = {p.relative_to(DST) for p in DST.rglob("*") if p.is_file()}
missing = src_paths - dst_paths
extra = dst_paths - src_paths
if missing:
    print(f"\n⚠⚠ ВТРАЧЕНО {len(missing)} файлів:")
    for m in list(missing)[:10]:
        print(f"   {m}")
if extra:
    print(f"\n⚠⚠ ЗАЙВО {len(extra)} файлів (з іншим розширенням?):")
    for e in list(extra)[:10]:
        print(f"   {e}")
if not missing and not extra:
    print("\n✓ Усі шляхи збережені — імена файлів збігаються 1:1")
