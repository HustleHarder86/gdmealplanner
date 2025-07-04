export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  tags: string[];
  image?: string;
}

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Quinoa Power Bowl",
    description: "Nutrient-dense bowl perfect for managing blood sugar",
    category: "lunch",
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    ingredients: [
      "1 cup quinoa",
      "2 cups vegetable broth",
      "1 cup chickpeas, drained",
      "2 cups baby spinach",
      "1 avocado, sliced",
      "2 tbsp tahini",
      "1 lemon, juiced",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Rinse quinoa and cook in vegetable broth according to package directions.",
      "In a pan, sauté chickpeas with spices for 5 minutes.",
      "Divide quinoa between bowls.",
      "Top with chickpeas, spinach, and avocado.",
      "Drizzle with tahini mixed with lemon juice.",
    ],
    nutrition: {
      calories: 420,
      protein: 18,
      carbs: 45,
      fat: 20,
      fiber: 12,
      sugar: 4,
    },
    tags: ["vegetarian", "high-fiber", "meal-prep"],
  },
  {
    id: "2",
    title: "Greek Yogurt Parfait",
    description: "Quick breakfast with protein and controlled carbs",
    category: "breakfast",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      "1 cup plain Greek yogurt",
      "1/4 cup berries",
      "2 tbsp chopped nuts",
      "1 tbsp chia seeds",
      "1 tsp honey (optional)",
    ],
    instructions: [
      "Layer half the yogurt in a glass or bowl.",
      "Add half the berries and nuts.",
      "Repeat layers.",
      "Top with chia seeds.",
      "Drizzle with honey if desired.",
    ],
    nutrition: {
      calories: 280,
      protein: 24,
      carbs: 22,
      fat: 12,
      fiber: 6,
      sugar: 14,
    },
    tags: ["quick", "no-cook", "high-protein"],
  },
  {
    id: "3",
    title: "Baked Chicken with Roasted Vegetables",
    description: "Balanced dinner with lean protein and fiber-rich veggies",
    category: "dinner",
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    ingredients: [
      "4 chicken breasts",
      "2 cups broccoli florets",
      "1 cup carrots, sliced",
      "1 bell pepper, chopped",
      "2 tbsp olive oil",
      "2 cloves garlic, minced",
      "Italian seasoning",
      "Salt and pepper",
    ],
    instructions: [
      "Preheat oven to 400°F (200°C).",
      "Season chicken with salt, pepper, and Italian seasoning.",
      "Toss vegetables with olive oil and garlic.",
      "Arrange chicken and vegetables on a baking sheet.",
      "Bake for 25-35 minutes until chicken is cooked through.",
    ],
    nutrition: {
      calories: 320,
      protein: 35,
      carbs: 18,
      fat: 12,
      fiber: 5,
      sugar: 6,
    },
    tags: ["gluten-free", "dairy-free", "meal-prep"],
  },
  {
    id: "4",
    title: "Almond Butter Apple Slices",
    description: "Simple snack with balanced carbs and healthy fats",
    category: "snack",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      "1 medium apple",
      "2 tbsp almond butter",
      "Cinnamon (optional)",
      "1 tsp chopped almonds",
    ],
    instructions: [
      "Core and slice apple.",
      "Spread almond butter on apple slices.",
      "Sprinkle with cinnamon if desired.",
      "Top with chopped almonds.",
    ],
    nutrition: {
      calories: 220,
      protein: 7,
      carbs: 20,
      fat: 14,
      fiber: 5,
      sugar: 12,
    },
    tags: ["quick", "no-cook", "portable"],
  },
  {
    id: "5",
    title: "Overnight Chia Pudding",
    description: "Make-ahead breakfast with steady energy release",
    category: "breakfast",
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    ingredients: [
      "6 tbsp chia seeds",
      "2 cups unsweetened almond milk",
      "2 tsp vanilla extract",
      "1/2 cup berries",
      "2 tbsp chopped nuts",
      "Stevia to taste",
    ],
    instructions: [
      "Mix chia seeds, almond milk, vanilla, and stevia.",
      "Divide between two jars.",
      "Refrigerate overnight or at least 4 hours.",
      "Top with berries and nuts before serving.",
    ],
    nutrition: {
      calories: 280,
      protein: 10,
      carbs: 24,
      fat: 16,
      fiber: 14,
      sugar: 8,
    },
    tags: ["make-ahead", "dairy-free", "vegan"],
  },
  {
    id: "6",
    title: "Turkey Lettuce Wraps",
    description: "Low-carb lunch option packed with flavor",
    category: "lunch",
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    ingredients: [
      "1 lb ground turkey",
      "8 large lettuce leaves",
      "1/2 cup diced bell peppers",
      "1/4 cup green onions",
      "2 tbsp soy sauce (low sodium)",
      "1 tbsp sesame oil",
      "Ginger and garlic",
    ],
    instructions: [
      "Cook ground turkey in sesame oil.",
      "Add peppers, ginger, and garlic.",
      "Season with soy sauce.",
      "Spoon mixture into lettuce leaves.",
      "Top with green onions.",
    ],
    nutrition: {
      calories: 290,
      protein: 32,
      carbs: 12,
      fat: 14,
      fiber: 3,
      sugar: 4,
    },
    tags: ["low-carb", "gluten-free", "quick"],
  },
];
