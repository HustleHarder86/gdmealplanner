/**
 * Recipe Importer Bookmarklet
 * Click this while viewing any recipe page to extract and import the recipe
 */

(function() {
    'use strict';
    
    // Configuration
    const API_ENDPOINT = 'http://localhost:3000/api/import-recipe'; // Your app's import endpoint
    
    // Create overlay UI
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'recipe-importer-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                ">
                    <div id="import-content">
                        <h2 style="margin: 0 0 20px 0; color: #333;">🍳 Recipe Importer</h2>
                        <div id="import-status">Extracting recipe data...</div>
                        <div id="import-progress" style="
                            width: 100%;
                            height: 4px;
                            background: #f0f0f0;
                            border-radius: 2px;
                            margin: 15px 0;
                            overflow: hidden;
                        ">
                            <div id="progress-bar" style="
                                height: 100%;
                                background: linear-gradient(90deg, #4CAF50, #45a049);
                                width: 0%;
                                transition: width 0.3s;
                            "></div>
                        </div>
                        <div id="recipe-preview"></div>
                        <div id="import-actions" style="margin-top: 20px; text-align: center;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    // Extract recipe from JSON-LD
    function extractJsonLd() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (Array.isArray(data)) {
                    const recipe = data.find(item => item['@type'] === 'Recipe');
                    if (recipe) return recipe;
                } else if (data['@type'] === 'Recipe') {
                    return data;
                }
            } catch (e) {
                // Continue searching
            }
        }
        return null;
    }
    
    // Extract recipe from microdata
    function extractMicrodata() {
        const recipeElement = document.querySelector('[itemtype*="schema.org/Recipe"]');
        if (!recipeElement) return null;
        
        const extract = (prop) => {
            const elem = recipeElement.querySelector(`[itemprop="${prop}"]`);
            return elem ? (elem.textContent || elem.getAttribute('content') || '').trim() : '';
        };
        
        const extractList = (prop) => {
            const elems = recipeElement.querySelectorAll(`[itemprop="${prop}"]`);
            return Array.from(elems).map(elem => 
                (elem.textContent || elem.getAttribute('content') || '').trim()
            ).filter(text => text.length > 0);
        };
        
        return {
            '@type': 'Recipe',
            name: extract('name'),
            description: extract('description'),
            prepTime: extract('prepTime'),
            cookTime: extract('cookTime'),
            totalTime: extract('totalTime'),
            recipeYield: extract('recipeYield'),
            recipeIngredient: extractList('recipeIngredient'),
            recipeInstructions: extractList('recipeInstructions'),
            nutrition: {
                calories: extract('calories'),
                carbohydrateContent: extract('carbohydrateContent'),
                proteinContent: extract('proteinContent'),
                fiberContent: extract('fiberContent'),
                fatContent: extract('fatContent')
            }
        };
    }
    
    // Parse duration to minutes
    function parseDuration(duration) {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;
        
        const match = duration.match(/PT(\d+)M/) || duration.match(/(\d+)\s*min/i);
        return match ? parseInt(match[1]) : 0;
    }
    
    // Parse ingredient text
    function parseIngredient(text) {
        const patterns = [
            /^([\d\s\-\/\.½⅓⅔¼¾]+)\s*(cups?|tbsp|tsp|oz|lb|g|ml|L)\s+(.+)$/i,
            /^(\d+)\s+(.+)$/,
            /^(.+)$/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                if (match.length === 4) {
                    return {
                        amount: match[1].trim(),
                        unit: match[2].trim(),
                        item: match[3].trim()
                    };
                } else if (match.length === 3) {
                    return {
                        amount: match[1].trim(),
                        unit: '',
                        item: match[2].trim()
                    };
                } else {
                    return {
                        amount: '',
                        unit: '',
                        item: match[1].trim()
                    };
                }
            }
        }
        
        return { amount: '', unit: '', item: text };
    }
    
    // Parse nutrition data
    function parseNutrition(nutritionData) {
        const nutrition = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fiber: 0,
            fat: 0,
            sugar: 0
        };
        
        if (!nutritionData) return nutrition;
        
        const extract = (value) => {
            if (typeof value === 'number') return value;
            const match = String(value).match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        };
        
        nutrition.calories = extract(nutritionData.calories);
        nutrition.carbs = extract(nutritionData.carbohydrateContent);
        nutrition.protein = extract(nutritionData.proteinContent);
        nutrition.fiber = extract(nutritionData.fiberContent);
        nutrition.fat = extract(nutritionData.fatContent);
        nutrition.sugar = extract(nutritionData.sugarContent);
        
        return nutrition;
    }
    
    // Validate for GD requirements
    function validateGDNutrition(nutrition) {
        const { carbs, protein, fiber } = nutrition;
        
        if (carbs === 0) return { valid: false, reason: 'No carbohydrate data' };
        if (carbs < 10 || carbs > 50) return { valid: false, reason: `Carbs out of range: ${carbs}g (need 10-50g)` };
        if (protein < 5) return { valid: false, reason: `Low protein: ${protein}g (need 5g+)` };
        if (fiber < 2) return { valid: false, reason: `Low fiber: ${fiber}g (need 2g+)` };
        
        return { valid: true, reason: 'Meets GD requirements' };
    }
    
    // Determine recipe category
    function determineCategory(title) {
        const lower = title.toLowerCase();
        if (/breakfast|egg|pancake|oatmeal|smoothie|granola/.test(lower)) return 'breakfast';
        if (/snack|bite|energy|bar/.test(lower)) return 'snacks';
        if (/lunch|sandwich|wrap|salad|soup/.test(lower)) return 'lunch';
        return 'dinner';
    }
    
    // Update UI
    function updateStatus(message, progress = 0) {
        const statusEl = document.getElementById('import-status');
        const progressBar = document.getElementById('progress-bar');
        if (statusEl) statusEl.textContent = message;
        if (progressBar) progressBar.style.width = progress + '%';
    }
    
    // Show recipe preview
    function showPreview(recipe, validation) {
        const previewEl = document.getElementById('recipe-preview');
        const actionsEl = document.getElementById('import-actions');
        
        const validationColor = validation.valid ? '#4CAF50' : '#f44336';
        const validationIcon = validation.valid ? '✅' : '❌';
        
        previewEl.innerHTML = `
            <div style="text-align: left; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${recipe.title}</h3>
                <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">${recipe.description.substring(0, 150)}...</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                    <div>
                        <strong>⏱️ Time:</strong> ${recipe.totalTime} minutes<br>
                        <strong>🍽️ Serves:</strong> ${recipe.servings}<br>
                        <strong>📂 Category:</strong> ${recipe.category}
                    </div>
                    <div>
                        <strong>🍞 Carbs:</strong> ${recipe.nutrition.carbs}g<br>
                        <strong>🥩 Protein:</strong> ${recipe.nutrition.protein}g<br>
                        <strong>🌾 Fiber:</strong> ${recipe.nutrition.fiber}g
                    </div>
                </div>
                
                <div style="
                    padding: 10px;
                    border-radius: 6px;
                    background: ${validation.valid ? '#e8f5e8' : '#ffe8e8'};
                    border: 1px solid ${validationColor};
                    margin: 15px 0;
                ">
                    ${validationIcon} <strong>GD Validation:</strong> ${validation.reason}
                </div>
                
                <details style="margin: 15px 0;">
                    <summary style="cursor: pointer; font-weight: bold;">📋 Ingredients (${recipe.ingredients.length})</summary>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${recipe.ingredients.slice(0, 5).map(ing => `<li>${ing.text}</li>`).join('')}
                        ${recipe.ingredients.length > 5 ? `<li><em>... and ${recipe.ingredients.length - 5} more</em></li>` : ''}
                    </ul>
                </details>
            </div>
        `;
        
        actionsEl.innerHTML = `
            <button id="import-btn" style="
                background: ${validation.valid ? '#4CAF50' : '#ccc'};
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: ${validation.valid ? 'pointer' : 'not-allowed'};
                margin-right: 10px;
            " ${!validation.valid ? 'disabled' : ''}>
                ${validation.valid ? '✅ Import Recipe' : '❌ Cannot Import'}
            </button>
            <button id="cancel-btn" style="
                background: #666;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
            ">Cancel</button>
        `;
        
        // Add event listeners
        document.getElementById('cancel-btn').onclick = () => {
            document.getElementById('recipe-importer-overlay').remove();
        };
        
        if (validation.valid) {
            document.getElementById('import-btn').onclick = () => importRecipe(recipe);
        }
    }
    
    // Import recipe to your app
    async function importRecipe(recipe) {
        updateStatus('Importing recipe to your app...', 90);
        
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipe: recipe,
                    source_url: window.location.href,
                    imported_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                updateStatus('✅ Recipe imported successfully!', 100);
                setTimeout(() => {
                    document.getElementById('recipe-importer-overlay').remove();
                }, 2000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            updateStatus(`❌ Import failed: ${error.message}`, 0);
            console.error('Import error:', error);
        }
    }
    
    // Main execution
    function main() {
        // Check if already running
        if (document.getElementById('recipe-importer-overlay')) {
            return;
        }
        
        const overlay = createOverlay();
        
        setTimeout(() => {
            updateStatus('Searching for recipe data...', 20);
            
            // Try to extract recipe
            let recipeData = extractJsonLd();
            if (!recipeData) {
                updateStatus('Trying microdata extraction...', 40);
                recipeData = extractMicrodata();
            }
            
            if (!recipeData || !recipeData.name) {
                updateStatus('❌ No recipe data found on this page', 0);
                document.getElementById('import-actions').innerHTML = `
                    <button onclick="document.getElementById('recipe-importer-overlay').remove()" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Close</button>
                `;
                return;
            }
            
            updateStatus('Processing recipe data...', 60);
            
            // Parse the recipe
            const recipe = {
                title: recipeData.name,
                description: recipeData.description || '',
                url: window.location.href,
                source: window.location.hostname,
                prepTime: parseDuration(recipeData.prepTime),
                cookTime: parseDuration(recipeData.cookTime),
                totalTime: parseDuration(recipeData.totalTime),
                servings: parseInt(recipeData.recipeYield) || 4,
                ingredients: [],
                instructions: [],
                nutrition: parseNutrition(recipeData.nutrition),
                category: '',
                verified: true,
                imported_at: new Date().toISOString()
            };
            
            // Calculate total time if not provided
            if (!recipe.totalTime) {
                recipe.totalTime = recipe.prepTime + recipe.cookTime;
            }
            
            // Parse ingredients
            if (Array.isArray(recipeData.recipeIngredient)) {
                recipe.ingredients = recipeData.recipeIngredient.map(ing => ({
                    text: ing,
                    parsed: parseIngredient(ing)
                }));
            }
            
            // Parse instructions
            if (recipeData.recipeInstructions) {
                const instructions = Array.isArray(recipeData.recipeInstructions) 
                    ? recipeData.recipeInstructions 
                    : [recipeData.recipeInstructions];
                
                recipe.instructions = instructions.map(inst => {
                    if (typeof inst === 'string') return inst;
                    return inst.text || inst.name || '';
                }).filter(text => text.length > 5);
            }
            
            // Determine category
            recipe.category = determineCategory(recipe.title);
            
            updateStatus('Validating for gestational diabetes...', 80);
            
            // Validate for GD
            const validation = validateGDNutrition(recipe.nutrition);
            
            // Show preview
            showPreview(recipe, validation);
            
        }, 500);
    }
    
    // Run the importer
    main();
    
})();

// Create bookmarklet code
const bookmarkletCode = `javascript:(${encodeURIComponent(
    '(' + arguments.callee.toString() + ')()'
)})`;

console.log('Recipe Importer Bookmarklet Ready!');
console.log('Drag this to your bookmarks bar:', bookmarkletCode);