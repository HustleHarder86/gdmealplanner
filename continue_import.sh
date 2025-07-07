#\!/bin/bash

import_recipes() {
    local category=$1
    local queryIndex=$2
    local count=$3
    
    echo "Importing $count $category recipes with queryIndex $queryIndex..."
    
    response=$(curl -X POST https://gdmealplanner.vercel.app/api/recipes/import-simple \
        -H "Content-Type: application/json" \
        -d "{\"category\": \"$category\", \"queryIndex\": $queryIndex, \"count\": $count}" \
        2>/dev/null)
    
    echo "Response: $response"
    echo "---"
    sleep 3
}

# Continue breakfast (6-9)
echo "=== CONTINUING BREAKFAST IMPORTS ==="
for i in {6..9}; do
    import_recipes "breakfast" $i 20
done

# Start lunch imports (0-4)
echo "=== STARTING LUNCH IMPORTS ==="
for i in {0..4}; do
    import_recipes "lunch" $i 20
done

