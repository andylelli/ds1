@echo off
title DS1 Live Mode
echo ==========================================
echo      Starting DS1 - LIVE MODE
echo ==========================================
echo.
echo WARNING: You are about to start the application in LIVE mode.
echo Real API calls will be made and real money may be spent (Ads, Orders, etc).
echo.
pause

REM Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [Setup] First run detected. Installing dependencies...
    call npm install
)

REM Set Environment to Live
set DS1_MODE=live

REM Open Browser (wait 5 seconds for server to boot)
echo [System] Opening Control Panel in 5 seconds...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

REM Start Server using tsx
echo [System] Starting Server in LIVE Mode...
echo.
echo Control Panel: http://localhost:3000
echo.
call npx tsx src/index.ts

pause
