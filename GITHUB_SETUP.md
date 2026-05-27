# 📦 Як залити цей проект у GitHub

Цей файл описує **покрокову інструкцію** як перший раз залити проект
у репозиторій https://github.com/Ke1fosao/dnz52_react.

> ⚠️ Передумова: вам потрібен **Git** встановлений на машині
> (https://git-scm.com). Перевірте: `git --version` має показати версію.

---

## ⚡ Швидкий старт (одна команда — копіюйте і вставляйте)

Відкрийте PowerShell у папці `F:\Project\dnz52-react` і виконуйте по черзі:

### 1. Ініціалізація git

```powershell
cd F:\Project\dnz52-react
git init
git branch -M main
```

### 2. Перевірка що ігнорується (важливо!)

```powershell
git status
```

Має показувати **багато файлів** але **не показувати**:
- `node_modules/` (тисячі файлів npm)
- `backend/.venv/` (python пакети)
- `backend/media/` (227 MB фото — занадто велике для GitHub)
- `backend/.env` (секрети)
- `backend/db.sqlite3` (база — її теж не комітимо)

Якщо щось з цього з'явилось — `.gitignore` працює неправильно. Скажіть мені.

### 3. Налаштування Git користувача (якщо ще не робили)

```powershell
git config user.name "Ke1fosao"
git config user.email "your-email@example.com"
```
(Замініть email на свій справжній з GitHub)

### 4. Перший комміт

```powershell
git add .
git commit -m "Initial commit: React frontend + Django REST API"
```

### 5. Підключення до GitHub репозиторію

```powershell
git remote add origin https://github.com/Ke1fosao/dnz52_react.git
```

### 6. Push (заливаємо все в GitHub)

```powershell
git push -u origin main
```

При першому push **GitHub попросить логін**. Введіть:
- **Username:** `Ke1fosao`
- **Password:** ❌ НЕ ваш пароль від GitHub, а **Personal Access Token**

#### Як отримати Personal Access Token:
1. Зайдіть на https://github.com/settings/tokens
2. Натисніть **Generate new token (classic)**
3. Назва: `dnz52-react-push`
4. Expiration: `90 days` (або більше)
5. Виберіть scope: ✅ **repo** (повний доступ)
6. Натисніть **Generate token**
7. ⚠️ Скопіюйте токен ОДРАЗУ (він показується тільки раз!)
8. Використовуйте як password при push

---

## 🔄 Наступні рази (як заливати зміни)

Після першого push, для подальших оновлень:

```powershell
cd F:\Project\dnz52-react
git add .
git commit -m "Опис того що змінилось"
git push
```

Git запам'ятає токен у Credential Manager Windows, тому пароль вводити не доведеться.

---

## 🚫 Що НЕ потрапляє у GitHub (і чому)

| Що | Чому | Як відновити |
|---|---|---|
| `node_modules/` | ~300 MB, тисячі файлів | `npm install` |
| `backend/.venv/` | ~70 MB, локальне python середовище | `py -m venv .venv` + `pip install -r requirements.txt` |
| `backend/media/` | **227 MB** — GitHub не любить великі бінарники | Тримайте локально; для прода — S3/Cloudinary |
| `backend/db.sqlite3` | База з даними — кожен має створити свою | `python manage.py migrate` + `createsuperuser` |
| `backend/.env` | Містить SECRET_KEY — секрети не в git! | Скопіюйте `.env.example` → `.env` і заповніть |
| `backend/staticfiles/` | Генеруються Django | `python manage.py collectstatic` |
| `dist/` | Vite production build | `npm run build` |

---

## 👥 Як хтось інший клонує і запускає проект

Якщо ви даєте посилання на GitHub комусь іншому, він робить:

```powershell
# 1. Клонувати
git clone https://github.com/Ke1fosao/dnz52_react.git
cd dnz52_react

# 2. Backend
cd backend
copy .env.example .env
py -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py createsuperuser
.\.venv\Scripts\python manage.py runserver

# 3. Frontend (в окремому вікні)
cd ..
npm install
npm run dev
```

База буде **порожня** (бо `db.sqlite3` не в git). Контент додається через адмінку `/admin/`.

---

## 🆘 Поширені проблеми

### `error: src refspec main does not match any`
Ви забули зробити commit перед push. Зробіть:
```powershell
git add .
git commit -m "Initial commit"
git push -u origin main
```

### `Authentication failed`
GitHub більше не приймає пароль для push. Використайте Personal Access Token (див. вище).

### `Updates were rejected because the remote contains work that you do not have locally`
Це коли в репозиторії на GitHub вже є файли (README від GitHub). Зробіть:
```powershell
git pull origin main --allow-unrelated-histories
git push origin main
```

### Файл занадто великий (`File size exceeds 100 MB`)
GitHub не приймає файли > 100 MB. Якщо побачите цю помилку:
1. Перевірте що `.gitignore` спрацював (`git status`)
2. Якщо великий файл вже у `git add` — приберіть: `git rm --cached path/to/file`
3. Закомітьте знову
4. Push

### Push дуже довго / зависає
Можливо великий розмір. Перевірте:
```powershell
git count-objects -vH
```
Має бути меншe 100 MB. Якщо більше — щось не виключено через `.gitignore`.

---

## 📂 Розмір що відправляється у GitHub

З правильним `.gitignore` репозиторій буде ~**15-25 MB**:
- ~12 MB — `backend/static/` (Bootstrap, шрифти для Django адмінки)
- ~3 MB — `src/` (TypeScript код)
- ~1 MB — інші файли (configs, README, package-lock.json)

Це нормальний розмір для GitHub.
