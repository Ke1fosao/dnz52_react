"""Creates one tar.gz per media subfolder. tar.gz works well with cyrillic."""
import tarfile
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SRC = Path("media-optimized")
OUT = Path("media-parts")

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()

print(f"=== Creating tar.gz archives from {SRC}/ ===\n")

for subdir in sorted(SRC.iterdir()):
    if not subdir.is_dir():
        continue
    archive = OUT / f"media-{subdir.name}.tar.gz"
    with tarfile.open(archive, "w:gz", compresslevel=6) as tar:
        # store paths relative to media-optimized so they expand as `subdir/...`
        tar.add(subdir, arcname=subdir.name)
    size_mb = archive.stat().st_size / (1024 * 1024)
    print(f"  + media-{subdir.name}.tar.gz  ({size_mb:.1f} MB)")

print("\n=== All archives ===")
total = 0
for f in sorted(OUT.iterdir()):
    s = f.stat().st_size
    total += s
    print(f"  {f.name:35s} {s/(1024*1024):8.2f} MB")
print(f"\nTotal: {total/(1024*1024):.1f} MB")
