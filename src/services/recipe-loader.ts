import { LocalRecipeService } from "./local-recipe-service";

let initialized = false;

/**
 * Initialize the LocalRecipeService with production recipes
 * This loads recipes from the static JSON file created from production data
 */
export async function initializeRecipes() {
  if (initialized) {
    return;
  }

  try {
    // Try to load from static file first (fastest)
    const response = await fetch("/data/recipes.min.json");
    if (response.ok) {
      const data = await response.json();
      await LocalRecipeService.initialize(data.recipes);
      LocalRecipeService.saveToLocalStorage();
      initialized = true;
      console.log(`✅ Loaded ${data.recipes.length} recipes from static file`);
      return;
    }
  } catch (error) {
    console.log("Could not load from static file, trying API...");
  }

  try {
    // Fallback to API
    const response = await fetch("/api/recipes/export-offline?format=json");
    if (response.ok) {
      const data = await response.json();
      await LocalRecipeService.initialize(data.recipes);
      LocalRecipeService.saveToLocalStorage();
      initialized = true;
      console.log(`✅ Loaded ${data.recipes.length} recipes from API`);
      return;
    }
  } catch (error) {
    console.log("Could not load from API, trying localStorage...");
  }

  // Final fallback to localStorage
  await LocalRecipeService.initialize();
  const recipes = LocalRecipeService.getAllRecipes();
  if (recipes.length > 0) {
    initialized = true;
    console.log(`✅ Loaded ${recipes.length} recipes from localStorage`);
  } else {
    console.error("❌ No recipes available offline");
  }
}

/**
 * Ensure recipes are loaded before using LocalRecipeService
 */
export async function ensureRecipesLoaded() {
  if (!initialized) {
    await initializeRecipes();
  }
}
