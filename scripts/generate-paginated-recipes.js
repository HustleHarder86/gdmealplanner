#!/usr/bin/env node

/**
 * Generate Paginated Recipe Files
 * Creates smaller JSON files for better deployment
 */

const fs = require('fs');
const path = require('path');

// Read the main recipe file
const dataPath = path.join(__dirname, '..', 'data', 'production-recipes.json');
const publicPath = path.join(__dirname, '..', 'public', 'data');

try {
  // Read the full recipe data
  const fullData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📊 Total recipes: ${fullData.recipes.length}`);
  
  // Create a summary file with metadata only
  const summary = {
    version: fullData.version,
    exportDate: fullData.exportDate,
    recipeCount: fullData.recipeCount,
    categoryBreakdown: fullData.categoryBreakdown,
    source: fullData.source,
    message: "Full recipe data split into category files for better performance"
  };
  
  // Save summary
  fs.writeFileSync(
    path.join(publicPath, 'recipes-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Split recipes by category
  const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  categories.forEach(category => {
    const categoryRecipes = fullData.recipes.filter(r => r.category === category);
    
    const categoryData = {
      category: category,
      recipeCount: categoryRecipes.length,
      recipes: categoryRecipes
    };
    
    // Save category file
    const categoryPath = path.join(publicPath, `recipes-${category}.json`);
    fs.writeFileSync(categoryPath, JSON.stringify(categoryData, null, 2));
    
    // Save minified version
    const minPath = path.join(publicPath, `recipes-${category}.min.json`);
    fs.writeFileSync(minPath, JSON.stringify(categoryData));
    
    console.log(`✅ Created ${category} files: ${categoryRecipes.length} recipes`);
  });
  
  // Create a compact version with limited recipe data
  const compactRecipes = fullData.recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    totalTime: recipe.totalTime,
    servings: recipe.servings,
    imageUrl: recipe.imageUrl || recipe.localImageUrl,
    nutrition: {
      calories: recipe.nutrition.calories,
      carbohydrates: recipe.nutrition.carbohydrates,
      protein: recipe.nutrition.protein,
      fiber: recipe.nutrition.fiber
    }
  }));
  
  const compactData = {
    ...fullData,
    recipes: compactRecipes
  };
  
  // Save compact version
  fs.writeFileSync(
    path.join(publicPath, 'recipes-compact.json'),
    JSON.stringify(compactData, null, 2)
  );
  
  console.log('\n📦 Generated files:');
  console.log('- recipes-summary.json (metadata only)');
  console.log('- recipes-breakfast.json');
  console.log('- recipes-lunch.json');
  console.log('- recipes-dinner.json');
  console.log('- recipes-snack.json');
  console.log('- recipes-compact.json (limited fields)');
  
  // Check file sizes
  console.log('\n📏 File sizes:');
  const files = fs.readdirSync(publicPath).filter(f => f.startsWith('recipes-'));
  files.forEach(file => {
    const stats = fs.statSync(path.join(publicPath, file));
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`- ${file}: ${size} MB`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}