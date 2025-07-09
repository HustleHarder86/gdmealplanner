#!/usr/bin/env npx tsx
/**
 * Sync Recipe Data from Firebase to Local JSON Files
 * 
 * This script fetches the latest recipe data from Firebase and updates
 * the local JSON files used for offline access.
 * 
 * Usage: npm run sync-recipes
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeFirebaseAdmin, adminDb } from '../src/lib/firebase/admin';
import { Recipe } from '../src/types/recipe';

async function syncOfflineRecipes() {
  console.log('🔄 Starting recipe sync from Firebase to local files...\n');

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();
    console.log('✅ Firebase Admin initialized');

    // Fetch all recipes from Firebase
    console.log('📥 Fetching recipes from Firebase...');
    const recipesSnapshot = await adminDb()
      .collection('recipes')
      .orderBy('createdAt', 'desc')
      .get();

    const recipes: Recipe[] = [];
    recipesSnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
      } as Recipe);
    });

    console.log(`✅ Fetched ${recipes.length} recipes from Firebase`);

    // Create the export object
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recipeCount: recipes.length,
      recipes: recipes,
      source: 'Firebase Production Database',
    };

    // Ensure directories exist
    const dataDir = path.join(process.cwd(), 'data');
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Write full JSON file
    const fullJsonPath = path.join(publicDataDir, 'recipes.json');
    fs.writeFileSync(fullJsonPath, JSON.stringify(exportData, null, 2));
    const fullSize = fs.statSync(fullJsonPath).size;
    console.log(`✅ Written recipes.json (${(fullSize / 1024 / 1024).toFixed(2)} MB)`);

    // Write minified JSON file
    const minJsonPath = path.join(publicDataDir, 'recipes.min.json');
    fs.writeFileSync(minJsonPath, JSON.stringify(exportData));
    const minSize = fs.statSync(minJsonPath).size;
    console.log(`✅ Written recipes.min.json (${(minSize / 1024 / 1024).toFixed(2)} MB)`);

    // Also update the data directory (for development)
    const devJsonPath = path.join(dataDir, 'production-recipes.json');
    fs.writeFileSync(devJsonPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Written production-recipes.json to data/`);

    // Show recipe breakdown by category
    console.log('\n📊 Recipe Breakdown:');
    const categories = recipes.reduce((acc, recipe) => {
      const category = recipe.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} recipes`);
      });

    console.log('\n✅ Recipe sync completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Commit the updated JSON files');
    console.log('   2. Deploy to Vercel for production use');
    console.log('   3. The app will automatically use the new data');

  } catch (error) {
    console.error('❌ Error syncing recipes:', error);
    process.exit(1);
  }
}

// Run the sync
syncOfflineRecipes();