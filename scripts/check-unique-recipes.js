#!/usr/bin/env node

/**
 * Check Unique Recipe Count
 * Verify the actual number of unique recipes in Firebase
 */

const { initializeFirebaseAdmin, adminDb } = require('../src/lib/firebase/admin');

async function checkUniqueRecipes() {
  try {
    console.log('🔍 Checking unique recipe count in Firebase...\n');
    
    await initializeFirebaseAdmin();
    
    // Get all recipes
    const snapshot = await adminDb().collection('recipes').get();
    const allRecipes = [];
    const recipeIds = new Set();
    const spoonacularIds = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      allRecipes.push({
        id: doc.id,
        title: data.title,
        spoonacularId: data.spoonacularId,
        category: data.category
      });
      
      recipeIds.add(doc.id);
      if (data.spoonacularId) {
        spoonacularIds.add(data.spoonacularId);
      }
    });
    
    console.log(`📊 Firebase Analysis:`);
    console.log(`   Total documents: ${allRecipes.length}`);
    console.log(`   Unique Firebase IDs: ${recipeIds.size}`);
    console.log(`   Unique Spoonacular IDs: ${spoonacularIds.size}`);
    
    // Check for duplicate Spoonacular IDs
    const spoonacularIdCount = {};
    allRecipes.forEach(recipe => {
      if (recipe.spoonacularId) {
        spoonacularIdCount[recipe.spoonacularId] = (spoonacularIdCount[recipe.spoonacularId] || 0) + 1;
      }
    });
    
    const duplicateSpoonacularIds = Object.entries(spoonacularIdCount)
      .filter(([id, count]) => count > 1);
    
    if (duplicateSpoonacularIds.length > 0) {
      console.log(`\n⚠️  Found ${duplicateSpoonacularIds.length} duplicate Spoonacular IDs:`);
      duplicateSpoonacularIds.slice(0, 5).forEach(([id, count]) => {
        console.log(`   Spoonacular ID ${id}: ${count} copies`);
      });
      if (duplicateSpoonacularIds.length > 5) {
        console.log(`   ... and ${duplicateSpoonacularIds.length - 5} more`);
      }
    }
    
    // Category breakdown
    const categoryCount = {};
    allRecipes.forEach(recipe => {
      const cat = recipe.category || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    console.log(`\n📈 Category breakdown:`);
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} recipes`);
    });
    
    const totalDuplicates = duplicateSpoonacularIds.reduce((sum, [id, count]) => sum + (count - 1), 0);
    const expectedUniqueCount = allRecipes.length - totalDuplicates;
    
    console.log(`\n🎯 Expected Results:`);
    console.log(`   Total in Firebase: ${allRecipes.length}`);
    console.log(`   Duplicates to remove: ${totalDuplicates}`);
    console.log(`   Expected unique count: ${expectedUniqueCount}`);
    console.log(`   Production showing: 406`);
    console.log(`   Match: ${expectedUniqueCount === 406 ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUniqueRecipes();