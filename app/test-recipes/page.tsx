"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { UserRecipeService } from '@/src/services/user-recipe-service';
import { Recipe } from '@/src/types/recipe';

export default function TestRecipes() {
  const { user } = useAuth();
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Initialize LocalRecipeService
        await LocalRecipeService.initialize();
        
        if (user) {
          console.log('[TEST] Loading user recipes for:', user.uid);
          await LocalRecipeService.loadUserRecipes(user.uid);
        }
        
        const all = LocalRecipeService.getAllRecipes();
        const userOnly = LocalRecipeService.getUserRecipes();
        
        console.log('[TEST] Total recipes:', all.length);
        console.log('[TEST] User recipes:', userOnly.length);
        
        setAllRecipes(all);
        setUserRecipes(userOnly);
      } catch (error) {
        console.error('[TEST] Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  const addTestRecipe = async () => {
    if (!user) return;
    
    setAdding(true);
    try {
      const response = await fetch('/api/test-add-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('[TEST] Added test recipe:', data.recipe);
        // Reload recipes
        await LocalRecipeService.loadUserRecipes(user.uid);
        const userOnly = LocalRecipeService.getUserRecipes();
        setUserRecipes(userOnly);
        alert('Test recipe added successfully!');
      } else {
        alert('Failed to add test recipe: ' + data.error);
      }
    } catch (error) {
      console.error('[TEST] Error adding recipe:', error);
      alert('Error adding test recipe');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Recipe Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <ul className="space-y-1">
          <li>User: {user ? user.email : 'Not logged in'}</li>
          <li>Total recipes: {allRecipes.length}</li>
          <li>User recipes: {userRecipes.length}</li>
        </ul>
        
        {user && (
          <button
            onClick={addTestRecipe}
            disabled={adding}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Test Recipe'}
          </button>
        )}
      </div>

      {userRecipes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Your Recipes</h2>
          <div className="grid gap-4">
            {userRecipes.map(recipe => (
              <div key={recipe.id} className="border p-4 rounded">
                <h3 className="font-medium">{recipe.title}</h3>
                <p className="text-sm text-gray-600">
                  Category: {recipe.category || 'Not set'} | 
                  Carbs: {recipe.nutrition.carbohydrates}g | 
                  Calories: {recipe.nutrition.calories}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {userRecipes.length === 0 && user && (
        <div className="bg-yellow-50 p-4 rounded">
          <p>No user recipes found. You can create recipes using the "Add Recipe" feature or run the test script:</p>
          <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
            npx tsx scripts/add-test-recipes.ts {user.uid}
          </code>
        </div>
      )}

      {!user && (
        <div className="bg-red-50 p-4 rounded">
          <p>Please log in to test user recipes.</p>
        </div>
      )}
    </div>
  );
}