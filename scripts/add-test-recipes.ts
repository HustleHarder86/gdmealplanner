import { UserRecipeService } from '../src/services/user-recipe-service';
import { UserRecipeInput } from '../src/types/recipe';

// Sample user recipes for testing
const testRecipes: UserRecipeInput[] = [
  {
    title: "Simple Scrambled Eggs",
    description: "Quick and easy protein-rich breakfast",
    category: "breakfast",
    tags: ["quick", "low-carb", "high-protein"],
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    ingredients: [
      { name: "eggs", amount: 2, unit: "large", original: "2 large eggs" },
      { name: "milk", amount: 2, unit: "tbsp", original: "2 tbsp milk" },
      { name: "butter", amount: 1, unit: "tsp", original: "1 tsp butter" },
      { name: "salt", amount: 1, unit: "pinch", original: "pinch of salt" },
      { name: "pepper", amount: 1, unit: "pinch", original: "pinch of pepper" }
    ],
    instructions: [
      "Crack eggs into a bowl and add milk",
      "Whisk until well combined",
      "Heat butter in a non-stick pan over medium heat",
      "Pour in egg mixture and let sit for 30 seconds",
      "Gently scramble with a spatula until just set",
      "Season with salt and pepper to taste"
    ],
    nutrition: {
      calories: 220,
      carbohydrates: 3,
      protein: 18,
      fat: 15,
      fiber: 0,
      sugar: 2,
      sodium: 200
    },
    dietaryInfo: {
      isVegetarian: true,
      isGlutenFree: true,
      isDairyFree: false
    }
  },
  {
    title: "Greek Yogurt Berry Bowl",
    description: "Nutritious breakfast with balanced carbs and protein",
    category: "breakfast",
    tags: ["healthy", "quick", "vegetarian"],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "Greek yogurt", amount: 1, unit: "cup", original: "1 cup Greek yogurt" },
      { name: "blueberries", amount: 0.5, unit: "cup", original: "1/2 cup blueberries" },
      { name: "strawberries", amount: 0.5, unit: "cup", original: "1/2 cup sliced strawberries" },
      { name: "granola", amount: 2, unit: "tbsp", original: "2 tbsp granola" },
      { name: "honey", amount: 1, unit: "tsp", original: "1 tsp honey" }
    ],
    instructions: [
      "Place Greek yogurt in a bowl",
      "Top with blueberries and strawberries",
      "Sprinkle granola on top",
      "Drizzle with honey",
      "Serve immediately"
    ],
    nutrition: {
      calories: 280,
      carbohydrates: 35,
      protein: 20,
      fat: 6,
      fiber: 4,
      sugar: 24,
      sodium: 80
    },
    dietaryInfo: {
      isVegetarian: true,
      isGlutenFree: false,
      isDairyFree: false
    }
  },
  {
    title: "Chicken & Veggie Stir Fry",
    description: "Quick and healthy lunch option",
    category: "lunch",
    tags: ["healthy", "protein", "vegetables"],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "chicken breast", amount: 8, unit: "oz", original: "8 oz chicken breast, diced" },
      { name: "broccoli", amount: 2, unit: "cups", original: "2 cups broccoli florets" },
      { name: "bell pepper", amount: 1, unit: "medium", original: "1 medium bell pepper, sliced" },
      { name: "soy sauce", amount: 2, unit: "tbsp", original: "2 tbsp low-sodium soy sauce" },
      { name: "garlic", amount: 2, unit: "cloves", original: "2 cloves garlic, minced" },
      { name: "olive oil", amount: 1, unit: "tbsp", original: "1 tbsp olive oil" },
      { name: "brown rice", amount: 1, unit: "cup", original: "1 cup cooked brown rice" }
    ],
    instructions: [
      "Heat olive oil in a large pan or wok",
      "Add chicken and cook until golden brown",
      "Add garlic and stir for 30 seconds",
      "Add broccoli and bell pepper, stir-fry for 5 minutes",
      "Add soy sauce and toss everything together",
      "Serve over brown rice"
    ],
    nutrition: {
      calories: 420,
      carbohydrates: 38,
      protein: 35,
      fat: 12,
      fiber: 5,
      sugar: 6,
      sodium: 450
    },
    dietaryInfo: {
      isVegetarian: false,
      isGlutenFree: false,
      isDairyFree: true
    }
  },
  {
    title: "Quinoa Veggie Bowl",
    description: "Nutritious vegetarian lunch",
    category: "lunch",
    tags: ["vegetarian", "healthy", "meal-prep"],
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "quinoa", amount: 1, unit: "cup", original: "1 cup quinoa, cooked" },
      { name: "chickpeas", amount: 1, unit: "can", original: "1 can chickpeas, drained" },
      { name: "spinach", amount: 2, unit: "cups", original: "2 cups fresh spinach" },
      { name: "cherry tomatoes", amount: 1, unit: "cup", original: "1 cup cherry tomatoes, halved" },
      { name: "avocado", amount: 1, unit: "medium", original: "1 medium avocado, sliced" },
      { name: "lemon juice", amount: 2, unit: "tbsp", original: "2 tbsp lemon juice" },
      { name: "olive oil", amount: 1, unit: "tbsp", original: "1 tbsp olive oil" }
    ],
    instructions: [
      "Cook quinoa according to package directions",
      "Sauté spinach in olive oil until wilted",
      "Warm chickpeas in a pan",
      "Divide quinoa between bowls",
      "Top with spinach, chickpeas, tomatoes, and avocado",
      "Drizzle with lemon juice and olive oil"
    ],
    nutrition: {
      calories: 480,
      carbohydrates: 52,
      protein: 18,
      fat: 22,
      fiber: 12,
      sugar: 8,
      sodium: 320
    },
    dietaryInfo: {
      isVegetarian: true,
      isGlutenFree: true,
      isDairyFree: true
    }
  },
  {
    title: "Baked Salmon with Vegetables",
    description: "Healthy dinner rich in omega-3",
    category: "dinner",
    tags: ["healthy", "protein", "omega-3"],
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "salmon fillet", amount: 12, unit: "oz", original: "12 oz salmon fillet" },
      { name: "asparagus", amount: 1, unit: "bunch", original: "1 bunch asparagus" },
      { name: "sweet potato", amount: 1, unit: "large", original: "1 large sweet potato, cubed" },
      { name: "olive oil", amount: 2, unit: "tbsp", original: "2 tbsp olive oil" },
      { name: "lemon", amount: 1, unit: "medium", original: "1 lemon, sliced" },
      { name: "garlic", amount: 2, unit: "cloves", original: "2 cloves garlic, minced" },
      { name: "dill", amount: 1, unit: "tbsp", original: "1 tbsp fresh dill" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Place salmon on a baking sheet",
      "Arrange vegetables around salmon",
      "Drizzle everything with olive oil",
      "Season with garlic, dill, salt, and pepper",
      "Top salmon with lemon slices",
      "Bake for 20-25 minutes until salmon flakes easily"
    ],
    nutrition: {
      calories: 520,
      carbohydrates: 35,
      protein: 42,
      fat: 22,
      fiber: 6,
      sugar: 8,
      sodium: 380
    },
    dietaryInfo: {
      isVegetarian: false,
      isGlutenFree: true,
      isDairyFree: true
    }
  },
  {
    title: "Turkey Chili",
    description: "Hearty and filling dinner",
    category: "dinner",
    tags: ["comfort-food", "protein", "meal-prep"],
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    ingredients: [
      { name: "ground turkey", amount: 1, unit: "lb", original: "1 lb lean ground turkey" },
      { name: "black beans", amount: 1, unit: "can", original: "1 can black beans" },
      { name: "kidney beans", amount: 1, unit: "can", original: "1 can kidney beans" },
      { name: "diced tomatoes", amount: 1, unit: "can", original: "1 can diced tomatoes" },
      { name: "onion", amount: 1, unit: "medium", original: "1 medium onion, diced" },
      { name: "bell pepper", amount: 1, unit: "medium", original: "1 bell pepper, diced" },
      { name: "chili powder", amount: 2, unit: "tbsp", original: "2 tbsp chili powder" }
    ],
    instructions: [
      "Brown ground turkey in a large pot",
      "Add onion and bell pepper, sauté until soft",
      "Add chili powder and cook for 1 minute",
      "Add tomatoes, beans, and 1 cup water",
      "Bring to a boil, then reduce heat and simmer",
      "Cook for 30-45 minutes, stirring occasionally",
      "Season with salt and pepper to taste"
    ],
    nutrition: {
      calories: 380,
      carbohydrates: 42,
      protein: 28,
      fat: 10,
      fiber: 12,
      sugar: 8,
      sodium: 480
    },
    dietaryInfo: {
      isVegetarian: false,
      isGlutenFree: true,
      isDairyFree: true
    }
  },
  {
    title: "Apple Slices with Almond Butter",
    description: "Simple and nutritious snack",
    category: "snack",
    tags: ["quick", "healthy", "portable"],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "apple", amount: 1, unit: "medium", original: "1 medium apple, sliced" },
      { name: "almond butter", amount: 2, unit: "tbsp", original: "2 tbsp almond butter" },
      { name: "cinnamon", amount: 1, unit: "pinch", original: "pinch of cinnamon (optional)" }
    ],
    instructions: [
      "Wash and slice apple",
      "Arrange on a plate",
      "Serve with almond butter for dipping",
      "Sprinkle with cinnamon if desired"
    ],
    nutrition: {
      calories: 250,
      carbohydrates: 28,
      protein: 7,
      fat: 16,
      fiber: 6,
      sugar: 19,
      sodium: 70
    },
    dietaryInfo: {
      isVegetarian: true,
      isGlutenFree: true,
      isDairyFree: true
    }
  },
  {
    title: "Hummus and Veggie Sticks",
    description: "Crunchy and satisfying snack",
    category: "snack",
    tags: ["healthy", "vegetarian", "portable"],
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "hummus", amount: 4, unit: "tbsp", original: "4 tbsp hummus" },
      { name: "carrot", amount: 1, unit: "medium", original: "1 medium carrot, cut into sticks" },
      { name: "cucumber", amount: 0.5, unit: "medium", original: "1/2 cucumber, cut into sticks" },
      { name: "bell pepper", amount: 0.5, unit: "medium", original: "1/2 bell pepper, cut into strips" }
    ],
    instructions: [
      "Wash and cut vegetables into sticks",
      "Place hummus in a small bowl",
      "Arrange vegetables around hummus",
      "Serve immediately"
    ],
    nutrition: {
      calories: 180,
      carbohydrates: 22,
      protein: 8,
      fat: 8,
      fiber: 7,
      sugar: 8,
      sodium: 320
    },
    dietaryInfo: {
      isVegetarian: true,
      isGlutenFree: true,
      isDairyFree: true
    }
  }
];

async function addTestRecipes(userId: string) {
  console.log(`Adding ${testRecipes.length} test recipes for user ${userId}...`);
  
  for (const recipe of testRecipes) {
    try {
      const created = await UserRecipeService.createRecipe(userId, recipe);
      console.log(`✓ Added: ${created.title} (${created.category})`);
    } catch (error) {
      console.error(`✗ Failed to add ${recipe.title}:`, error);
    }
  }
  
  console.log('Done adding test recipes!');
}

// Usage: Pass user ID as command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.log('Usage: npx tsx scripts/add-test-recipes.ts <userId>');
  process.exit(1);
}

addTestRecipes(userId).catch(console.error);