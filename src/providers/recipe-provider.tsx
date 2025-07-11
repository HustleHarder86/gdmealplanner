"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Recipe } from "@/src/types/recipe";
import { LocalRecipeService } from "@/src/services/local-recipe-service";

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  getRecipeById: (id: string) => Recipe | null;
  searchRecipes: (query: string) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  getRecipesByNutrition: (criteria: {
    maxCarbs?: number;
    minProtein?: number;
    maxCalories?: number;
  }) => Recipe[];
  getBedtimeSnacks: () => Recipe[];
  getQuickRecipes: (maxMinutes?: number) => Recipe[];
  getRandomRecipes: (count: number) => Recipe[];
  stats: {
    total: number;
    byCategory: Record<string, number>;
    withLocalImages: number;
    quickRecipes: number;
    bedtimeSnacks: number;
  };
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load recipes on mount - OFFLINE ONLY
  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);

        // Load from multiple category files - NO API CALLS
        console.log("[OFFLINE] Loading recipes from category files...");
        
        const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
        const allRecipes: any[] = [];
        let totalLoaded = 0;
        
        // Load each category file
        for (const category of categories) {
          try {
            const response = await fetch(`/data/recipes-${category}.json`);
            if (response.ok) {
              const categoryData = await response.json();
              if (categoryData.recipes && Array.isArray(categoryData.recipes)) {
                allRecipes.push(...categoryData.recipes);
                totalLoaded += categoryData.recipes.length;
                console.log(`[OFFLINE] Loaded ${categoryData.recipes.length} ${category} recipes`);
              }
            } else {
              console.warn(`[OFFLINE] Failed to load ${category} recipes: ${response.statusText}`);
            }
          } catch (error) {
            console.error(`[OFFLINE] Error loading ${category} recipes:`, error);
          }
        }
        
        // Fallback to main file if category files failed
        if (allRecipes.length === 0) {
          console.log("[OFFLINE] Fallback to main production file...");
          const response = await fetch("/data/production-recipes.json");
          if (!response.ok) {
            throw new Error(`Failed to load recipes: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.recipes && Array.isArray(data.recipes)) {
            allRecipes.push(...data.recipes);
            totalLoaded = data.recipes.length;
            console.log(`[OFFLINE] Fallback loaded ${totalLoaded} recipes`);
          }
        }

        // Validate we have recipes
        if (allRecipes.length === 0) {
          throw new Error("No recipes found in any source");
        }

        // Initialize LocalRecipeService with the loaded data
        await LocalRecipeService.initialize(allRecipes);

        // Get all recipes from the service
        const loadedRecipes = LocalRecipeService.getAllRecipes();
        setRecipes(loadedRecipes);
        setInitialized(true);

        console.log(`[OFFLINE] Total loaded: ${loadedRecipes.length} recipes from category files`);
        
        // Store in localStorage for future offline use
        if (loadedRecipes.length > 0) {
          try {
            localStorage.setItem("recipes_data", JSON.stringify(loadedRecipes));
            localStorage.setItem("recipes_count", loadedRecipes.length.toString());
            localStorage.setItem("recipes_last_updated", new Date().toISOString());
            console.log(`[OFFLINE] Cached ${loadedRecipes.length} recipes in localStorage`);
          } catch (storageErr) {
            console.warn("Failed to cache recipes:", storageErr);
          }
        }
      } catch (err) {
        console.error("[OFFLINE] Error loading recipes:", err);
        setError(err instanceof Error ? err.message : "Failed to load recipes");

        // Try to fall back to local storage cache
        try {
          const cachedCount = localStorage.getItem("recipes_count");
          await LocalRecipeService.initialize();
          const cachedRecipes = LocalRecipeService.getAllRecipes();
          if (cachedRecipes.length > 0) {
            setRecipes(cachedRecipes);
            setInitialized(true);
            console.log(`[OFFLINE] Loaded ${cachedRecipes.length} recipes from localStorage cache`);
          }
        } catch (cacheErr) {
          console.error("[OFFLINE] Failed to load from cache:", cacheErr);
        }
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<RecipeContextType>(
    () => ({
      recipes,
      loading,
      error,
      initialized,
      getRecipeById: (id: string) => LocalRecipeService.getRecipeById(id),
      searchRecipes: (query: string) => LocalRecipeService.searchRecipes(query),
      getRecipesByCategory: (category: string) =>
        LocalRecipeService.getRecipesByCategory(category),
      getRecipesByNutrition: (criteria) =>
        LocalRecipeService.getRecipesByNutrition(criteria),
      getBedtimeSnacks: () => LocalRecipeService.getBedtimeSnacks(),
      getQuickRecipes: (maxMinutes?: number) =>
        LocalRecipeService.getQuickRecipes(maxMinutes),
      getRandomRecipes: (count: number) =>
        LocalRecipeService.getRandomRecipes(count),
      stats: LocalRecipeService.getStats(),
    }),
    [recipes, loading, error, initialized],
  );

  return (
    <RecipeContext.Provider value={contextValue}>
      {children}
    </RecipeContext.Provider>
  );
}

// Hook to use recipes
export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return {
    recipes: context.recipes,
    loading: context.loading,
    error: context.error,
    initialized: context.initialized,
    stats: context.stats,
  };
}

// Hook to get a single recipe by ID
export function useRecipe(id: string) {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipe must be used within a RecipeProvider");
  }

  const recipe = context.getRecipeById(id);

  return {
    recipe,
    loading: context.loading,
    error:
      context.error ||
      (!recipe && context.initialized ? "Recipe not found" : null),
  };
}

// Hook for recipe search
export function useRecipeSearch() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipeSearch must be used within a RecipeProvider");
  }

  return {
    searchRecipes: context.searchRecipes,
    loading: context.loading,
    error: context.error,
  };
}

// Hook for recipe filtering
export function useRecipeFilters() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipeFilters must be used within a RecipeProvider");
  }

  return {
    getRecipesByCategory: context.getRecipesByCategory,
    getRecipesByNutrition: context.getRecipesByNutrition,
    getBedtimeSnacks: context.getBedtimeSnacks,
    getQuickRecipes: context.getQuickRecipes,
    getRandomRecipes: context.getRandomRecipes,
    loading: context.loading,
    error: context.error,
  };
}
