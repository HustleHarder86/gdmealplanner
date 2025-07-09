#!/usr/bin/env npx tsx
/**
 * Test importing a single recipe through the API
 */

import { initializeFirebaseAdmin, adminDb } from '../src/lib/firebase/admin';

async function testSingleImport() {
  console.log('🧪 Testing single recipe import...\n');

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Test recipe ID - a healthy salad that should pass GD validation
    const testRecipeId = 644387; // Greek Salad
    
    console.log(`📥 Attempting to import recipe ID: ${testRecipeId}`);
    console.log('   Making request to bulk import API...');

    // Call the bulk import API
    const response = await fetch('http://localhost:3000/api/admin/recipes/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeIds: [testRecipeId]
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ Import API Response:');
      console.log(`   Status: Success`);
      console.log(`   Imported: ${result.imported}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Failed: ${result.failed}`);
      
      if (result.imported > 0) {
        // Check if recipe was added to Firebase
        const recipeDoc = await adminDb()
          .collection('recipes')
          .where('spoonacularId', '==', testRecipeId.toString())
          .get();
        
        if (!recipeDoc.empty) {
          const recipe = recipeDoc.docs[0].data();
          console.log('\n✅ Recipe successfully stored in Firebase:');
          console.log(`   Title: ${recipe.title}`);
          console.log(`   Category: ${recipe.category}`);
          console.log(`   Carbs: ${recipe.nutrition?.carbohydrates}g`);
          console.log(`   GD Score: ${recipe.gdValidation?.score}/100`);
        }

        // Check if offline data was updated
        const offlineDoc = await adminDb()
          .collection('offlineData')
          .doc('recipes')
          .get();
        
        if (offlineDoc.exists) {
          const data = offlineDoc.data();
          console.log('\n✅ Offline data updated:');
          console.log(`   Last updated: ${data?.lastUpdated}`);
          console.log(`   Recipe count: ${data?.recipeCount}`);
        }
      }
    } else {
      console.error('\n❌ Import failed:', result.error);
      if (result.errors) {
        console.error('Errors:', result.errors);
      }
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Run "npm run sync-recipes" to update local JSON files');
    console.log('   2. Check the admin panel to see the imported recipe');
    console.log('   3. The recipe should now be available offline');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSingleImport();