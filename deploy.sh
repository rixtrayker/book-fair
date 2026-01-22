#!/bin/bash

echo "🚀 Deploying to Fly.io..."

# Check if flyctl is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="/Users/amr/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    fly auth login
fi

# Check if app exists
if ! fly apps list | grep -q "book-fair"; then
    echo "📦 Creating app..."
    fly apps create book-fair --org personal
fi

# Check if volume exists
if ! fly volumes list | grep -q "book_fair_data"; then
    echo "💾 Creating volume..."
    fly volumes create book_fair_data --region ams --size 1
fi

# Deploy
echo "🚢 Deploying..."
fly deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌍 Your app: https://book-fair.fly.dev"
echo ""
echo "📝 To seed database:"
echo "   fly ssh console"
echo "   cd /app && node dist/seed-excel.js"
echo ""
echo "📊 View logs: fly logs"
