@echo off
REM ============================================================================
REM Запуск Django backend (REST API + адмінка)
REM Доступний на http://localhost:8000
REM ============================================================================
cd /d "%~dp0backend"

REM 1. Створити venv якщо не існує
if not exist ".venv\Scripts\python.exe" (
    echo [setup] Створюю Python venv...
    py -m venv .venv
    if errorlevel 1 (
        echo [error] Не вдалось створити venv. Перевірте що Python встановлено.
        pause
        exit /b 1
    )
    echo [setup] Встановлюю залежності...
    .venv\Scripts\pip install -r requirements.txt
    if errorlevel 1 (
        echo [error] Не вдалось встановити пакети.
        pause
        exit /b 1
    )
)

REM 2. Створити .env з DEBUG=True якщо не існує
if not exist ".env" (
    echo [setup] Створюю .env для dev режиму DEBUG=True...
    (
        echo DEBUG=True
        echo SECRET_KEY=django-insecure-dev-key-CHANGE-ME-in-production
        echo ALLOWED_HOSTS=localhost,127.0.0.1
        echo CSRF_TRUSTED_ORIGINS=
        echo CORS_ALLOWED_ORIGINS=
    ) > .env
)

REM 3. Виконати міграції
echo [migrate] Перевіряю міграції БД...
.venv\Scripts\python manage.py migrate --noinput

REM 4. Зібрати статичні файли (для адмінки) якщо їх немає
if not exist "staticfiles\admin" (
    echo [setup] Збираю статичні файли для адмінки...
    .venv\Scripts\python manage.py collectstatic --noinput
)

echo.
echo ============================================================
echo  Django backend стартує на http://localhost:8000
echo.
echo  REST API:  http://localhost:8000/api/v1/
echo  Адмінка:   http://localhost:8000/admin/
echo.
echo  Існуючі користувачі адмінки:
.venv\Scripts\python manage.py shell -c "from django.contrib.auth import get_user_model; [print(f'    - {u.username}') for u in get_user_model().objects.filter(is_superuser=True)]" 2>nul
echo.
echo  Якщо треба створити нового адміна:
echo    cd backend ^& .venv\Scripts\python manage.py createsuperuser
echo ============================================================
echo.

.venv\Scripts\python manage.py runserver
