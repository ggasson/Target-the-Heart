@echo off
REM Target The Heart - Setup Script for Cursor Migration (Windows)
REM This script helps set up the project after migrating from Replit

echo 🎯 Target The Heart - Cursor Migration Setup
echo =============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i

if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js 
node --version
echo detected

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm 
npm --version
echo detected

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

REM Remove Replit-specific dependencies
echo.
echo 🧹 Removing Replit-specific dependencies...
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created. Please edit it with your actual values.
) else (
    echo ✅ .env file already exists
)

REM Check if PostgreSQL is available
echo.
echo 🗄️  Checking database setup...

REM Check if DATABASE_URL is set in .env
findstr /C:"DATABASE_URL=postgresql://" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ DATABASE_URL found in .env
) else (
    echo ⚠️  DATABASE_URL not configured in .env
    echo    Please set up your PostgreSQL database and update .env
)

REM Check if Firebase config is set
findstr /C:"VITE_FIREBASE_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    findstr /C:"your-firebase-api-key" .env >nul 2>&1
    if %errorlevel% neq 0 (
        echo ✅ Firebase configuration found
    ) else (
        echo ⚠️  Firebase configuration not set in .env
        echo    Please configure Firebase in your .env file
    )
) else (
    echo ⚠️  Firebase configuration not set in .env
    echo    Please configure Firebase in your .env file
)

REM Check if Google Maps API key is set
findstr /C:"VITE_GOOGLE_MAPS_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    findstr /C:"your-google-maps-api-key" .env >nul 2>&1
    if %errorlevel% neq 0 (
        echo ✅ Google Maps API key found
    ) else (
        echo ⚠️  Google Maps API key not set in .env
        echo    Please configure Google Maps API in your .env file
    )
) else (
    echo ⚠️  Google Maps API key not set in .env
    echo    Please configure Google Maps API in your .env file
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your actual API keys and database URL
echo 2. Set up your PostgreSQL database (local or cloud)
echo 3. Run 'npm run db:push' to initialize database schema
echo 4. Run 'npm run dev' to start development server
echo.
echo For detailed instructions, see MIGRATION_GUIDE.md
pause
