@echo off
title DS1 Control Panel
echo ==========================================
echo      Starting DS1 Control Panel
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

REM Build TypeScript
echo [System] Building application...
call npm run build 2>> error.log
if %errorlevel% neq 0 (
    echo [Error] Build failed. Check error.log.
    pause
    exit /b
)

REM Open Browser (wait 3 seconds for server to boot)
echo [System] Opening Control Panel in 3 seconds...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

REM Start Server
echo [System] Starting Server...
echo.
echo Control Panel: http://localhost:3000
echo Errors are being logged to: error.log
echo.
npm start 2>> error.log

pause
