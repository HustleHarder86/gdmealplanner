#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load current recipes
const recipesPath = path.join(__dirname, '../data/recipes/recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

// Load verification report
const verificationPath = path.join(__dirname, '../data/recipes/verification_report.json');
const verification = JSON.parse(fs.readFileSync(verificationPath, 'utf-8'));

// Get list of valid URLs
const validUrls = verification.valid.map(v => v.recipe.url);

console.log('Cleaning Recipe Data');
console.log('===================\n');

let updatedCount = 0;
let urlsRemoved = 0;
let sourcesAdded = 0;

// Clean each recipe
const cleanedRecipes = recipes.map(recipe => {
    const cleanedRecipe = { ...recipe };
    let updated = false;
    
    // Check if URL is valid
    if (recipe.url && !validUrls.includes(recipe.url)) {
        // Remove fake URL
        delete cleanedRecipe.url;
        urlsRemoved++;
        updated = true;
        
        // Add proper source attribution
        cleanedRecipe.recipe_source = 'created';
        cleanedRecipe.source_note = 'Original recipe created for gestational diabetes meal planning';
        sourcesAdded++;
    } else if (recipe.url && validUrls.includes(recipe.url)) {
        // Mark as original
        cleanedRecipe.recipe_source = 'original';
        cleanedRecipe.source_note = 'Recipe from diabetesfoodhub.org';
        sourcesAdded++;
        updated = true;
    }
    
    // Improve generic instructions if present
    if (recipe.instructions && recipe.instructions.length > 0) {
        const firstInstruction = recipe.instructions[0];
        if (firstInstruction.includes('Prepare all ingredients and preheat')) {
            // Make instructions more specific based on recipe type
            const improvedInstructions = improveInstructions(cleanedRecipe);
            if (improvedInstructions) {
                cleanedRecipe.instructions = improvedInstructions;
                updated = true;
            }
        }
    }
    
    // Ensure all recipes have proper category
    if (!cleanedRecipe.category && cleanedRecipe.nutrition) {
        cleanedRecipe.category = determineCategoryFromNutrition(cleanedRecipe.nutrition);
        updated = true;
    }
    
    if (updated) {
        updatedCount++;
    }
    
    return cleanedRecipe;
});

// Helper function to improve instructions
function improveInstructions(recipe) {
    const { title, ingredients, category } = recipe;
    const instructions = [];
    
    if (category === 'breakfast') {
        if (title.toLowerCase().includes('egg')) {
            instructions.push('Crack eggs into a bowl and whisk with milk until well combined.');
            instructions.push('Heat a non-stick pan over medium heat and add a small amount of oil or butter.');
            instructions.push('Pour in egg mixture and cook, stirring gently, until eggs are just set but still creamy.');
            instructions.push('Season with salt and pepper to taste.');
            if (ingredients.some(i => i.item.includes('vegetable'))) {
                instructions.push('Add vegetables during the last minute of cooking.');
            }
            instructions.push('Serve immediately while hot.');
        } else if (title.toLowerCase().includes('oat')) {
            instructions.push('In a saucepan, bring water or milk to a boil.');
            instructions.push('Add oats and reduce heat to medium-low.');
            instructions.push('Simmer for 5-7 minutes, stirring occasionally, until oats are creamy.');
            instructions.push('Remove from heat and let stand for 1 minute.');
            instructions.push('Top with your choice of fruits, nuts, or seeds.');
            instructions.push('Drizzle with a small amount of honey if desired.');
        } else {
            return null; // Keep original
        }
    } else if (category === 'lunch' || category === 'dinner') {
        if (title.toLowerCase().includes('chicken')) {
            instructions.push('Pat chicken dry and season both sides with salt, pepper, and your choice of herbs.');
            instructions.push('Heat olive oil in a large skillet over medium-high heat.');
            instructions.push('Add chicken and cook for 6-7 minutes per side until golden brown and cooked through.');
            instructions.push('Remove chicken and let rest for 5 minutes before slicing.');
            if (ingredients.some(i => i.item.includes('vegetable'))) {
                instructions.push('In the same pan, sauté vegetables until tender-crisp.');
            }
            instructions.push('Serve chicken with vegetables and whole grains if using.');
        } else if (title.toLowerCase().includes('salmon')) {
            instructions.push('Preheat oven to 400°F (200°C).');
            instructions.push('Place salmon on a baking sheet lined with parchment paper.');
            instructions.push('Drizzle with olive oil and season with salt, pepper, and lemon juice.');
            instructions.push('Bake for 12-15 minutes until fish flakes easily with a fork.');
            instructions.push('Meanwhile, prepare any side dishes.');
            instructions.push('Serve salmon hot with prepared sides.');
        } else {
            return null; // Keep original
        }
    } else {
        return null; // Keep original for snacks
    }
    
    return instructions;
}

// Helper function to determine category from nutrition
function determineCategoryFromNutrition(nutrition) {
    const carbs = nutrition.carbs || 0;
    
    if (carbs <= 20) {
        return 'snacks';
    } else if (carbs <= 35) {
        return 'lunch';
    } else {
        return 'dinner';
    }
}

// Save cleaned recipes
fs.writeFileSync(recipesPath, JSON.stringify(cleanedRecipes, null, 2));

// Also update category files
const categories = ['breakfast', 'lunch', 'dinner', 'snacks'];
categories.forEach(category => {
    const categoryRecipes = cleanedRecipes.filter(r => r.category === category);
    const categoryPath = path.join(__dirname, `../data/recipes/${category}.json`);
    fs.writeFileSync(categoryPath, JSON.stringify(categoryRecipes, null, 2));
});

// Create a summary of changes
const summary = {
    totalRecipes: recipes.length,
    recipesUpdated: updatedCount,
    fakeUrlsRemoved: urlsRemoved,
    sourceAttributionsAdded: sourcesAdded,
    timestamp: new Date().toISOString(),
    recipesBySource: {
        original: cleanedRecipes.filter(r => r.recipe_source === 'original').length,
        created: cleanedRecipes.filter(r => r.recipe_source === 'created').length,
        adapted: cleanedRecipes.filter(r => r.recipe_source === 'adapted').length
    }
};

const summaryPath = path.join(__dirname, '../data/recipes/cleaning_summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`Total recipes processed: ${recipes.length}`);
console.log(`Recipes updated: ${updatedCount}`);
console.log(`Fake URLs removed: ${urlsRemoved}`);
console.log(`Source attributions added: ${sourcesAdded}`);
console.log('\nRecipes by source:');
console.log(`- Original (from diabetesfoodhub.org): ${summary.recipesBySource.original}`);
console.log(`- Created (for this app): ${summary.recipesBySource.created}`);
console.log(`- Adapted: ${summary.recipesBySource.adapted}`);
console.log('\nCleaning complete! Updated recipes saved.');