#!/bin/bash

echo "🚀 Deploying to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="/Users/amr/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Please login to Fly.io..."
    flyctl auth login
fi

# Check if app exists
if ! flyctl apps list | grep -q "book-fair"; then
    echo "📦 Creating app..."
    flyctl apps create book-fair --org personal
fi

# Check if volume exists
if ! flyctl volumes list | grep -q "book_fair_data"; then
    echo "💾 Creating volume..."
    flyctl volumes create book_fair_data --region ams --size 1
fi

# Deploy
echo "🚢 Deploying..."
flyctl deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌍 Your app: https://book-fair.fly.dev"
echo ""
echo "📝 To seed database:"
echo "   flyctl ssh console"
echo "   cd /app && node seed-production.js"
echo ""
echo "📊 View logs: flyctl logs"
