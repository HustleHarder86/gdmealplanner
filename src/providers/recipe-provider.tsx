'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Recipe } from '@/src/types/recipe';
import { LocalRecipeService } from '@/src/services/local-recipe-service';

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

  // Load recipes on mount
  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);

        // Try to load from the static JSON file
        const response = await fetch('/data/production-recipes.json');
        if (!response.ok) {
          throw new Error(`Failed to load recipes: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Initialize LocalRecipeService with the loaded data
        await LocalRecipeService.initialize(data.recipes);
        
        // Get all recipes from the service
        const loadedRecipes = LocalRecipeService.getAllRecipes();
        setRecipes(loadedRecipes);
        setInitialized(true);
        
        console.log(`Loaded ${loadedRecipes.length} recipes from static file`);
      } catch (err) {
        console.error('Error loading recipes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
        
        // Try to fall back to local storage
        try {
          await LocalRecipeService.initialize();
          const cachedRecipes = LocalRecipeService.getAllRecipes();
          if (cachedRecipes.length > 0) {
            setRecipes(cachedRecipes);
            setInitialized(true);
            console.log(`Loaded ${cachedRecipes.length} recipes from cache`);
          }
        } catch (cacheErr) {
          console.error('Failed to load from cache:', cacheErr);
        }
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<RecipeContextType>(() => ({
    recipes,
    loading,
    error,
    initialized,
    getRecipeById: (id: string) => LocalRecipeService.getRecipeById(id),
    searchRecipes: (query: string) => LocalRecipeService.searchRecipes(query),
    getRecipesByCategory: (category: string) => LocalRecipeService.getRecipesByCategory(category),
    getRecipesByNutrition: (criteria) => LocalRecipeService.getRecipesByNutrition(criteria),
    getBedtimeSnacks: () => LocalRecipeService.getBedtimeSnacks(),
    getQuickRecipes: (maxMinutes?: number) => LocalRecipeService.getQuickRecipes(maxMinutes),
    getRandomRecipes: (count: number) => LocalRecipeService.getRandomRecipes(count),
    stats: LocalRecipeService.getStats()
  }), [recipes, loading, error, initialized]);

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
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return {
    recipes: context.recipes,
    loading: context.loading,
    error: context.error,
    initialized: context.initialized,
    stats: context.stats
  };
}

// Hook to get a single recipe by ID
export function useRecipe(id: string) {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  
  const recipe = context.getRecipeById(id);
  
  return {
    recipe,
    loading: context.loading,
    error: context.error || (!recipe && context.initialized ? 'Recipe not found' : null)
  };
}

// Hook for recipe search
export function useRecipeSearch() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipeSearch must be used within a RecipeProvider');
  }
  
  return {
    searchRecipes: context.searchRecipes,
    loading: context.loading,
    error: context.error
  };
}

// Hook for recipe filtering
export function useRecipeFilters() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipeFilters must be used within a RecipeProvider');
  }
  
  return {
    getRecipesByCategory: context.getRecipesByCategory,
    getRecipesByNutrition: context.getRecipesByNutrition,
    getBedtimeSnacks: context.getBedtimeSnacks,
    getQuickRecipes: context.getQuickRecipes,
    getRandomRecipes: context.getRandomRecipes,
    loading: context.loading,
    error: context.error
  };
}