#!/usr/bin/env npx tsx
/**
 * Admin Bulk Import 50 Recipes
 * Uses the same approach as the admin UI to import recipes
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import { RecipeImporter } from "../src/services/spoonacular/recipe-importer";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface SearchQuery {
  query: string;
  type: string;
  maxCarbs: number;
  diet?: string;
}

// Diverse search queries to get variety of GD-friendly recipes
const searchQueries: SearchQuery[] = [
  // Breakfast - focus on protein and controlled carbs
  { query: "egg breakfast low carb", type: "breakfast", maxCarbs: 30 },
  { query: "protein pancakes", type: "breakfast", maxCarbs: 35 },
  { query: "overnight oats healthy", type: "breakfast", maxCarbs: 30 },
  { query: "veggie omelet", type: "breakfast", maxCarbs: 25 },
  { query: "breakfast bowl", type: "breakfast", maxCarbs: 35 },
  
  // Lunch - balanced meals
  { query: "grilled chicken salad", type: "lunch", maxCarbs: 35 },
  { query: "soup healthy", type: "lunch", maxCarbs: 40 },
  { query: "wrap sandwich low carb", type: "lunch", maxCarbs: 35 },
  { query: "buddha bowl", type: "lunch", maxCarbs: 40 },
  { query: "mediterranean lunch", type: "lunch", maxCarbs: 35 },
  
  // Dinner - hearty but controlled
  { query: "baked salmon", type: "dinner", maxCarbs: 30 },
  { query: "chicken breast healthy", type: "dinner", maxCarbs: 35 },
  { query: "vegetable stir fry", type: "dinner", maxCarbs: 40 },
  { query: "turkey meatballs", type: "dinner", maxCarbs: 35 },
  { query: "cauliflower rice bowl", type: "dinner", maxCarbs: 30 },
  
  // Snacks - small portions
  { query: "protein snack", type: "snack", maxCarbs: 20 },
  { query: "healthy dip", type: "snack", maxCarbs: 15 },
  { query: "energy balls", type: "snack", maxCarbs: 25 },
  { query: "veggie snack", type: "snack", maxCarbs: 15 },
  { query: "cheese snack", type: "snack", maxCarbs: 10 },
];

async function searchSpoonacularRecipes(searchQuery: SearchQuery, apiKey: string): Promise<any[]> {
  const params = new URLSearchParams({
    apiKey,
    query: searchQuery.query,
    number: '10', // Get 10 recipes per search
    maxReadyTime: '60',
    includeNutrition: 'true',
    instructionsRequired: 'true',
    fillIngredients: 'true',
    addRecipeInformation: 'true',
    maxCarbs: searchQuery.maxCarbs.toString(),
  });

  if (searchQuery.type !== 'all') {
    params.append('type', searchQuery.type);
  }

  if (searchQuery.diet && searchQuery.diet !== 'none') {
    params.append('diet', searchQuery.diet);
  }

  const url = `https://api.spoonacular.com/recipes/complexSearch?${params}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to search for "${searchQuery.query}":`, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error searching for "${searchQuery.query}":`, error);
    return [];
  }
}

async function getExistingRecipeIds(): Promise<Set<string>> {
  const recipesSnapshot = await adminDb()
    .collection('recipes')
    .select('spoonacularId')
    .get();
  
  const ids = new Set<string>();
  recipesSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.spoonacularId) {
      ids.add(data.spoonacularId.toString());
    }
    // Also check the document ID
    if (doc.id.startsWith('spoonacular-')) {
      ids.add(doc.id.replace('spoonacular-', ''));
    }
  });
  
  return ids;
}

async function main() {
  console.log('🚀 Admin Bulk Import 50 Recipes\n');
  
  try {
    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error('SPOONACULAR_API_KEY not found in environment variables');
    }
    
    // Initialize Firebase Admin
    console.log('🔥 Initializing Firebase...');
    await initializeFirebaseAdmin();
    
    // Create importer instance
    const importer = new RecipeImporter(apiKey);
    
    // Get existing recipe IDs to avoid duplicates
    console.log('📊 Checking existing recipes...');
    const existingIds = await getExistingRecipeIds();
    console.log(`   Found ${existingIds.size} existing recipes\n`);
    
    // Search for recipes
    console.log('🔍 Searching for new recipes...');
    const allRecipes: any[] = [];
    const recipeIdSet = new Set<number>();
    
    for (const searchQuery of searchQueries) {
      console.log(`   Searching: "${searchQuery.query}" (${searchQuery.type})`);
      const results = await searchSpoonacularRecipes(searchQuery, apiKey);
      
      let newFound = 0;
      for (const recipe of results) {
        // Skip if already exists or already found in this session
        if (!existingIds.has(recipe.id.toString()) && !recipeIdSet.has(recipe.id)) {
          allRecipes.push(recipe);
          recipeIdSet.add(recipe.id);
          newFound++;
        }
      }
      
      console.log(`      Found ${newFound} new recipes`);
      
      // Stop if we have enough recipes
      if (allRecipes.length >= 50) {
        console.log(`   ✅ Found target of 50 recipes, stopping search`);
        break;
      }
      
      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Found ${allRecipes.length} new recipes to import`);
    
    // Take only the first 50
    const recipesToImport = allRecipes.slice(0, 50);
    
    // Import results tracking
    const importResults = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    // Process recipes in batches to avoid rate limits
    const batchSize = 5;
    console.log(`\n📥 Importing ${recipesToImport.length} recipes in batches of ${batchSize}...`);
    
    for (let i = 0; i < recipesToImport.length; i += batchSize) {
      const batch = recipesToImport.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(recipesToImport.length / batchSize);
      
      console.log(`\n   Batch ${batchNumber}/${totalBatches}:`);
      
      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (recipe) => {
          try {
            // Import recipe using the importer
            const result = await importer.importRecipe(recipe.id.toString());
            
            if (result.success) {
              importResults.imported++;
              console.log(`      ✅ ${recipe.title}`);
              return { id: recipe.id, status: 'imported' };
            } else {
              importResults.failed++;
              importResults.errors.push(`${recipe.title}: ${result.error}`);
              console.log(`      ❌ ${recipe.title}: ${result.error}`);
              return { id: recipe.id, status: 'failed', error: result.error };
            }
          } catch (error) {
            importResults.failed++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            importResults.errors.push(`${recipe.title}: ${errorMsg}`);
            console.log(`      ❌ ${recipe.title}: ${errorMsg}`);
            return { id: recipe.id, status: 'failed', error: errorMsg };
          }
        })
      );
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipesToImport.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    
    // Show summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${importResults.imported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${importResults.skipped} recipes`);
    console.log(`❌ Failed: ${importResults.failed} recipes`);
    
    if (importResults.errors.length > 0) {
      console.log('\n❌ Errors (showing first 10):');
      importResults.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // Get final recipe count
    const finalRecipeCount = await adminDb()
      .collection('recipes')
      .count()
      .get();
    
    console.log(`\n📊 Total recipes in database: ${finalRecipeCount.data().count}`);
    
    if (importResults.imported > 0) {
      console.log('\n✅ Import successful!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Run "npm run sync-recipes" to update offline JSON files');
      console.log('   2. Commit and push the changes');
      console.log('   3. The recipes will be available in the app');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();