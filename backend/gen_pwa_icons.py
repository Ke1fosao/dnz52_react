"""Генерує PWA-іконки (PNG) з градієнтом і текстом "52" у frontend/public/.
Запуск: .venv\\Scripts\\python.exe gen_pwa_icons.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')
os.makedirs(OUT_DIR, exist_ok=True)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Діагональний градієнт #4A90E2 → #50E3C2
    c1 = (74, 144, 226)
    c2 = (80, 227, 194)
    for y in range(size):
        for_t = y / size
        # робимо горизонтальні смуги градієнта (швидше ніж попіксельно діагональ)
        color = lerp(c1, c2, for_t)
        draw.line([(0, y), (size, y)], fill=color)

    # Заокруглений прямокутник-маска (для не-maskable). Maskable — без заокруглень
    # (бо система сама обріже з safe-zone).
    if not maskable:
        radius = int(size * 0.22)
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        img.putalpha(mask)

    # Текст "52"
    font_size = int(size * (0.4 if maskable else 0.5))
    try:
        font = ImageFont.truetype('arialbd.ttf', font_size)
    except Exception:
        try:
            font = ImageFont.truetype('arial.ttf', font_size)
        except Exception:
            font = ImageFont.load_default()

    text = '52'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((size - tw) // 2 - bbox[0], (size - th) // 2 - bbox[1])
    draw.text(pos, text, fill=(255, 255, 255), font=font)

    return img


for size in (192, 512):
    make_icon(size).save(os.path.join(OUT_DIR, f'pwa-{size}.png'))
    print(f'  pwa-{size}.png')

make_icon(512, maskable=True).save(os.path.join(OUT_DIR, 'pwa-maskable-512.png'))
print('  pwa-maskable-512.png')

# Apple touch icon
make_icon(180).save(os.path.join(OUT_DIR, 'apple-touch-icon.png'))
print('  apple-touch-icon.png')

print('Done! Icons in frontend/public/')
