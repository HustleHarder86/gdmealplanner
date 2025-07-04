#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load current recipes
const recipesPath = path.join(__dirname, '../data/recipes/recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

console.log('Recipe Analysis Report');
console.log('=====================\n');

// Analyze recipe patterns
const analysisResults = {
    totalRecipes: recipes.length,
    realRecipes: [],
    fakeRecipes: [],
    patterns: {
        genericInstructions: 0,
        templateTitles: 0,
        missingImages: 0,
        suspiciousUrls: 0
    }
};

// Generic instruction patterns that indicate fake recipes
const genericInstructionPatterns = [
    'Prepare all ingredients and preheat',
    'Season .* with salt, pepper, and spices',
    'Plate the main protein with sides',
    'Combine all components and serve immediately',
    'Prepare .* as desired',
    'according to package directions'
];

// Title patterns that indicate generated recipes
const titlePatterns = [
    /^(Mediterranean|American|Mexican|Asian-inspired|Nordic|French|Italian|Middle Eastern|Indian-spiced|Southwest) /,
    / with .* and .*/,  // "X with Y and Z" pattern
];

recipes.forEach(recipe => {
    let isFake = false;
    const issues = [];
    
    // Check URL validity (we know only 1 is real)
    if (recipe.title === "Mediterranean Chicken Pita") {
        analysisResults.realRecipes.push(recipe);
        return;
    }
    
    // Check for generic instructions
    if (recipe.instructions) {
        const instructionText = recipe.instructions.join(' ');
        for (const pattern of genericInstructionPatterns) {
            if (instructionText.includes(pattern) || new RegExp(pattern).test(instructionText)) {
                isFake = true;
                issues.push('Generic instructions');
                analysisResults.patterns.genericInstructions++;
                break;
            }
        }
    }
    
    // Check for template-based titles
    for (const pattern of titlePatterns) {
        if (pattern.test(recipe.title)) {
            isFake = true;
            issues.push('Template-based title');
            analysisResults.patterns.templateTitles++;
            break;
        }
    }
    
    // Check for suspicious URLs
    if (recipe.url && recipe.url.includes('diabetesfoodhub.org')) {
        // URLs with very long slugs are likely generated
        const slug = recipe.url.split('/').pop();
        if (slug.length > 50) {
            isFake = true;
            issues.push('Suspicious URL length');
            analysisResults.patterns.suspiciousUrls++;
        }
    }
    
    // Check for missing images
    if (!recipe.image || recipe.image === '') {
        issues.push('Missing image');
        analysisResults.patterns.missingImages++;
    }
    
    if (isFake) {
        analysisResults.fakeRecipes.push({
            title: recipe.title,
            issues: issues,
            category: recipe.category
        });
    }
});

// Generate report
console.log(`Total Recipes: ${analysisResults.totalRecipes}`);
console.log(`Real Recipes: ${analysisResults.realRecipes.length}`);
console.log(`Fake/Generated Recipes: ${analysisResults.fakeRecipes.length}\n`);

console.log('Pattern Analysis:');
console.log(`- Generic Instructions: ${analysisResults.patterns.genericInstructions}`);
console.log(`- Template Titles: ${analysisResults.patterns.templateTitles}`);
console.log(`- Suspicious URLs: ${analysisResults.patterns.suspiciousUrls}`);
console.log(`- Missing Images: ${analysisResults.patterns.missingImages}\n`);

console.log('Fake Recipe Examples:');
analysisResults.fakeRecipes.slice(0, 10).forEach(recipe => {
    console.log(`- ${recipe.title}`);
    console.log(`  Issues: ${recipe.issues.join(', ')}`);
});

// Save detailed report
const reportPath = path.join(__dirname, '../data/recipes/fake_recipe_analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));

console.log(`\nDetailed report saved to: ${reportPath}`);

// Recommendations
console.log('\nRECOMMENDATIONS:');
console.log('1. Remove URL field from all fake recipes to avoid misleading users');
console.log('2. Add a "recipe_source" field to distinguish between:');
console.log('   - "original": Real scraped recipes');
console.log('   - "adapted": Modified from real sources');
console.log('   - "created": Original recipes created for the app');
console.log('3. Update recipe instructions with more specific, realistic steps');
console.log('4. Consider partnering with diabetesfoodhub.org for official recipe access');