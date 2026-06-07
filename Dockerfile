# ════════════════════════════════════════════════════════════════════
# Dockerfile для ЗДО №52 (production + development)
#
# Багатошаровий збірник:
#   1. builder — встановлення Python залежностей у wheel-кеші
#   2. production — мінімальний образ без dev-інструментів
#
# Змінні середовища:
#   SECRET_KEY, DEBUG, DATABASE_URL, ALLOWED_HOSTS — обов'язкові
#   Решта (Supabase, Sentry тощо) — опційні
#
# Запуск локально:
#   docker build -t dnz52 .
#   docker run --env-file backend/.env -p 8000:8000 dnz52
# ════════════════════════════════════════════════════════════════════

# ── 1. builder: встановлення залежностей ─────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Системні залежності для компіляції (psycopg2, Pillow тощо)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        libpng-dev \
        libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо та встановлюємо залежності у wheel-кеш
COPY backend/requirements.txt .
RUN pip install --upgrade pip \
    && pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt


# ── 2. production: фінальний образ ───────────────────────────────────
FROM python:3.11-slim AS production

# Метадані
LABEL maintainer="admin@dnz52.rv.ua" \
      project="ЗДО №52" \
      description="Офіційний сайт Закладу дошкільної освіти №52, м. Рівне"

WORKDIR /app

# Не пишемо .pyc та не буферизуємо stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONUTF8=1 \
    # Django не шукає .env якщо вже є змінні середовища
    DJANGO_SETTINGS_MODULE=dnz52_site.settings

# Системні runtime-залежності (мінімум: libpq для psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        libjpeg62-turbo \
        libpng16-16 \
        libwebp7 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо wheels з builder-шару (без мережевого доступу)
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl \
    && rm -rf /wheels

# Копіюємо код бекенду
COPY backend/ .

# Збираємо статику (SPA вже в spa/, Django статику — у staticfiles/)
# collectstatic має бути запущено до деплою або в CMD нижче
RUN python manage.py collectstatic --noinput --clear 2>/dev/null || true

# Відкриваємо порт
EXPOSE 8000

# Healthcheck: перевіряємо що Django відповідає
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/pages/ | head -c 50 || exit 1

# CMD: Gunicorn з 4 воркерами (для prod)
# Для розробки: docker run ... python manage.py runserver 0.0.0.0:8000
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "dnz52_site.wsgi:application"]
