#!/usr/bin/env npx tsx
/**
 * Analyze and tag existing recipes with dietary information
 * This script will scan ingredients and tags to determine dietary compatibility
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import { DietaryInfo, AllergenInfo } from "../src/types/dietary";
import { Recipe } from "../src/types/recipe";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Keywords that indicate non-vegetarian ingredients
const MEAT_KEYWORDS = [
  'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'ham', 'sausage',
  'ground meat', 'steak', 'ribs', 'duck', 'venison', 'veal', 'prosciutto',
  'salami', 'pepperoni', 'chorizo', 'meat', 'poultry'
];

// Keywords for fish/seafood
const FISH_KEYWORDS = [
  'fish', 'salmon', 'tuna', 'shrimp', 'prawns', 'crab', 'lobster',
  'scallops', 'mussels', 'clams', 'oysters', 'anchovies', 'sardines',
  'cod', 'halibut', 'tilapia', 'mahi', 'seafood', 'calamari', 'squid'
];

// Keywords for eggs
const EGG_KEYWORDS = [
  'egg', 'eggs', 'egg white', 'egg yolk', 'beaten egg', 'scrambled',
  'mayonnaise', 'mayo', 'aioli', 'meringue', 'custard'
];

// Keywords for dairy
const DAIRY_KEYWORDS = [
  'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
  'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'goat cheese',
  'whey', 'casein', 'lactose', 'ghee', 'buttermilk', 'half and half',
  'ice cream', 'frozen yogurt', 'cream cheese', 'mascarpone'
];

// Keywords for gluten
const GLUTEN_KEYWORDS = [
  'wheat', 'flour', 'bread', 'pasta', 'noodles', 'couscous', 'barley',
  'rye', 'spelt', 'semolina', 'durum', 'bulgur', 'farro', 'seitan',
  'soy sauce', 'teriyaki', 'hoisin', 'malt', 'breadcrumbs', 'croutons',
  'tortilla', 'wrap', 'pita', 'naan', 'biscuit', 'cookie', 'cake',
  'muffin', 'pastry', 'pie crust', 'pizza', 'pancake', 'waffle'
];

// Keywords for nuts
const NUT_KEYWORDS = [
  'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut',
  'macadamia', 'brazil nut', 'pine nut', 'chestnut', 'peanut',
  'peanut butter', 'almond butter', 'nut butter', 'mixed nuts',
  'trail mix', 'marzipan', 'praline', 'nougat'
];

// Gluten-free grains/alternatives
const GLUTEN_FREE_GRAINS = [
  'rice', 'quinoa', 'corn', 'oats', 'buckwheat', 'amaranth',
  'millet', 'sorghum', 'teff', 'tapioca', 'arrowroot', 'potato'
];

function analyzeIngredients(recipe: Recipe): { dietary: DietaryInfo; allergens: AllergenInfo } {
  const ingredientText = recipe.ingredients
    .map(ing => `${ing.name} ${ing.original}`.toLowerCase())
    .join(' ');
  
  const titleAndTags = `${recipe.title} ${recipe.tags?.join(' ') || ''}`.toLowerCase();
  const fullText = `${ingredientText} ${titleAndTags}`;

  // Check for meat
  const hasMeat = MEAT_KEYWORDS.some(keyword => fullText.includes(keyword));
  const hasFish = FISH_KEYWORDS.some(keyword => fullText.includes(keyword));
  const hasEggs = EGG_KEYWORDS.some(keyword => fullText.includes(keyword));
  const hasDairy = DAIRY_KEYWORDS.some(keyword => fullText.includes(keyword));
  const hasGluten = GLUTEN_KEYWORDS.some(keyword => fullText.includes(keyword));
  const hasNuts = NUT_KEYWORDS.some(keyword => fullText.includes(keyword));

  // Special checks for gluten-free
  const hasGlutenFreeGrain = GLUTEN_FREE_GRAINS.some(grain => fullText.includes(grain));
  const explicitlyGlutenFree = fullText.includes('gluten-free') || fullText.includes('gluten free');

  const dietary: DietaryInfo = {
    isVegetarian: !hasMeat && !hasFish,
    isVegan: !hasMeat && !hasFish && !hasEggs && !hasDairy,
    isGlutenFree: explicitlyGlutenFree || (!hasGluten && hasGlutenFreeGrain),
    isDairyFree: !hasDairy,
    isNutFree: !hasNuts,
    isPescatarian: !hasMeat, // Fish is OK for pescatarian
    isEggFree: !hasEggs
  };

  // Identify allergens
  const allergens: string[] = [];
  if (hasDairy) allergens.push('milk');
  if (hasEggs) allergens.push('eggs');
  if (hasFish) allergens.push('fish');
  if (hasNuts && fullText.includes('peanut')) allergens.push('peanuts');
  if (hasNuts && !fullText.includes('peanut')) allergens.push('tree nuts');
  if (hasGluten) allergens.push('wheat');
  
  // Check for soy
  if (fullText.includes('soy') || fullText.includes('tofu') || fullText.includes('tempeh')) {
    allergens.push('soybeans');
  }
  
  // Check for shellfish specifically
  const shellfish = ['shrimp', 'crab', 'lobster', 'prawns', 'scallops', 'clams', 'oysters', 'mussels'];
  if (shellfish.some(s => fullText.includes(s))) {
    allergens.push('shellfish');
  }

  const allergenInfo: AllergenInfo = {
    contains: allergens,
    mayContain: [] // Would need facility info for this
  };

  return { dietary, allergens: allergenInfo };
}

async function tagRecipesWithDietaryInfo() {
  console.log("🏷️  Starting dietary tagging of recipes...\n");

  try {
    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase Admin...");
    await initializeFirebaseAdmin();

    // Fetch all recipes
    console.log("📥 Fetching all recipes from Firebase...");
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .get();

    console.log(`📊 Total recipes to analyze: ${recipesSnapshot.size}\n`);

    let processed = 0;
    let vegetarianCount = 0;
    let veganCount = 0;
    let glutenFreeCount = 0;
    let dairyFreeCount = 0;
    let nutFreeCount = 0;

    // Process in batches
    let batch = adminDb().batch();
    let batchCount = 0;

    for (const doc of recipesSnapshot.docs) {
      const recipe = { id: doc.id, ...doc.data() } as Recipe;
      
      // Analyze the recipe
      const { dietary, allergens } = analyzeIngredients(recipe);
      
      // Update the document
      batch.update(doc.ref, {
        dietaryInfo: dietary,
        allergenInfo: allergens,
        updatedAt: new Date()
      });

      // Track stats
      if (dietary.isVegetarian) vegetarianCount++;
      if (dietary.isVegan) veganCount++;
      if (dietary.isGlutenFree) glutenFreeCount++;
      if (dietary.isDairyFree) dairyFreeCount++;
      if (dietary.isNutFree) nutFreeCount++;

      processed++;
      batchCount++;

      // Commit batch every 100 documents
      if (batchCount >= 100) {
        await batch.commit();
        console.log(`✅ Processed ${processed}/${recipesSnapshot.size} recipes...`);
        // Create new batch for next set
        batch = adminDb().batch();
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log("\n✅ Dietary tagging complete!");
    console.log("\n📊 Recipe Statistics:");
    console.log(`   Total recipes: ${recipesSnapshot.size}`);
    console.log(`   Vegetarian: ${vegetarianCount} (${Math.round(vegetarianCount / recipesSnapshot.size * 100)}%)`);
    console.log(`   Vegan: ${veganCount} (${Math.round(veganCount / recipesSnapshot.size * 100)}%)`);
    console.log(`   Gluten-Free: ${glutenFreeCount} (${Math.round(glutenFreeCount / recipesSnapshot.size * 100)}%)`);
    console.log(`   Dairy-Free: ${dairyFreeCount} (${Math.round(dairyFreeCount / recipesSnapshot.size * 100)}%)`);
    console.log(`   Nut-Free: ${nutFreeCount} (${Math.round(nutFreeCount / recipesSnapshot.size * 100)}%)`);

    console.log("\n📝 Next steps:");
    console.log("   1. Run sync script to update offline JSON files");
    console.log("   2. Test dietary filtering in the app");
    console.log("   3. Manually review edge cases");

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the tagging
tagRecipesWithDietaryInfo();