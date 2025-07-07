#\!/bin/bash

# Function to import recipes
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
    
    # Wait a few seconds between requests
    sleep 3
}

# Start with breakfast (queryIndex 2-9, need 80 more)
echo "=== STARTING BREAKFAST IMPORTS ==="
for i in {2..5}; do
    import_recipes "breakfast" $i 20
done

