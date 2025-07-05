#!/bin/bash

# Test script for Vercel recipe import API
# Usage: ./test-vercel-import.sh [production|local]

MODE=${1:-local}
SECRET=${IMPORT_SECRET:-"test-secret-123"}

if [ "$MODE" = "production" ]; then
    BASE_URL="https://your-app.vercel.app"
    echo "🌐 Testing PRODUCTION import API"
else
    BASE_URL="http://localhost:3000"
    echo "🏠 Testing LOCAL import API"
fi

echo ""
echo "📊 Checking current library status..."
echo ""

# Check status
curl -s "${BASE_URL}/api/recipes/import-batch?secret=${SECRET}" | jq '.'

echo ""
echo "🍳 Running test import (5 breakfast recipes)..."
echo ""

# Run import
curl -s -X POST "${BASE_URL}/api/recipes/import-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "breakfast",
    "count": 5,
    "strategyIndex": 0,
    "secret": "'${SECRET}'"
  }' | jq '.'

echo ""
echo "✅ Test complete!"