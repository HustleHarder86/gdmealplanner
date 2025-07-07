import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";
import { Recipe } from "@/src/types/recipe";
import Link from "next/link";
import RecipeList from "./RecipeList";

async function getRecipes(): Promise<Recipe[]> {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    const recipesSnapshot = await db.collection('recipes').get();
    
    const recipes = recipesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Recipe[];
    
    // Sort by title
    recipes.sort((a, b) => a.title.localeCompare(b.title));
    
    return recipes;
  } catch (error) {
    console.error("Error loading recipes:", error);
    return [];
  }
}

export default async function AdminRecipesServerPage() {
  const recipes = await getRecipes();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recipe Library (Server)</h1>
        <Link
          href="/admin/import-recipes"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Import More Recipes
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-lg mb-4">Total Recipes: {recipes.length}</p>
      </div>

      <RecipeList initialRecipes={recipes} />
    </div>
  );
}