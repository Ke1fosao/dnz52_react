"""
Django settings for dnz52_site project.

ВАЖЛИВО: ніколи не комітьте файл .env у git!
Усі секрети (SECRET_KEY, паролі БД) задаються через .env
"""

import os
import sys
from pathlib import Path

from whitenoise.storage import CompressedManifestStaticFilesStorage


class ResilientStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """
    Те саме, що й WhiteNoise CompressedManifestStaticFilesStorage,
    але не падає з 500-ю помилкою якщо у маніфесті немає якогось файлу.
    Натомість віддає звичайний (не хешований) URL.
    Це робить деплой стійким до того, що хтось забув запустити collectstatic.
    """
    manifest_strict = False


# Чи зараз запускаються тести (manage.py test) — впливає на STORAGES нижче,
# щоб тести не падали через відсутність staticfiles.json маніфесту
IS_TESTING = 'test' in sys.argv


# Завантаження змінних з .env (якщо файл існує)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # У продакшені на деяких хостингах змінні задаються інакше

# ----------------------------------------------------------------------------
# Базові шляхи
# ----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# ----------------------------------------------------------------------------
# Безпека
# ----------------------------------------------------------------------------
# SECRET_KEY читається зі змінної середовища
# Якщо не задано — використовуємо devовий ключ (тільки для локальної розробки!)
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-dev-key-CHANGE-ME-in-production-!!!'
)

# DEBUG — за замовчуванням False для безпеки. На локальному ПК у .env: DEBUG=True
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

# Дозволені хости — додайте сюди адресу вашого сайту
# У .env: ALLOWED_HOSTS=dnz52.pythonanywhere.com,dnz52.com.ua
ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1'
    ).split(',') if h.strip()
]

# Хард-фейл небезпечних налаштувань у проді — навмисний захист:
# якщо ці змінні не задані на PA, reload впаде одразу, а не тихо.
from django.core.exceptions import ImproperlyConfigured
if not DEBUG:
    if SECRET_KEY.startswith('django-insecure'):
        raise ImproperlyConfigured('У проді задайте SECRET_KEY у .env')
    if ALLOWED_HOSTS in ([], ['localhost', '127.0.0.1']):
        raise ImproperlyConfigured('У проді задайте ALLOWED_HOSTS у .env')

# CSRF — для HTTPS-сайтів обовʼязково
# У .env: CSRF_TRUSTED_ORIGINS=https://dnz52.pythonanywhere.com
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')
    if o.strip()
]


# ----------------------------------------------------------------------------
# Застосунки
# ----------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Sitemap для SEO
    'django.contrib.sitemaps',

    # Сторонні
    'storages',                  # django-storages — медіа у Supabase Storage (S3)
    'markdownx',                 # markdown-редактор (замість CKEditor)
    'simple_history',            # версійність (хто/коли змінив)
    'adminsortable2',            # drag-drop сортування в адмінці
    'crispy_forms',
    'crispy_bootstrap5',
    'rest_framework',
    'rest_framework.authtoken',   # токени для React-адмінки (/manage)
    'corsheaders',
    'django_filters',
    'drf_spectacular',            # Swagger/OpenAPI документація (/api/docs/)

    # Безпека
    'axes',                            # захист від брутфорсу входу в адмінку
    'django_otp',                      # 2FA-каркас (вмикається через ENFORCE_ADMIN_2FA)
    'django_otp.plugins.otp_totp',     # TOTP (Google Authenticator / Authy тощо)
    'django_otp.plugins.otp_static',   # резервні одноразові коди

    # Наші
    'main',
    'news',
    'gallery',
    'documents',
    'groups',
    'specialists',
    'circles',
    'reviews',
    'menu',
    'events',
    'faq',
]


# ----------------------------------------------------------------------------
# Middleware
# ----------------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # CSP — заголовок Content-Security-Policy (django-csp). Одразу після Security.
    'csp.middleware.CSPMiddleware',
    # Permissions-Policy + (COOP задається через SECURE_CROSS_ORIGIN_OPENER_POLICY нижче)
    'dnz52_site.security_headers.PermissionsPolicyMiddleware',
    # WhiteNoise — роздає статичні файли у продакшені (CSS/JS/SVG)
    # Має йти ОДРАЗУ після SecurityMiddleware
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # CORS — має йти ПЕРЕД CommonMiddleware (для React фронтенду)
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ETag/Last-Modified → 304 Not Modified для незмінених відповідей (економія трафіку)
    'django.middleware.http.ConditionalGetMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # django-otp — ОДРАЗУ після AuthenticationMiddleware (додає request.user.is_verified)
    'django_otp.middleware.OTPMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # simple_history — відстежує користувача що зробив зміну
    'simple_history.middleware.HistoryRequestMiddleware',
    # django-axes — МАЄ бути ОСТАННІМ (перехоплює відповідь на спробу входу)
    'axes.middleware.AxesMiddleware',
]

# Markdownx — налаштування редактора
MARKDOWNX_MEDIA_PATH = 'markdownx/'
MARKDOWNX_UPLOAD_MAX_SIZE = 5 * 1024 * 1024  # 5 МБ

ROOT_URLCONF = 'dnz52_site.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # Папка templates/ на рівні проекту — для 404.html, 500.html, robots.txt
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dnz52_site.wsgi.application'


# ----------------------------------------------------------------------------
# База даних
# ----------------------------------------------------------------------------
# За замовчуванням — SQLite (підходить для маленького садочкового сайту).
# Якщо хостинг дає DATABASE_URL (Render, Railway тощо) — використовуємо її.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Підтримка DATABASE_URL (Supabase PostgreSQL).
# ⚠️ На проді (PythonAnywhere) підключатися ТІЛЬКИ через connection pooler Supabase
# (він IPv4): хост aws-1-eu-central-1.pooler.supabase.com, користувач
# postgres.<project-ref>, порт 5432 (session mode), ?sslmode=require.
# Пароль із символами (@ тощо) має бути URL-кодований (@ → %40).
# Прямий хост db.<ref>.supabase.co — лише IPv6, PythonAnywhere його НЕ бачить.
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES['default'] = dj_database_url.parse(
            DATABASE_URL, conn_max_age=600, ssl_require=True
        )
    except ImportError:
        pass


# ----------------------------------------------------------------------------
# Паролі
# ----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ----------------------------------------------------------------------------
# Локалізація
# ----------------------------------------------------------------------------
LANGUAGE_CODE = 'uk'
TIME_ZONE = 'Europe/Kiev'
USE_I18N = True
USE_TZ = True


# ----------------------------------------------------------------------------
# Статичні файли (CSS, JS, SVG)
# ----------------------------------------------------------------------------
STATIC_URL = '/static/'

# Включаємо як локальну static/ так і spa/assets/ зібраного React build
STATICFILES_DIRS = [BASE_DIR / 'static']
if (BASE_DIR / 'spa').exists():
    STATICFILES_DIRS.append(BASE_DIR / 'spa')

STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise — стиснення + кешування.
# Використовуємо ResilientStaticFilesStorage (визначений вище), щоб сайт
# не падав з 500-ю, якщо у маніфесті немає файлу — поверне URL без хешу.
# При запуску тестів (manage.py test) маніфест не генерується, тому
# беремо звичайний StaticFilesStorage щоб тести не падали.
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': (
            'django.contrib.staticfiles.storage.StaticFilesStorage'
            if IS_TESTING
            else 'dnz52_site.settings.ResilientStaticFilesStorage'
        ),
    },
}

# WhiteNoise віддає також файли React SPA (spa/) на рівні кореня:
#   • хешовані /assets/*.js|css → автоматично Cache-Control: immutable, max-age=1рік;
#   • /sw.js, /manifest.webmanifest, іконки → сервляться правильно (не через SPA-фолбек).
if (BASE_DIR / 'spa').exists():
    WHITENOISE_ROOT = BASE_DIR / 'spa'
WHITENOISE_MAX_AGE = 60  # не-хешовані (sw.js, index.html) — короткий кеш


# ----------------------------------------------------------------------------
# Медіа файли (фото, документи що завантажують користувачі)
# ----------------------------------------------------------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- Supabase Storage (S3) для медіа у проді ---
# Якщо у .env задано AWS_STORAGE_BUCKET_NAME — усі медіа (ImageField/FileField)
# зберігаються й читаються із Supabase Storage. Інакше — локальна файлова система
# (зручно для розробки). Бакет має бути ПУБЛІЧНИМ у Supabase (Storage → bucket →
# Make public), щоб працювали чисті публічні URL без підпису.
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', '')
if AWS_STORAGE_BUCKET_NAME:
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', '')  # .../storage/v1/s3
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'eu-central-1')
    AWS_S3_ADDRESSING_STYLE = 'path'      # Supabase вимагає path-style
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_DEFAULT_ACL = None                 # Supabase не підтримує ACL
    AWS_QUERYSTRING_AUTH = False           # чисті публічні URL (без підпису й терміну дії)
    AWS_S3_FILE_OVERWRITE = False          # не перезаписувати однойменні файли
    # Публічний домен читання: <host>/storage/v1/object/public/<bucket>/<key>
    # (ендпойнт .../storage/v1/s3 — лише для завантаження через S3 API).
    from urllib.parse import urlparse as _urlparse
    _s3_host = _urlparse(AWS_S3_ENDPOINT_URL).netloc
    if _s3_host:
        AWS_S3_CUSTOM_DOMAIN = f'{_s3_host}/storage/v1/object/public/{AWS_STORAGE_BUCKET_NAME}'
    STORAGES['default'] = {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'}



# ----------------------------------------------------------------------------
# Crispy Forms
# ----------------------------------------------------------------------------
CRISPY_ALLOWED_TEMPLATE_PACKS = 'bootstrap5'
CRISPY_TEMPLATE_PACK = 'bootstrap5'


# ----------------------------------------------------------------------------
# Кешування
# ----------------------------------------------------------------------------
# LocMemCache — простий in-memory кеш у процесі Django. Підходить для
# одного процесу на PythonAnywhere Free. Для масштабування — Redis/Memcached.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'dnz52-default',
        'TIMEOUT': 300,  # 5 хвилин за замовчуванням
    }
}
CACHE_MIDDLEWARE_KEY_PREFIX = 'dnz52'


# ----------------------------------------------------------------------------
# Default primary key
# ----------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ----------------------------------------------------------------------------
# REST Framework (для React фронтенду dnz52-react)
# ----------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] if not DEBUG else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    # Захист від зловживань/скрапінгу. Ліміт щедрий — звичайне користування не зачіпає.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '600/min',
    },
    # ВАЖЛИВО: вимикаємо SessionAuthentication щоб React міг робити POST
    # без CSRF токена. Для публічного API це нормально (відгуки, лайки).
    # Адмінка Django окремо і має свою CSRF захист.
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


# ----------------------------------------------------------------------------
# drf-spectacular (Swagger / OpenAPI 3 документація)
# ----------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'ЗДО №52 API',
    'VERSION': '1.0.0',
    'DESCRIPTION': (
        'REST API офіційного сайту Закладу дошкільної освіти №52 (м. Рівне). '
        'Надає доступ до новин, галереї, груп, гуртків, спеціалістів, '
        'документів, меню харчування, подій, FAQ та відгуків. '
        'Використовується React-фронтендом.'
    ),
    'CONTACT': {'name': 'Адміністратор ЗДО №52', 'email': 'admin@dnz52.rv.ua'},
    'LICENSE': {'name': 'Приватний (для внутрішнього використання)'},
    'SERVE_INCLUDE_SCHEMA': False,
    'SORT_OPERATIONS': True,
    'ENUM_GENERATE_CHOICE_DESCRIPTION': True,
}


# ----------------------------------------------------------------------------
# CORS — дозволяємо React фронтенду (dnz52-react) звертатись до API
# ----------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',   # Vite dev server
    'http://127.0.0.1:5173',
    'http://localhost:4173',   # Vite preview
]

# У продакшені додайте сюди домен React фронтенду через .env
CORS_ALLOWED_ORIGINS += [
    o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if o.strip()
]

CORS_ALLOW_CREDENTIALS = True


# ----------------------------------------------------------------------------
# Web-Push (VAPID) — сповіщення про нові новини
# ----------------------------------------------------------------------------
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_ADMIN_EMAIL = os.environ.get('VAPID_ADMIN_EMAIL', 'admin@dnz52.rv.ua')


# ----------------------------------------------------------------------------
# Бекенд-безпека: брутфорс-захист (axes), CSP, 2FA для адмінки (otp)
# ----------------------------------------------------------------------------
# Порядок важливий: AxesStandaloneBackend має бути ПЕРШИМ.
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# django-axes — блокування після кількох невдалих спроб входу.
AXES_FAILURE_LIMIT = 5                 # дозволено стільки невдалих спроб
AXES_COOLOFF_TIME = 1                  # блокування на 1 годину
AXES_RESET_ON_SUCCESS = True           # успішний вхід обнуляє лічильник
# Блокуємо за комбінацією (логін + IP), а не лише за IP — щоб не залочити всіх
# користувачів, які виходять з-під одного IP/проксі.
AXES_LOCKOUT_PARAMETERS = [['username', 'ip_address']]
# Коректне визначення реального IP за проксі PythonAnywhere (X-Forwarded-For).
AXES_IPWARE_PROXY_COUNT = 1
AXES_IPWARE_META_PRECEDENCE_ORDER = ['HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR']

# Content-Security-Policy (django-csp 4.x).
# УВАГА: якщо змінити inline-скрипт у frontend/index.html — перерахувати sha256 тут:
#   PowerShell: $c = ([regex]::Match((gc backend/spa/index.html -Raw),'(?s)<script>(.*?)</script>')).Groups[1].Value
#               $b = [Text.Encoding]::UTF8.GetBytes($c); $h = [Security.Cryptography.SHA256]::Create().ComputeHash($b)
#               "sha256-$([Convert]::ToBase64String($h))"
# style-src лишаємо з 'unsafe-inline' — React рендерить динамічні inline-стилі,
# їх не захешувати. XSS через style набагато менш критичний, ніж через script.
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            # hash anti-FOUC inline-скрипта з frontend/index.html (тема + розмір шрифту)
            "'sha256-FUNyb4k9pMOU98IgRMNON1D4FYdX5kLCEz71lxbMqDg='",
            'https://www.googletagmanager.com',        # Google Analytics (gtag)
            'https://plausible.io',                    # Plausible
            'https://challenges.cloudflare.com',       # Cloudflare Turnstile (Фаза 5)
        ],
        'style-src': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'", 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': [
            "'self'",
            'https://www.google-analytics.com',
            'https://*.google-analytics.com',
            'https://www.googletagmanager.com',
            'https://plausible.io',
        ],
        'frame-src': [
            'https://www.google.com',             # вбудована Google-карта (Контакти)
            'https://challenges.cloudflare.com',  # Cloudflare Turnstile (Фаза 5)
        ],
        'frame-ancestors': ["'none'"],             # анти-clickjacking (як X-Frame-Options: DENY)
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'form-action': ["'self'"],
    },
}

# 2FA для адмінки. За замовчуванням ВИМКНЕНО (нуль ризику блокування).
# Як увімкнути БЕЗПЕЧНО: 1) залогінься в /admin; 2) у розділі «TOTP devices»
# додай свій пристрій (відскануй QR у Google Authenticator); 3) ЛИШЕ ПОТІМ
# постав ENFORCE_ADMIN_2FA=True у .env і перезапусти сайт.
ENFORCE_ADMIN_2FA = os.environ.get('ENFORCE_ADMIN_2FA', 'False').lower() in ('true', '1', 'yes')

# Назва видавця для TOTP (показується в Google Authenticator / Authy).
OTP_TOTP_ISSUER = 'ZDO52 Admin'

# Термін дії токена React-адмінки (секунди). Після спливання токен видаляється,
# фронт отримує 401 і перенаправляє на /manage/login.
ADMIN_TOKEN_TTL = int(os.environ.get('ADMIN_TOKEN_TTL', 7 * 24 * 3600))  # 7 днів

# Cloudflare Turnstile — CAPTCHA на публічних формах (відгуки/питання FAQ).
# Опційно: якщо ключ не задано — форми працюють без перевірки (не ламає локалку).
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY', '')

# ── Google AI Studio (Gemini): авто-модерація відгуків + генерація тексту ──
# Ключ ЛИШЕ через .env (ніколи не в git). Ланцюг моделей пробується по черзі:
# спершу flash-lite (найвищі безкоштовні ліміти), при 429/помилці — наступна.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODELS = [m.strip() for m in os.environ.get(
    'GEMINI_MODELS',
    'gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.5-flash,gemini-flash-latest',
).split(',') if m.strip()]


# ----------------------------------------------------------------------------
# Безпека у продакшені (вмикається коли DEBUG=False)
# ----------------------------------------------------------------------------
if not DEBUG:
    # HTTPS перенаправлення (тільки якщо у вас точно є HTTPS)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # Cross-Origin-Opener-Policy: забороняє іншим вікнам/фреймам отримати посилання
    # на наш browsing context — захист від cross-origin data leaks.
    SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

    # HSTS — браузер запам'ятає, що до сайту тільки HTTPS (захист від downgrade)
    # 31536000 = 1 рік. Це безпечно для проду; на dev/staging — не вмикайте.
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Не відправляти Referer на сторонні сайти (приватність відвідувачів)
    SECURE_REFERRER_POLICY = 'same-origin'
