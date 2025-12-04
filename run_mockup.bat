@echo off
title DS1 Mock Server
echo ==========================================
echo      Starting DS1 in MOCK UP mode
echo ==========================================
echo.

REM Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] Node.js is not installed. >> error.log
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [Setup] First run detected. Installing dependencies...
    call npm install 2>> error.log
    if %errorlevel% neq 0 (
        echo [Error] Failed to install dependencies. Check error.log.
        pause
        exit /b
    )
)

REM Set Environment
set DS1_MODE=mock

REM Open Browser (wait 3 seconds for server to boot)
echo [System] Opening Control Panel in 3 seconds...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/admin.html"

REM Start Server
echo [System] Starting Server...
echo.
echo Database: sandbox_db.json
echo Errors are being logged to: error.log
echo.
node src/index.js 2>> error.log

pause
