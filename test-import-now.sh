#!/bin/bash

echo "🧪 Testing Recipe Import Locally..."
echo ""

# First check if we have any recipes
echo "📊 Checking current library status..."
curl -s http://localhost:3000/api/recipes/import-batch | jq '.'

echo ""
echo "Press Enter to import 3 breakfast recipes (or Ctrl+C to cancel)..."
read

# Import 3 breakfast recipes as a test
echo ""
echo "🍳 Importing 3 breakfast recipes..."
curl -s -X POST http://localhost:3000/api/recipes/import-batch \
  -H "Content-Type: application/json" \
  -d '{
    "category": "breakfast",
    "count": 3,
    "strategyIndex": 0
  }' | jq '.'

echo ""
echo "✅ Test complete!"