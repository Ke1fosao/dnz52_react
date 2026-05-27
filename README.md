# ЗДО №52 — повний проект (React + Django)

Сайт закладу дошкільної освіти №52 (м. Рівне) — **монорепо** з Django REST API
бекендом і React фронтендом в одній папці.

## 🎨 Технологічний стек

**Frontend** (`/` корінь проекту):
- React 18 + TypeScript + Vite 6
- Tailwind CSS + shadcn/ui
- React Router v6, TanStack Query, Axios
- React Hook Form + Zod, Framer Motion
- Lucide React (іконки), `yet-another-react-lightbox` (фото-zoom)

**Backend** (`/backend/`):
- Django 5.2 + Django REST Framework
- SQLite (для розробки), PostgreSQL (для прода)
- CKEditor для адмінки
- CORS налаштовано для React фронтенду

## 📦 Що встановити перед запуском

### Обов'язково:
1. **Node.js 20+ LTS** — https://nodejs.org *(перевірте: `node --version`)*
2. **Python 3.11–3.13** — https://python.org *(перевірте: `py --version`)*
   - ⚠️ Python 3.14 теж працює, але `psycopg2-binary` не зібрається (для SQLite не потрібен)

### Рекомендовано (IDE та інструменти):

**VS Code** (https://code.visualstudio.com) — найкращий безкоштовний IDE.
Розширення для встановлення (Ctrl+Shift+X):
- `bradlc.vscode-tailwindcss` — Tailwind IntelliSense
- `dsznajder.es7-react-js-snippets` — React snippets
- `esbenp.prettier-vscode` — Prettier
- `dbaeumer.vscode-eslint` — ESLint
- `formulahendry.auto-rename-tag` — синхронне перейменування JSX тегів
- `usernamehw.errorlens` — інлайн помилки
- `ms-python.python` — для Django частини
- `rangav.vscode-thunder-client` — тестування REST API

**Альтернативи**:
- **WebStorm** (платний) — https://jetbrains.com/webstorm
- **Cursor** (VS Code з AI) — https://cursor.com
- **PyCharm** (для Django) — https://jetbrains.com/pycharm

## 🚀 Швидкий старт

### Варіант 1: Подвійний клік (найпростіше)

```
1. Подвійний клік на start-all.bat
   → відкриються 2 вікна: Django + Vite
   → автоматично встановиться все потрібне при першому запуску

2. Відкрий http://localhost:5173 у браузері
```

### Варіант 2: Вручну (для розуміння процесу)

**Термінал 1 — Django backend:**
```powershell
cd F:\Project\dnz52-react\backend
py -m venv .venv                           # одноразово
.\.venv\Scripts\activate                   # активувати venv
pip install -r requirements.txt            # одноразово
python manage.py migrate                   # одноразово
python manage.py runserver                 # → http://localhost:8000
```

**Термінал 2 — React frontend:**
```powershell
cd F:\Project\dnz52-react
npm install                                # одноразово
npm run dev                                # → http://localhost:5173
```

## 📁 Структура проекту

```
dnz52-react/                      ← КОРІНЬ ПРОЕКТУ
├── backend/                      ← Django бекенд
│   ├── dnz52_site/               ← основні налаштування
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── api_urls.py           ← REST API роутер
│   ├── main/, news/, gallery/,
│   │   groups/, specialists/,
│   │   circles/, documents/,
│   │   reviews/, menu/, …        ← Django apps (11 модулів)
│   ├── media/                    ← завантажені фото (227 MB)
│   ├── static/                   ← CSS/JS для Django адмінки
│   ├── templates/                ← старі Django шаблони (404, robots)
│   ├── db.sqlite3                ← база даних
│   ├── manage.py
│   ├── requirements.txt
│   └── .venv/                    ← Python virtual env (створюється)
│
├── src/                          ← React frontend
│   ├── api/                      ← axios клієнт + endpoints
│   ├── components/
│   │   ├── ui/                   ← shadcn/ui (Button, Card, Dialog…)
│   │   ├── layout/               ← Header, Navbar, Footer
│   │   ├── common/               ← Logo, PageHero, ZoomableImage, Seo
│   │   ├── home/                 ← HeroSlider, NewsPreview
│   │   ├── news/                 ← NewsCard
│   │   └── gallery/              ← AlbumCard
│   ├── pages/                    ← усі сторінки (11 модулів)
│   ├── hooks/useApi.ts           ← TanStack Query хуки
│   ├── types/                    ← TypeScript типи
│   ├── lib/utils.ts              ← cn, formatDate
│   ├── styles/globals.css        ← Tailwind directives
│   ├── App.tsx                   ← роутинг (lazy-loaded)
│   └── main.tsx
│
├── public/                       ← статика фронтенду
├── tailwind.config.js            ← дитячі кольори, шрифти
├── vite.config.ts                ← proxy /api → Django + code splitting
├── package.json
├── start-backend.bat             ← запустити лише Django
├── start-frontend.bat            ← запустити лише Vite
├── start-all.bat                 ← запустити обидва одразу
└── README.md
```

## 🖼️ Що нового: клік на фото відкриває lightbox

У ЦІЙ версії всі фото на сайті клікабельні — натисни щоб збільшити:
- ✅ Галерея → альбом → фото
- ✅ Сторінка спеціаліста → фото в розділах + аватарки спеціалістів
- ✅ Сторінка батькам → оголошення, зразки заяв, фото адаптації
- ✅ Деталі групи → обкладинка, фото персоналу
- ✅ Сторінка керівництва → фото директора та працівників
- ✅ Деталі новини → обкладинка
- ✅ Про заклад → фото + інлайн галерея

## 🎨 Дизайн-система

**Кольори** (Tailwind):
- `primary` — синій `#4A90E2` *(зберігаємо стиль)*
- `secondary` — бірюзовий `#50E3C2`
- `accent` — помаранчевий `#FFB84D`
- `sun` — жовтий, `coral` — рожевий, `mint`, `cream` — теплі акценти

**Шрифти**:
- `font-sans` → Nunito *(дружній основний)*
- `font-display` → Fredoka *(грайливий для заголовків)*

**Утиліти**: `bg-gradient-primary`, `shadow-soft`, `animate-float`, `animate-wiggle`.

## 🌐 API маршрути

Базовий URL: `http://localhost:8000/api/v1/`

| Endpoint | Що повертає |
|----------|-------------|
| `GET /news/` | Список новин (пагінація 12) |
| `GET /news/<slug>/` | Деталі новини (+ інкремент переглядів) |
| `GET /news-categories/` | Категорії новин |
| `GET /gallery/albums/` | Список альбомів |
| `GET /gallery/albums/<slug>/` | Альбом з фото |
| `GET /gallery/categories/` | Категорії галереї |
| `GET /groups/` | Усі групи |
| `GET /groups/<slug>/` | Деталі групи + персонал |
| `GET /specialists/<page_type>/` | Сторінка спеціаліста (5 типів) |
| `GET /circles/` | Гуртки |
| `GET /circles/<slug>/` | Деталі гуртка |
| `GET /documents/` | Документи |
| `POST /documents/<id>/track_download/` | +1 завантаження |
| `GET /reviews/` | Опубліковані відгуки |
| `POST /reviews/` | Залишити відгук (модерація + rate-limit) |
| `POST /reviews/<id>/like/` | Лайк відгуку |
| `GET /menu/today/` | Меню на сьогодні |
| `GET /menu/week/?start=YYYY-MM-DD` | Меню на тиждень |
| `GET /search/?q=...` | Глобальний пошук |
| `GET /contacts/`, `/staff/`, `/parents/...` | Інші endpoints |

**Адмінка Django**: http://localhost:8000/admin/ — додавайте новини, фото, документи.

## 🔧 npm команди

```powershell
npm run dev       # dev сервер на http://localhost:5173
npm run build     # production білд у dist/
npm run preview   # перегляд production білду
npm run lint      # перевірка ESLint
```

## 🐛 Усунення проблем

**"py: command not found"**: встановіть Python з https://python.org і перезапустіть термінал.

**`psycopg2-binary` не встановлюється**: він закоментований у `requirements.txt`, бо потрібен лише для PostgreSQL. Для локального SQLite не потрібен.

**Картинки не відображаються**: переконайтесь що Django запущено на 8000 порту. Vite проксує `/media` → Django.

**CORS помилки**: перевірте що `CORS_ALLOWED_ORIGINS` у `backend/dnz52_site/settings.py` містить `http://localhost:5173`.

**`npm install` зависає**: видаліть `node_modules` і `package-lock.json`, потім знову `npm install`.

**Адмінка не відкривається**: створіть суперюзера: `cd backend && .\.venv\Scripts\python manage.py createsuperuser`.

## 📝 Що залишилося як було

Папка `F:\Project\dnz52` (оригінал) залишається недоторканою — можна
користуватись паралельно або видалити після перевірки що нова версія працює.
