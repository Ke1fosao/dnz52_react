@echo off
REM ============================================================================
REM Білдить React для продакшену і копіює готовий dist/ у backend/spa/
REM Потім ці файли заливаються у git і деплояться на PythonAnywhere.
REM ============================================================================
cd /d "%~dp0"

echo.
echo ============================================================
echo  [1/3] Білд React (Vite) у production режимі
echo ============================================================
call npm run build
if errorlevel 1 (
    echo [error] npm run build впав. Перевірте помилки вище.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  [2/3] Чищу стару backend\spa\ і копіюю свіжий dist
echo ============================================================
if exist "backend\spa" (
    rmdir /s /q "backend\spa"
)
mkdir "backend\spa"
xcopy "dist\*" "backend\spa\" /E /I /Y /Q
if errorlevel 1 (
    echo [error] Копіювання не вдалось.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  [3/3] Готово! Готові файли у backend\spa\
echo ============================================================
echo.
echo  Наступні кроки:
echo.
echo  1^) Перевірте локально що все працює:
echo     - Зупиніть React dev сервер ^(якщо запущений^)
echo     - У backend\.env поставте DEBUG=False
echo     - cd backend ^&^& .venv\Scripts\python manage.py collectstatic --noinput
echo     - python manage.py runserver
echo     - Відкрийте http://localhost:8000 — побачите React сайт
echo.
echo  2^) Закомітьте і запуште в GitHub:
echo     git add backend/spa
echo     git commit -m "build: production React bundle"
echo     git push
echo.
echo  3^) На PythonAnywhere: git pull ^+ python manage.py collectstatic ^+ reload
echo.
pause
