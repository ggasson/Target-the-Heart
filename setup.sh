#!/bin/bash

# Target The Heart - Setup Script for Cursor Migration
# This script helps set up the project after migrating from Replit

echo "🎯 Target The Heart - Cursor Migration Setup"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Remove Replit-specific dependencies
echo ""
echo "🧹 Removing Replit-specific dependencies..."
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your actual values."
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is available
echo ""
echo "🗄️  Checking database setup..."

# Check if DATABASE_URL is set in .env
if grep -q "DATABASE_URL=postgresql://" .env; then
    echo "✅ DATABASE_URL found in .env"
else
    echo "⚠️  DATABASE_URL not configured in .env"
    echo "   Please set up your PostgreSQL database and update .env"
fi

# Check if Firebase config is set
if grep -q "VITE_FIREBASE_API_KEY=" .env && ! grep -q "your-firebase-api-key" .env; then
    echo "✅ Firebase configuration found"
else
    echo "⚠️  Firebase configuration not set in .env"
    echo "   Please configure Firebase in your .env file"
fi

# Check if Google Maps API key is set
if grep -q "VITE_GOOGLE_MAPS_API_KEY=" .env && ! grep -q "your-google-maps-api-key" .env; then
    echo "✅ Google Maps API key found"
else
    echo "⚠️  Google Maps API key not set in .env"
    echo "   Please configure Google Maps API in your .env file"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual API keys and database URL"
echo "2. Set up your PostgreSQL database (local or cloud)"
echo "3. Run 'npm run db:push' to initialize database schema"
echo "4. Run 'npm run dev' to start development server"
echo ""
echo "For detailed instructions, see MIGRATION_GUIDE.md"
