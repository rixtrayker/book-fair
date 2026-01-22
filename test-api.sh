#!/bin/bash

echo "📦 Installing Newman..."
npm install -g newman

echo ""
echo "✅ Newman installed!"
echo ""
echo "🧪 Running API tests..."
echo ""

# Make sure backend is running
if ! curl -s http://localhost:3001/api/users/profile > /dev/null 2>&1; then
    echo "⚠️  Backend is not running!"
    echo "Please start the backend first: cd backend && npm run start:dev"
    exit 1
fi

# Run the collection
newman run postman_collection.json \
    --env-var "baseUrl=http://localhost:3001/api" \
    --reporters cli,json \
    --reporter-json-export newman-results.json

echo ""
echo "✅ Tests complete! Check newman-results.json for details"
