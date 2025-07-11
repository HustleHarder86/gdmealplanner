import admin from 'firebase-admin';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Phase 1 search queries - foundation recipes, meal prep, batch cooking
const PHASE1_QUERIES = {
  breakfast: [
    'meal prep breakfast',
    'make ahead breakfast',
    'overnight oats',
    'egg muffins',
    'breakfast casserole',
    'freezer breakfast',
    'protein pancakes',
    'chia pudding',
    'breakfast burrito',
    'frittata'
  ],
  lunch: [
    'meal prep lunch',
    'make ahead salad',
    'grain bowl',
    'lunch box',
    'sandwich healthy',
    'wrap healthy',
    'soup healthy',
    'leftover lunch',
    'mason jar salad',
    'bento box'
  ],
  dinner: [
    'batch cooking dinner',
    'sheet pan dinner',
    'slow cooker healthy',
    'instant pot low carb',
    'family dinner healthy',
    'freezer meal',
    'casserole healthy',
    'one pot dinner',
    'stir fry vegetables',
    'roasted chicken dinner'
  ],
  snack: [
    'healthy snack prep',
    'protein snack',
    'energy balls',
    'veggie snack',
    'cheese snack',
    'nut butter snack',
    'greek yogurt snack',
    'hard boiled eggs',
    'trail mix homemade',
    'hummus vegetables'
  ],
  dessert: [
    'sugar free dessert',
    'low carb dessert',
    'diabetic dessert',
    'fruit dessert',
    'greek yogurt dessert',
    'chia seed dessert',
    'protein dessert',
    'almond flour dessert',
    'coconut flour dessert',
    'stevia dessert'
  ]
};

// Additional filters for better results
const DIETARY_FILTERS = [
  '', // No filter
  '&diet=gluten-free',
  '&diet=vegetarian',
  '&diet=dairy-free',
  '&diet=paleo',
  '&diet=whole30'
];

// Nutrition limits for GD-friendly recipes
const NUTRITION_LIMITS = {
  breakfast: { minCarbs: 25, maxCarbs: 35, minProtein: 15 },
  lunch: { minCarbs: 40, maxCarbs: 50, minProtein: 20 },
  dinner: { minCarbs: 40, maxCarbs: 50, minProtein: 25 },
  snack: { minCarbs: 15, maxCarbs: 30, minProtein: 5 },
  dessert: { minCarbs: 10, maxCarbs: 25, minProtein: 3 }
};

async function searchRecipes(query, mealType, dietFilter = '', offset = 0) {
  const nutritionLimits = NUTRITION_LIMITS[mealType];
  const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=10&offset=${offset}&addRecipeInformation=true&addRecipeNutrition=true&minProtein=${nutritionLimits.minProtein}&maxCarbs=${nutritionLimits.maxCarbs}${dietFilter}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`API error for query "${query}": ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return [];
  }
}

function calculateGDScore(nutrition, mealType) {
  let score = 70; // Base score
  
  const limits = NUTRITION_LIMITS[mealType];
  const carbs = nutrition.carbs?.amount || 0;
  const protein = nutrition.protein?.amount || 0;
  const fiber = nutrition.fiber?.amount || 0;
  const sugar = nutrition.sugar?.amount || 0;
  
  // Carb scoring
  if (carbs >= limits.minCarbs && carbs <= limits.maxCarbs) {
    score += 10;
  } else if (carbs < limits.minCarbs) {
    score -= 5;
  } else {
    score -= 10;
  }
  
  // Protein scoring
  if (protein >= limits.minProtein) {
    score += 10;
  }
  
  // Fiber bonus
  if (fiber >= 3) {
    score += 5;
  }
  
  // Sugar penalty
  if (sugar > carbs * 0.5) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function determineMealType(recipe, intendedType) {
  const title = recipe.title.toLowerCase();
  
  // Check title for meal type indicators
  if (title.includes('breakfast') || title.includes('morning') || title.includes('brunch')) {
    return 'breakfast';
  }
  if (title.includes('lunch') || title.includes('sandwich') || title.includes('wrap')) {
    return 'lunch';
  }
  if (title.includes('dinner') || title.includes('supper') || title.includes('entree')) {
    return 'dinner';
  }
  if (title.includes('snack') || title.includes('bite') || title.includes('appetizer')) {
    return 'snack';
  }
  if (title.includes('dessert') || title.includes('sweet') || title.includes('treat')) {
    return 'dessert';
  }
  
  // Use intended type if no clear indicator
  return intendedType;
}

async function importRecipe(recipe, mealType) {
  try {
    // Check if recipe already exists
    const existingDoc = await db.collection('recipes')
      .where('spoonacularId', '==', recipe.id)
      .limit(1)
      .get();
    
    if (!existingDoc.empty) {
      console.log(`Recipe already exists: ${recipe.title}`);
      return false;
    }
    
    // Get nutrition info
    const nutrition = recipe.nutrition?.nutrients?.reduce((acc, nutrient) => {
      const name = nutrient.name.toLowerCase();
      if (name.includes('carbohydrate')) acc.carbs = { amount: nutrient.amount, unit: nutrient.unit };
      if (name.includes('protein')) acc.protein = { amount: nutrient.amount, unit: nutrient.unit };
      if (name.includes('fat')) acc.fat = { amount: nutrient.amount, unit: nutrient.unit };
      if (name.includes('fiber')) acc.fiber = { amount: nutrient.amount, unit: nutrient.unit };
      if (name.includes('sugar')) acc.sugar = { amount: nutrient.amount, unit: nutrient.unit };
      if (name.includes('calories')) acc.calories = { amount: nutrient.amount, unit: nutrient.unit };
      return acc;
    }, {}) || {};
    
    // Calculate GD score
    const gdScore = calculateGDScore(nutrition, mealType);
    
    // Only import recipes with good GD scores
    if (gdScore < 60) {
      console.log(`Skipping low GD score recipe: ${recipe.title} (score: ${gdScore})`);
      return false;
    }
    
    // Determine final meal type
    const finalMealType = determineMealType(recipe, mealType);
    
    // Create recipe document
    const recipeData = {
      spoonacularId: recipe.id,
      title: recipe.title,
      image: recipe.image || '',
      imageType: recipe.imageType || 'jpg',
      servings: recipe.servings || 4,
      readyInMinutes: recipe.readyInMinutes || 30,
      sourceUrl: recipe.sourceUrl || '',
      instructions: recipe.instructions || recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step).join(' ') || '',
      extendedIngredients: recipe.extendedIngredients || [],
      nutrition: nutrition,
      mealTypes: [finalMealType],
      cuisines: recipe.cuisines || [],
      diets: recipe.diets || [],
      dishTypes: recipe.dishTypes || [],
      gdFriendly: gdScore >= 70,
      gdScore: gdScore,
      tags: [
        ...recipe.diets || [],
        finalMealType,
        recipe.veryHealthy && 'healthy',
        recipe.cheap && 'budget-friendly',
        recipe.veryPopular && 'popular',
        recipe.readyInMinutes <= 30 && 'quick',
        recipe.readyInMinutes <= 15 && 'super-quick',
        recipe.title.toLowerCase().includes('meal prep') && 'meal-prep',
        recipe.title.toLowerCase().includes('batch') && 'batch-cooking',
        recipe.title.toLowerCase().includes('freezer') && 'freezer-friendly',
        recipe.title.toLowerCase().includes('sheet pan') && 'one-pan',
        recipe.title.toLowerCase().includes('slow cooker') && 'slow-cooker',
        recipe.title.toLowerCase().includes('instant pot') && 'instant-pot'
      ].filter(Boolean),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('recipes').add(recipeData);
    console.log(`✓ Imported: ${recipe.title} (${finalMealType}, GD Score: ${gdScore})`);
    return true;
  } catch (error) {
    console.error(`Error importing recipe ${recipe.title}:`, error);
    return false;
  }
}

async function getImportProgress() {
  const snapshot = await db.collection('recipes').count().get();
  return snapshot.data().count;
}

async function importPhase1Batch() {
  console.log('Starting Phase 1 Recipe Import...\n');
  
  const startCount = await getImportProgress();
  console.log(`Current recipe count: ${startCount}`);
  console.log(`Target: Import 100 new recipes\n`);
  
  let totalImported = 0;
  const targetImports = 100;
  const importStats = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
    dessert: 0
  };
  
  // Rotate through meal types to ensure variety
  const mealTypes = Object.keys(PHASE1_QUERIES);
  let mealTypeIndex = 0;
  
  while (totalImported < targetImports) {
    const mealType = mealTypes[mealTypeIndex % mealTypes.length];
    const queries = PHASE1_QUERIES[mealType];
    const queryIndex = Math.floor((totalImported / mealTypes.length) % queries.length);
    const query = queries[queryIndex];
    const dietFilter = DIETARY_FILTERS[Math.floor(Math.random() * DIETARY_FILTERS.length)];
    const offset = Math.floor(Math.random() * 50); // Random offset to get variety
    
    console.log(`\nSearching: "${query}" (${mealType})${dietFilter ? ' with ' + dietFilter : ''}`);
    
    const recipes = await searchRecipes(query, mealType, dietFilter, offset);
    console.log(`Found ${recipes.length} recipes`);
    
    for (const recipe of recipes) {
      if (totalImported >= targetImports) break;
      
      const imported = await importRecipe(recipe, mealType);
      if (imported) {
        totalImported++;
        importStats[mealType]++;
        console.log(`Progress: ${totalImported}/${targetImports}`);
      }
    }
    
    mealTypeIndex++;
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary
  const endCount = await getImportProgress();
  console.log('\n=== Import Complete ===');
  console.log(`Starting count: ${startCount}`);
  console.log(`Ending count: ${endCount}`);
  console.log(`Total imported: ${totalImported}`);
  console.log('\nBreakdown by meal type:');
  Object.entries(importStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('\nNext step: Run sync-offline-data.js to update offline files');
}

// Run the import
importPhase1Batch().catch(console.error);