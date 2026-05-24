@echo off
title Shank Strategy Ops LLC Workbench Launcher
echo ========================================================
echo   SHANK STRATEGY OPS LLC - OPERATIONS WORKBENCH
echo ========================================================
echo.

:: Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please install Node.js from https://nodejs.org/ first.
    echo.
    pause
    exit /b
)

:: Auto-install dependencies if node_modules folder is missing
if not exist node_modules (
    echo [1/2] node_modules folder not found. Installing dependencies...
    call npm install
) else (
    echo [1/2] Project dependencies verified.
)

echo [2/2] Starting consulting servers and frontend workspace...
echo.
echo --------------------------------------------------------
echo   KEEP THIS WINDOW OPEN WHILE RUNNING THE WORKBENCH
echo   To shut down, close this window or press Ctrl+C
echo --------------------------------------------------------
echo.

:: Auto-launch default web browser to the application port
start "" http://localhost:3000

:: Start developer server
npm run dev
