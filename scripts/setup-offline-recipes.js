#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up offline recipes from production data...\n');

try {
  // Read the production recipes
  const dataPath = path.join(process.cwd(), 'data/production-recipes.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ production-recipes.json not found!');
    console.log('Run: node scripts/download-from-production.js first');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`✅ Loaded ${data.recipeCount} recipes from production`);
  
  // Create a static recipes file for the app
  const publicDir = path.join(process.cwd(), 'public/data');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Save recipes in public directory for static access
  const publicPath = path.join(publicDir, 'recipes.json');
  fs.writeFileSync(publicPath, JSON.stringify(data, null, 2));
  console.log(`✅ Created static recipe file: /public/data/recipes.json`);
  
  // Create a compressed version
  const compressedPath = path.join(publicDir, 'recipes.min.json');
  fs.writeFileSync(compressedPath, JSON.stringify(data));
  console.log(`✅ Created compressed version: /public/data/recipes.min.json`);
  
  // Update the export API to use local data
  const exportApiContent = `import { NextRequest, NextResponse } from 'next/server';
import recipesData from '@/data/production-recipes.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';
  const category = searchParams.get('category') || 'all';
  
  let recipes = recipesData.recipes;
  
  // Filter by category if requested
  if (category !== 'all') {
    recipes = recipes.filter((r: any) => r.category === category);
  }
  
  const exportData = {
    exportDate: new Date().toISOString(),
    recipeCount: recipes.length,
    category: category,
    format: format,
    recipes: recipes
  };
  
  if (format === 'json') {
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': \`attachment; filename="recipes_\${category}_\${new Date().toISOString().split('T')[0]}.json"\`
      }
    });
  }
  
  return NextResponse.json({
    success: true,
    message: \`Export ready for \${recipes.length} recipes\`,
    summary: {
      total: recipes.length,
      byCategory: recipesData.byCategory
    }
  });
}`;

  const exportApiPath = path.join(process.cwd(), 'app/api/recipes/export-offline/route.ts');
  const exportDir = path.dirname(exportApiPath);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  fs.writeFileSync(exportApiPath, exportApiContent);
  console.log(`✅ Created offline export API: /api/recipes/export-offline`);
  
  // Show summary
  console.log('\n📊 Recipe Summary:');
  console.log(`Total: ${data.recipeCount}`);
  Object.entries(data.byCategory || {}).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  console.log('\n✨ Offline recipe setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Recipes are available at: /data/recipes.json (static)');
  console.log('2. Or via API: /api/recipes/export-offline');
  console.log('3. Update components to use LocalRecipeService');
  console.log('4. Remove Spoonacular dependencies');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}