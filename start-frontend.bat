@echo off
REM ============================================================================
REM Запуск React frontend (Vite dev server)
REM Доступний на http://localhost:5173
REM ============================================================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [setup] Встановлюю npm залежності...
    call npm install
    if errorlevel 1 (
        echo [error] Не вдалось встановити npm пакети.
        pause
        exit /b 1
    )
)

echo.
echo ============================================================
echo  React frontend стартує на http://localhost:5173
echo  (переконайтесь що Django backend теж запущено!)
echo ============================================================
echo.

call npm run dev
