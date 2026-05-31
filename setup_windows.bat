@echo off
title SS Motors POS Suite - Bootstrapper
color 0B
clear

echo =======================================================================
echo          SS MOTORS SPARE PARTS HUB - WINDOWS WORKSTATION INITIALIZER
echo =======================================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js was not detected on this computer!
    echo.
    echo Please install Node.js before launching this POS system.
    echo 1. Open https://nodejs.org/ in your browser.
    echo 2. Download and install the LTS Version for Windows.
    echo 3. Re-run this script after installation.
    echo.
    pause
    exit /b 1
)

:: Double check env configuration state
if not exist .env (
    echo [*] Creating local configuration file [.env] from template...
    copy .env.example .env >nul
)

:: Install modules if missing or outdated
if not exist node_modules (
    echo [*] Installing required modules (npm install)... This may take 1-2 minutes...
    call npm install
) else (
    echo [*] Existing modules detected. Proceeding to startup sequence...
)

echo.
echo =======================================================================
echo SUCCESS: Launching POS Server on http://localhost:3000
echo Keep this window open while using the POS system!
echo =======================================================================
echo.

:: Boot Node setup in dev mode to make loading instant
call npm run dev

pause
