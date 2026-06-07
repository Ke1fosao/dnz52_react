# 🌈 ЗДО №52 — сайт закладу дошкільної освіти (м. Рівне)

### 🔗 Живий сайт: **[dnz52.onrender.com](https://dnz52.onrender.com/)**

Сучасний повнофункціональний вебсайт дитячого садка: преміум-дизайн зі світлою й
темною темами, власна React-адмінпанель, розумний пошук, PWA з офлайн-режимом та
push-сповіщеннями, інтеграція з ШІ. **Монорепо** з двох частин — React-фронтенд і
Django REST API, який також роздає зібраний фронт одним вебзастосунком.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Django" src="https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white">
  <img alt="DRF" src="https://img.shields.io/badge/DRF-3.15-A30000?logo=django&logoColor=white">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white">
</p>

---

## ✨ Можливості

### 🏠 Публічний сайт
- **Головна** з hero-слайдером (фото/відео), «бенто»-сіткою розділів і тематичним фоном-декором.
- **Новини** — категорії, теги, схожі матеріали, лічильник переглядів, архів за місяцями, **RSS-стрічка**.
- **Календар подій** — сітка з типами подій + експорт в **iCal / Google Calendar**.
- **Групи** (скляний дизайн, bento-статистика, команда групи), **Гуртки** (розклад, переваги, заняття).
- **Галерея** альбомів з повноекранним лайтбоксом і zoom.
- **Меню харчування** — майстер-деталь по днях тижня з адаптивом і анімаціями.
- **Спеціалісти**, **Керівництво/Штат**, **Атестація**, розділ **Батькам**, **Документи** (з лічильником завантажень).
- **Відгуки** із зірковим рейтингом, лайками, модерацією та відповіддю адміністрації.
- **FAQ** з лайками відповідей і формою запитання.
- **Розумний глобальний пошук** — розуміє відмінки, друкарські помилки (відстань Левенштейна),
  підказки «можливо, ви мали на увазі», ранжування й підсвічування результатів.
- **Контакти** з вбудованою Google-картою.

### 🎨 Дизайн та UX
- Повноцінна **світла й темна тема** (синхронна, без миготіння, з повагою до системних налаштувань).
- Преміум дизайн-система: шрифт Manrope, скляні картки, плавні анімації, градієнтні акценти.
- **Доступність (a11y):** skip-link, фокус-пастки в модалках, видимий фокус, **режим великого шрифту**, alt у всіх зображень.
- **PWA:** встановлення на телефон, офлайн-режим, service worker (stale-while-revalidate).
- **Push-сповіщення** за темами (новини / події) через Web-Push (VAPID).
- Юридичні сторінки: політика конфіденційності, умови, декларація доступності + cookie-банер.

### 🛠️ Власна React-адмінпанель (`/manage`)
Окрема адмінка у стилі сайту — повне керування контентом **без Django-адмінки**:
- Новини, події, FAQ, документи, **галерея** (масове завантаження + поворот фото), меню + шаблон тижня,
  групи, гуртки, спеціалісти, атестація, розділ «Батькам», слайдер, штат, сторінки, контакти.
- **Drag-and-drop** сортування скрізь, інлайн-створення категорій/тегів, пошук у списках.
- **Markdown-редактор** з прев'ю та завантаженням зображень.
- **Користувачі та права**, **історія змін**, **push-розсилка**, **профіль + 2FA (TOTP/QR)**.
- **Інтеграція з ШІ (Google Gemini):** авто-модерація відгуків і генерація тексту у фірмовому стилі сайту.

### 🔒 Безпека
- Захист від брутфорсу входу (**django-axes**), **Content-Security-Policy** (django-csp).
- **2FA / TOTP** для адмінки (django-otp, вмикається через `.env`).
- HTTPS-захист у проді: HSTS, secure-cookies, nosniff, anti-clickjacking.
- Throttling API, ETag → `304 Not Modified`, антиспам форм (honeypot + rate-limit).

---

## 🧰 Технологічний стек

| Шар | Технології |
|-----|-----------|
| **Frontend** | React 18 · TypeScript 5 · Vite 6 · Tailwind CSS 3 · React Router 6 · TanStack Query 5 · Framer Motion · React Hook Form + Zod · Radix UI · Lucide & Bootstrap Icons |
| **Backend** | Django 5.2 · Django REST Framework · WhiteNoise · django-markdownx · simple-history · django-filter · pywebpush |
| **БД та медіа** | **Supabase PostgreSQL** (через connection pooler) · **Supabase Storage** (S3, django-storages) · SQLite для локальної розробки |
| **PWA / офлайн** | vite-plugin-pwa · Workbox (кастомний service worker) |
| **Безпека** | django-axes · django-csp · django-otp (TOTP) · Cloudflare Turnstile · bleach |
| **ШІ** | Google Gemini API (модерація + генерація тексту) |
| **Деплой** | Render (авто-деплой із GitHub: build → migrate → collectstatic) · Supabase (БД + медіа) |

---

## 🚀 Швидкий старт (локально)

### Передумови
- **Node.js 20+ LTS** — https://nodejs.org
- **Python 3.11–3.13** — https://python.org

### Варіант 1 — подвійний клік
Запустіть `start-all.bat` — відкриються два вікна (Django :8000 + Vite :5173).
Потім відкрийте **http://localhost:5173**.

### Варіант 2 — вручну

**Термінал 1 — Django (бекенд):**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # одноразово, для входу в адмінку
python manage.py runserver         # → http://localhost:8000
```

**Термінал 2 — React (фронтенд):**
```powershell
cd frontend
npm install
npm run dev                        # → http://localhost:5173
```

Vite проксує `/api` та `/media` на Django, тож CORS-проблем у розробці немає.

---

## 📦 Збірка та деплой

Фронт компілюється й кладеться в `backend/spa/`, який Django роздає у проді
(WhiteNoise + SPA-фолбек). Зручний скрипт — `build-prod.bat`.

```powershell
cd frontend
npm run build      # tsc + vite build → frontend/dist
# скопіювати свіжий dist у backend/spa, потім:
git add -A && git commit -m "..." && git push
```

**Деплой — автоматичний (Render).** Будь-який `git push` у гілку `main` запускає білд
(`pip install` → `migrate` → `collectstatic`) і викочує нову версію — жодних ручних команд
на сервері. Конфігурація — у `render.yaml`. Логи й статус: **Render → Logs**.

Секрети задаються у `backend/.env` (ніколи не в git) — повний перелік у
`backend/.env.example`: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`,
`DATABASE_URL` (Supabase PostgreSQL), `AWS_*` (Supabase Storage), `VAPID_*` (push),
`GEMINI_API_KEY` (ШІ).

> **База даних і медіа на Supabase.** БД підключається **лише через connection pooler**
> Supabase (IPv4): `aws-1-<region>.pooler.supabase.com:5432`, користувач
> `postgres.<project-ref>` (прямий хост `db.<ref>.supabase.co` — лише IPv6). Медіа — у
> публічному Storage-бакеті; перенесення наявних — `python manage.py migrate_media_to_s3`.
> Локальна розробка лишається на SQLite + локальних файлах (якщо `DATABASE_URL`/`AWS_*` не задані).

---

## 🗂️ Структура проєкту

```
dnz52-react/
├── backend/                  # Django: REST API + адмінка + роздача SPA
│   ├── dnz52_site/           # settings, urls, api_urls, wsgi
│   ├── main/ news/ gallery/  # додатки: models, serializers, api_views
│   ├── groups/ circles/ …    #   specialists, documents, reviews, menu,
│   │                         #   events, faq
│   ├── spa/                  # зібраний React-білд (для прода)
│   ├── media/                # завантажені фото/файли (НЕ в git)
│   └── requirements.txt
│
├── frontend/                 # React + Vite + TypeScript
│   └── src/
│       ├── pages/            # усі сторінки сайту
│       ├── admin/            # React-адмінпанель (/manage)
│       ├── components/       # ui / layout / common / home / …
│       ├── hooks/  api/  lib/  types/
│       ├── styles/globals.css
│       └── sw.ts             # service worker (PWA)
│
├── start-all.bat             # запустити Django + Vite
└── build-prod.bat            # зібрати фронт у backend/spa
```

---

## 🌐 Огляд API

Базовий URL: `/api/v1/`

| Endpoint | Опис |
|----------|------|
| `GET /news/`, `/news/<slug>/` | Новини (пагінація) і деталі |
| `GET /events/` | Календар подій |
| `GET /gallery/albums/`, `/gallery/albums/<slug>/` | Альбоми та фото |
| `GET /groups/`, `/groups/<slug>/` | Групи й персонал |
| `GET /circles/`, `/circles/<slug>/` | Гуртки |
| `GET /documents/` | Документи |
| `GET /reviews/` · `POST /reviews/` | Відгуки (з модерацією) |
| `GET /menu/today/`, `/menu/week/` | Меню харчування |
| `GET /faq/` | Поширені запитання |
| `GET /search/?q=` | Розумний глобальний пошук |
| `/api/v1/admin/*` | Захищене API React-адмінки (TokenAuth + IsAdminUser) |

Також: `/rss/` (стрічка новин), `sitemap.xml`, `robots.txt`.
Резервна Django-адмінка — `/admin/`.

---

## 👨‍💻 Автор

**Дмитро Ковтунович**

- 📧 Email: [dima.kovtunovych@gmail.com](mailto:dima.kovtunovych@gmail.com)
- 💬 Telegram: [@Ke1fosao](https://t.me/Ke1fosao)
- 🐙 GitHub: [@Ke1fosao](https://github.com/Ke1fosao)

> Проєкт розроблено як дипломну роботу. Усі права на дизайн і код належать автору.
