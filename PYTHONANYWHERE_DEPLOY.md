# 🚀 Розгортання на PythonAnywhere (повна інструкція)

Покрокова інструкція як залити проект із GitHub на PythonAnywhere
(акаунт `dnz52`, сайт `https://dnz52.pythonanywhere.com`).

> 💡 Архітектура на проді:
> - Django **сервить ВСЕ** (і API, і React, і адмінку)
> - Реактовський білд (`backend/spa/`) віддається як статичні файли
> - Один web app, один домен — простіше для безкоштовного PA

---

## 📋 ЕТАП 0: Підготовка локально (5 хв)

### 0.1. Зібрати React для прода
```powershell
cd F:\Project\dnz52-react
build-prod.bat
```
Це створить готову папку `backend/spa/` з білдом.

### 0.2. Закомітити в GitHub
```powershell
git add .
git commit -m "build: production bundle + PythonAnywhere deploy config"
git push
```

---

## 📋 ЕТАП 1: Bash консоль PythonAnywhere (10 хв)

### 1.1. Зайдіть на PA → відкрийте **Bash консоль**
- Меню зверху: **Consoles** → **Bash**
- (можна закрити будь-яке інше вікно консолі)

### 1.2. Клонуйте репозиторій
```bash
cd ~
git clone https://github.com/Ke1fosao/dnz52_react.git
cd dnz52_react
```

> Якщо репозиторій приватний — потрібен токен:
> ```bash
> git clone https://USERNAME:TOKEN@github.com/Ke1fosao/dnz52_react.git
> ```

### 1.3. Створіть Python virtualenv
```bash
mkvirtualenv --python=python3.11 dnz52
```
Це створить venv в `~/.virtualenvs/dnz52`. Активується автоматично.

> Якщо побачите помилку про Python 3.11 — спробуйте `python3.10` або `python3.12`.

### 1.4. Встановіть Python залежності
```bash
cd ~/dnz52_react/backend
pip install -r requirements.txt
```
Це може зайняти **3-5 хвилин**.

### 1.5. Створіть `.env` для прода
```bash
cd ~/dnz52_react/backend
cp .env.example .env
nano .env
```

Замініть вміст на:
```env
DEBUG=False
SECRET_KEY=ось-сюди-СПРАВЖНІЙ-секретний-ключ-50-символів
ALLOWED_HOSTS=dnz52.pythonanywhere.com,www.dnz52.pythonanywhere.com
CSRF_TRUSTED_ORIGINS=https://dnz52.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://dnz52.pythonanywhere.com
```

**Згенерувати SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Скопіюйте результат і вставте у поле `SECRET_KEY=...`.

Зберегти у nano: **Ctrl+O** → Enter → **Ctrl+X**

### 1.6. Виконайте міграції БД
```bash
python manage.py migrate
```

### 1.7. Створіть суперюзера
```bash
python manage.py createsuperuser
```
Введіть логін (наприклад `admin`), email, пароль. **Запам'ятайте їх!**

### 1.8. Зберіть статичні файли
```bash
python manage.py collectstatic --noinput
```
Має вивести щось типу `XXXX static files copied to '/home/dnz52/dnz52_react/backend/staticfiles'`

---

## 📋 ЕТАП 2: Налаштування Web App (10 хв)

### 2.1. Перейдіть на вкладку **Web** у PA
- https://www.pythonanywhere.com/user/dnz52/webapps/

### 2.2. Натисніть **Add a new web app**
- **Domain**: залиште `dnz52.pythonanywhere.com`
- **Framework**: виберіть **Manual configuration** (не Django!)
- **Python version**: `3.11` (та сама що у venv)
- Натисніть **Next** → готово

### 2.3. Налаштуйте Virtualenv
У секції **Virtualenv** введіть шлях:
```
/home/dnz52/.virtualenvs/dnz52
```
Натисніть галочку.

### 2.4. Налаштуйте Source code
У секції **Code**:
- **Source code**: `/home/dnz52/dnz52_react/backend`
- **Working directory**: `/home/dnz52/dnz52_react/backend`

### 2.5. Налаштуйте WSGI файл
Клацніть на посилання поряд з **WSGI configuration file**
(буде щось типу `/var/www/dnz52_pythonanywhere_com_wsgi.py`).

**Видаліть весь вміст** і вставте:

```python
"""WSGI config for dnz52 на PythonAnywhere."""
import os
import sys
from pathlib import Path

# 1. Додаємо шлях до Django проекту
project_path = '/home/dnz52/dnz52_react/backend'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# 2. Завантажуємо .env вручну (бо WSGI не знає про нього)
env_file = Path(project_path) / '.env'
if env_file.exists():
    for line in env_file.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, _, value = line.partition('=')
            os.environ.setdefault(key.strip(), value.strip())

# 3. Запускаємо Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'dnz52_site.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Збережіть файл (кнопка **Save** зверху).

### 2.6. Налаштуйте Static files mapping
У секції **Static files** додайте 3 рядки:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/dnz52/dnz52_react/backend/staticfiles` |
| `/media/` | `/home/dnz52/dnz52_react/backend/media` |
| `/assets/` | `/home/dnz52/dnz52_react/backend/spa/assets` |

Натискайте галочку після кожного.

### 2.7. Перезавантажте Web app
Натисніть велику **зелену кнопку Reload** зверху сторінки.

### 2.8. Перевірте!
Відкрийте https://dnz52.pythonanywhere.com — має показати React сайт 🎉

Якщо побачите помилку — дивіться **Error log** на тій же сторінці Web.

---

## 📋 ЕТАП 3: Завантаження медіа-файлів (15-30 хв)

Медіа (227 МБ фото) не в Git. Завантажуємо окремо.

### Варіант А: Через zip-архів (рекомендую)

**Локально (Windows):**
1. Зайдіть у папку `F:\Project\dnz52-react\backend\`
2. Правий клік на `media/` → **Send to** → **Compressed (zipped) folder**
3. Отримаєте файл `media.zip` (~150-200 МБ)

**На PythonAnywhere:**
1. **Files** вкладка → перейдіть у `/home/dnz52/dnz52_react/backend/`
2. **Upload a file** → виберіть `media.zip` (завантаження 5-20 хв)
3. Поверніться в **Bash консоль**:
   ```bash
   cd ~/dnz52_react/backend
   unzip media.zip
   rm media.zip
   ls media/  # перевірити що папки на місці
   ```

### Варіант Б: Через rsync (для просунутих, потребує платний акаунт)

```bash
rsync -avz F:\Project\dnz52-react\backend\media/ dnz52@ssh.pythonanywhere.com:~/dnz52_react/backend/media/
```

### Після завантаження медіа
- Не треба нічого перезавантажувати — Django сервить медіа динамічно
- Перевірте: відкрийте сторінку галереї на сайті — фото мають з'явитися

---

## 📋 ЕТАП 4: Завантаження бази даних (опціонально)

Якщо хочете перенести вашу локальну БД з даними (групи, новини, відгуки):

**Локально:**
```powershell
cd F:\Project\dnz52-react\backend
.\.venv\Scripts\python manage.py dumpdata ^
  --natural-foreign --natural-primary ^
  --exclude=contenttypes --exclude=auth.permission --exclude=sessions ^
  --indent=2 -o full_data.json
```
Створиться файл `full_data.json` (1-5 МБ).

**Завантажте `full_data.json` на PA:**
- Files → перейдіть у `/home/dnz52/dnz52_react/backend/` → Upload

**На PythonAnywhere у Bash консолі:**
```bash
cd ~/dnz52_react/backend
workon dnz52
python manage.py loaddata full_data.json
rm full_data.json
```

> ⚠️ ОБЕРЕЖНО: `loaddata` ДОДАЄ записи. Якщо БД на PA вже має дані, можуть бути конфлікти.
> Для чистої заливки спочатку:
> ```bash
> rm db.sqlite3
> python manage.py migrate
> python manage.py loaddata full_data.json
> python manage.py createsuperuser
> ```

---

## 📋 ЕТАП 5: Оновлення сайту в майбутньому

Коли робите зміни локально і хочете оновити прод:

### Локально
```powershell
cd F:\Project\dnz52-react

# Якщо змінювали React код — пересобрати:
build-prod.bat

# Закомітити і запушити
git add .
git commit -m "fix: опис змін"
git push
```

### На PythonAnywhere (Bash console)
```bash
cd ~/dnz52_react
git pull

# Якщо змінювалися Python пакети — оновити:
workon dnz52
pip install -r backend/requirements.txt

# Якщо нові міграції:
cd backend
python manage.py migrate

# Якщо змінився React/static:
python manage.py collectstatic --noinput
```

### Перезавантажити сайт
- Web tab → велика зелена **Reload** кнопка
- АБО з консолі: `touch /var/www/dnz52_pythonanywhere_com_wsgi.py`

---

## 🆘 Поширені проблеми

### ❌ "DisallowedHost: Invalid HTTP_HOST header"
У `.env` додайте свій домен в `ALLOWED_HOSTS`:
```env
ALLOWED_HOSTS=dnz52.pythonanywhere.com,www.dnz52.pythonanywhere.com
```
Потім `touch /var/www/dnz52_pythonanywhere_com_wsgi.py` (перезавантажує WSGI).

### ❌ React сайт відкривається але всі сторінки порожні
Перевірте Static files mapping — має бути `/assets/` → `/home/dnz52/dnz52_react/backend/spa/assets`

### ❌ "React build not found" повідомлення
Не виконано `build-prod.bat` локально, або `backend/spa/` не закомічено в git.
Перевірте на PA: `ls ~/dnz52_react/backend/spa/index.html` — має існувати.

### ❌ Фото не показуються (404 на /media/...)
Перевірте Static files mapping для `/media/`. І чи дійсно завантажили media через zip.

### ❌ "CSRF verification failed" в адмінці
В `.env` має бути `CSRF_TRUSTED_ORIGINS=https://dnz52.pythonanywhere.com`

### ❌ API повертає 500
Дивіться **Error log** у Web вкладці PA. Найчастіша причина — SECRET_KEY не встановлено або БД не мігрована.

### ❌ Закінчилось місце на диску (512 МБ ліміт)
Безкоштовний PA має 512 МБ. Перевірте:
```bash
du -sh ~/* ~/.virtualenvs/* 2>/dev/null | sort -h
```
Найважче зазвичай — `media/` і venv. Можна:
- Видалити невикористані фото
- Замість `media/` хостити фото на безкоштовному Cloudinary

---

## 📊 Очікувана структура на PA

```
/home/dnz52/
├── .virtualenvs/dnz52/        ← Python venv (~150 МБ)
└── dnz52_react/               ← Git репозиторій
    ├── backend/
    │   ├── dnz52_site/        ← Django config
    │   ├── main/, news/, ...  ← Django apps
    │   ├── spa/               ← React production build (з git)
    │   │   ├── index.html
    │   │   └── assets/
    │   ├── static/            ← Django static source
    │   ├── staticfiles/       ← після collectstatic
    │   ├── media/             ← фото (завантажені вручну)
    │   ├── db.sqlite3         ← база (створена через migrate)
    │   ├── .env               ← секрети (створено на місці)
    │   └── manage.py
    └── src/, package.json, ...  ← React код (не використовується на PA)
```

---

## ✅ Чек-ліст готовності

- [ ] Локально: `build-prod.bat` виконано, `backend/spa/index.html` існує
- [ ] Локально: закомічено і запушено у GitHub
- [ ] PA: репозиторій клоновано
- [ ] PA: virtualenv створено і пакети встановлено
- [ ] PA: `.env` створено з реальним SECRET_KEY і DEBUG=False
- [ ] PA: `migrate`, `createsuperuser`, `collectstatic` виконано
- [ ] PA: Web app створено, Manual configuration, Python 3.11
- [ ] PA: WSGI файл переписано
- [ ] PA: Static files mappings додано (3 шт)
- [ ] PA: Web app перезавантажено (Reload)
- [ ] Відкрив https://dnz52.pythonanywhere.com — побачив React сайт
- [ ] Зайшов в /admin/ під своїм суперюзером
- [ ] Завантажив media через zip (фото показуються)
- [ ] (опціонально) Загрузив `full_data.json` для перенесення локальної БД

---

## 🎯 Підсумок: скільки часу займе

| Етап | Час |
|------|-----|
| Підготовка локально (build + git push) | 5 хв |
| Git clone + pip install на PA | 5-10 хв |
| Налаштування .env, migrate, collectstatic | 5 хв |
| Налаштування Web app + WSGI | 10 хв |
| Завантаження media (zip 200 МБ) | 15-30 хв |
| (опц.) Завантаження БД | 5 хв |
| **Всього** | **~1 година** |

Питай якщо щось не виходить — допоможу розібратись з конкретною помилкою!
