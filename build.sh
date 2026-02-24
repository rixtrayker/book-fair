#!/bin/bash

set -e

echo "🏗️  Building Kotobgy for production..."
echo ""

echo "📦 Building backend..."
cd backend
npm run build

echo ""
echo "📦 Building frontend..."
cd ../frontend
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output locations:"
echo "   Backend:  backend/dist/"
echo "   Frontend: frontend/dist/"
