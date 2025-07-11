const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.storageBucket
});

const db = admin.firestore();

async function syncAllRecipes() {
  console.log('🔄 Syncing ALL recipes from Firebase to local files...\n');

  try {
    // Get all recipes from Firebase
    const recipesSnapshot = await db.collection('recipes').get();
    const recipes = [];

    recipesSnapshot.forEach(doc => {
      recipes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📊 Found ${recipes.length} recipes in Firebase`);

    // Sort recipes by category and title for consistency
    recipes.sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return (a.title || '').localeCompare(b.title || '');
    });

    // Count by category
    const categoryCount = {};
    const mealTypeCount = {};
    
    recipes.forEach(r => {
      // Count categories
      if (r.category) {
        categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
      }
      
      // Count meal types
      if (r.mealTypes && Array.isArray(r.mealTypes)) {
        r.mealTypes.forEach(type => {
          mealTypeCount[type] = (mealTypeCount[type] || 0) + 1;
        });
      }
    });

    console.log('\n📈 Recipe breakdown by category:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} recipes`);
    });
    console.log(`   Total: ${recipes.length} recipes\n`);

    // Create the export object
    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'Firebase Production Database',
      recipeCount: recipes.length,
      categoryBreakdown: categoryCount,
      mealTypeBreakdown: mealTypeCount,
      recipes: recipes
    };

    // Save to data/production-recipes.json
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const productionPath = path.join(dataDir, 'production-recipes.json');
    await fs.writeFile(productionPath, JSON.stringify(exportData, null, 2));
    
    const stats1 = await fs.stat(productionPath);
    console.log(`✅ Saved to: ${productionPath}`);
    console.log(`   File size: ${(stats1.size / 1024 / 1024).toFixed(2)} MB`);

    // Also update public/data/recipes.json
    const publicDir = path.join(process.cwd(), 'public', 'data');
    await fs.mkdir(publicDir, { recursive: true });

    // Save full version
    const publicPath = path.join(publicDir, 'recipes.json');
    await fs.writeFile(publicPath, JSON.stringify(exportData, null, 2));
    
    const stats2 = await fs.stat(publicPath);
    console.log(`\n✅ Saved to: ${publicPath}`);
    console.log(`   File size: ${(stats2.size / 1024 / 1024).toFixed(2)} MB`);

    // Save minified version
    const minPath = path.join(publicDir, 'recipes.min.json');
    await fs.writeFile(minPath, JSON.stringify(exportData));
    
    const stats3 = await fs.stat(minPath);
    console.log(`\n✅ Saved minified to: ${minPath}`);
    console.log(`   File size: ${(stats3.size / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 Successfully synced ALL ' + recipes.length + ' recipes to offline files!');
    
    // Show what was updated
    console.log('\n📋 Updated files:');
    console.log('   - /data/production-recipes.json (source)');
    console.log('   - /public/data/recipes.json (for app use)');
    console.log('   - /public/data/recipes.min.json (compressed)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing recipes:', error);
    process.exit(1);
  }
}

syncAllRecipes();