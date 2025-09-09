import { NextResponse } from 'next/server';
import { UserRecipeService } from '@/src/services/user-recipe-service';
import { UserRecipeInput } from '@/src/types/recipe';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Simple test recipe
    const testRecipe: UserRecipeInput = {
      title: "Test Recipe - Greek Yogurt Parfait",
      description: "A quick and healthy breakfast or snack",
      category: "breakfast",
      tags: ["quick", "healthy", "high-protein"],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      ingredients: [
        { name: "Greek yogurt", amount: 1, unit: "cup", original: "1 cup plain Greek yogurt" },
        { name: "berries", amount: 0.5, unit: "cup", original: "1/2 cup mixed berries" },
        { name: "granola", amount: 2, unit: "tbsp", original: "2 tbsp granola" },
        { name: "honey", amount: 1, unit: "tsp", original: "1 tsp honey" }
      ],
      instructions: [
        "Add Greek yogurt to a bowl or glass",
        "Top with mixed berries",
        "Sprinkle granola on top",
        "Drizzle with honey"
      ],
      nutrition: {
        calories: 280,
        carbohydrates: 32,
        protein: 20,
        fat: 8,
        fiber: 3,
        sugar: 22,
        sodium: 80
      },
      dietaryInfo: {
        isVegetarian: true,
        isGlutenFree: false,
        isDairyFree: false
      }
    };

    const recipe = await UserRecipeService.createRecipe(userId, testRecipe);
    
    return NextResponse.json({ 
      success: true, 
      recipe: {
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        isUserCreated: recipe.isUserCreated
      }
    });
  } catch (error) {
    console.error('Error adding test recipe:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to add recipe' 
    }, { status: 500 });
  }
}