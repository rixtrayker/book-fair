#!/bin/bash

echo "🚀 Setting up Book Fair Management System..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && npm run start:dev"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:3000"
