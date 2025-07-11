const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.storageBucket
});

const db = admin.firestore();

async function analyzeRecipes() {
  console.log('🔍 Analyzing recipe counts in Firebase...\n');

  try {
    // Get all recipes
    const recipesSnapshot = await db.collection('recipes').get();
    const totalRecipes = recipesSnapshot.size;
    console.log(`📊 Total recipes in Firebase: ${totalRecipes}`);

    // Analyze recipes by different criteria
    let withLocalImage = 0;
    let withSpoonacularImage = 0;
    let withBothImages = 0;
    let withNoImage = 0;
    let withGdScore = 0;
    let byCategory = {};
    let byMealType = {};

    recipesSnapshot.forEach(doc => {
      const recipe = doc.data();
      
      // Image analysis
      if (recipe.localImageUrl) withLocalImage++;
      if (recipe.spoonacularImageUrl) withSpoonacularImage++;
      if (recipe.localImageUrl && recipe.spoonacularImageUrl) withBothImages++;
      if (!recipe.localImageUrl && !recipe.spoonacularImageUrl) withNoImage++;
      
      // GD Score
      if (recipe.gdScore !== undefined && recipe.gdScore !== null) withGdScore++;
      
      // Categories
      if (recipe.categories && Array.isArray(recipe.categories)) {
        recipe.categories.forEach(cat => {
          byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
      }
      
      // Meal types
      if (recipe.mealTypes && Array.isArray(recipe.mealTypes)) {
        recipe.mealTypes.forEach(type => {
          byMealType[type] = (byMealType[type] || 0) + 1;
        });
      }
    });

    console.log('\n📸 Image Status:');
    console.log(`  - With local image: ${withLocalImage}`);
    console.log(`  - With Spoonacular image: ${withSpoonacularImage}`);
    console.log(`  - With both images: ${withBothImages}`);
    console.log(`  - With no image: ${withNoImage}`);
    
    console.log('\n✅ With GD Score:', withGdScore);
    
    console.log('\n🏷️  Categories:');
    Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    
    console.log('\n🍽️  Meal Types:');
    Object.entries(byMealType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    // Check for potential filtering issues
    console.log('\n⚠️  Potential Issues:');
    if (withLocalImage < totalRecipes) {
      console.log(`  - ${totalRecipes - withLocalImage} recipes missing local images`);
    }
    if (totalRecipes === 242) {
      console.log('  - Total count matches the reported 242, need to find missing 42 recipes');
    }

    // Sample some recipes without local images
    if (withLocalImage < totalRecipes) {
      console.log('\n📋 Sample recipes without local images:');
      let count = 0;
      recipesSnapshot.forEach(doc => {
        if (count < 5) {
          const recipe = doc.data();
          if (!recipe.localImageUrl) {
            console.log(`  - ${doc.id}: ${recipe.title}`);
            count++;
          }
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error analyzing recipes:', error);
    process.exit(1);
  }
}

analyzeRecipes();