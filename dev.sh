#!/bin/bash

set -e

echo "🚀 Starting Kotobgy Development Environment..."
echo ""

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        exit 1
    fi
}

check_command node
check_command npm

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed or not in PATH"
fi

if ! docker ps &> /dev/null 2>&1; then
    echo "⚠️  Docker is not running (optional for local Postgres)"
fi

DB_NAME="kotobgy"
DB_EXISTS=$(psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
    echo "📦 Creating database '$DB_NAME'..."
    createdb $DB_NAME 2>/dev/null || echo "⚠️  Could not create database (may already exist or need manual creation)"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Running database migrations..."
cd backend
npm run migration:run 2>/dev/null || echo "⚠️  Migration failed, check database connection"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting servers..."
echo ""

npm run dev
