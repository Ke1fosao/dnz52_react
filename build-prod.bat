@echo off
REM ============================================================================
REM Білдить React (frontend/) для продакшену і копіює готовий білд у backend/spa/
REM Потім ці файли заливаються у git і деплояться на PythonAnywhere.
REM ============================================================================
cd /d "%~dp0"

echo.
echo ============================================================
echo  [1/3] Білд React (Vite) у production режимі
echo ============================================================
cd frontend
if not exist "node_modules" (
    echo [setup] node_modules відсутні — встановлюю...
    call npm install
)
call npm run build
if errorlevel 1 (
    echo [error] npm run build впав. Перевірте помилки вище.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================================
echo  [2/3] Чищу стару backend\spa\ і копіюю свіжий білд
echo ============================================================
if exist "backend\spa" (
    rmdir /s /q "backend\spa"
)
mkdir "backend\spa"
xcopy "frontend\dist\*" "backend\spa\" /E /I /Y /Q
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
echo    git add backend/spa
echo    git commit -m "build: production React bundle"
echo    git push
echo.
echo  На PythonAnywhere: git pull + collectstatic + reload
echo.
pause
