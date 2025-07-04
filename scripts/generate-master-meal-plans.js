const fs = require("fs");
const path = require("path");

// Import the generator (we'll need to compile TypeScript first)
// For now, let's create a simplified version

const recipeData = {
  breakfast: require("./recipe-scraper/data/recipes/breakfast.json"),
  lunch: require("./recipe-scraper/data/recipes/lunch.json"),
  dinner: require("./recipe-scraper/data/recipes/dinner.json"),
  snacks: require("./recipe-scraper/data/recipes/snacks.json"),
};

const WEEKLY_THEMES = [
  {
    week: 1,
    theme: "Mediterranean Inspired",
    description:
      "Fresh flavors from the Mediterranean with olive oil, whole grains, and lean proteins",
  },
  {
    week: 2,
    theme: "Quick & Easy",
    description: "All meals under 30 minutes - perfect for busy weeks",
  },
  {
    week: 3,
    theme: "Comfort Classics",
    description: "Healthified versions of your favorite comfort foods",
  },
  {
    week: 4,
    theme: "Asian Fusion",
    description: "Flavorful Asian-inspired dishes with balanced nutrition",
  },
  {
    week: 5,
    theme: "Farm Fresh",
    description:
      "Seasonal vegetables and wholesome ingredients take center stage",
  },
  {
    week: 6,
    theme: "Global Flavors",
    description: "A culinary journey with dishes from around the world",
  },
  {
    week: 7,
    theme: "Summer Lighter",
    description: "Light, refreshing meals perfect for warmer weather",
  },
  {
    week: 8,
    theme: "Hearty & Wholesome",
    description: "Satisfying meals that keep you full and energized",
  },
  {
    week: 9,
    theme: "30-Minute Meals",
    description: "Complete meals from start to finish in 30 minutes or less",
  },
  {
    week: 10,
    theme: "Batch Cooking Friendly",
    description: "Meals that prep well for efficient weekly cooking",
  },
  {
    week: 11,
    theme: "Budget Conscious",
    description: "Delicious meals that won't break the bank",
  },
  {
    week: 12,
    theme: "Holiday Favorites",
    description: "Special occasion meals that everyone will enjoy",
  },
];

class MasterPlanGenerator {
  constructor() {
    this.usedRecipes = {
      breakfast: new Set(),
      lunch: new Set(),
      dinner: new Set(),
      snacks: new Set(),
    };
  }

  generateAllPlans() {
    const plans = [];

    for (let week = 1; week <= 12; week++) {
      console.log(`Generating week ${week}...`);
      const weekPlan = this.generateWeekPlan(week);
      plans.push(weekPlan);

      // Save individual week file
      const weekPath = path.join(
        __dirname,
        "..",
        "data",
        "meal-plans",
        `week-${week}.json`,
      );
      fs.writeFileSync(weekPath, JSON.stringify(weekPlan, null, 2));
    }

    // Save master file with all plans
    const masterPath = path.join(
      __dirname,
      "..",
      "data",
      "meal-plans",
      "master-plans.json",
    );
    fs.writeFileSync(masterPath, JSON.stringify(plans, null, 2));

    console.log("\nGenerated 12 unique weekly meal plans!");
    this.printStats(plans);

    return plans;
  }

  generateWeekPlan(weekNumber) {
    const theme = WEEKLY_THEMES.find((t) => t.week === weekNumber);
    const meals = {};
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    days.forEach((day) => {
      meals[day] = this.generateDayMeals(weekNumber);
    });

    const stats = this.calculateStats(meals);
    const groceryList = this.generateGroceryList(meals);

    return {
      weekNumber,
      theme: theme.theme,
      description: theme.description,
      meals,
      stats,
      groceryList,
      season: this.getSeasonForWeek(weekNumber),
    };
  }

  generateDayMeals(weekNumber) {
    return {
      breakfast: this.selectRecipe("breakfast", weekNumber),
      morningSnack: this.selectSnack("morning", weekNumber),
      lunch: this.selectRecipe("lunch", weekNumber),
      afternoonSnack: this.selectSnack("afternoon", weekNumber),
      dinner: this.selectRecipe("dinner", weekNumber),
      eveningSnack: this.selectBedtimeSnack(weekNumber),
    };
  }

  selectRecipe(category, weekNumber) {
    const recipes = recipeData[category];
    const available = recipes.filter(
      (r) => !this.usedRecipes[category].has(r.id),
    );

    // Apply theme filtering
    let themed = this.filterByTheme(available, weekNumber);
    const selected = themed.length > 0 ? themed : available;

    // Random selection from available
    const recipe = selected[Math.floor(Math.random() * selected.length)];
    this.usedRecipes[category].add(recipe.id);

    return recipe.id;
  }

  selectSnack(timeOfDay, weekNumber) {
    const snacks = recipeData.snacks;
    let available = snacks.filter((r) => !this.usedRecipes.snacks.has(r.id));

    // If we've used all snacks, allow reuse but prefer unused
    if (available.length === 0) {
      console.log(
        `  Note: Reusing snacks for ${timeOfDay} snack in week ${weekNumber}`,
      );
      available = snacks;
    }

    // Filter by time of day preference
    let filtered = available;
    if (timeOfDay === "morning") {
      // Prefer fruit-based, yogurt snacks for morning
      filtered = available.filter(
        (s) =>
          s.title.toLowerCase().includes("fruit") ||
          s.title.toLowerCase().includes("yogurt") ||
          s.title.toLowerCase().includes("berries"),
      );
    } else {
      // Prefer savory snacks for afternoon
      filtered = available.filter(
        (s) =>
          s.title.toLowerCase().includes("cheese") ||
          s.title.toLowerCase().includes("nuts") ||
          s.title.toLowerCase().includes("hummus") ||
          s.title.toLowerCase().includes("vegetables"),
      );
    }

    const selected = filtered.length > 0 ? filtered : available;
    if (selected.length === 0) {
      console.error("No recipes available!");
      return snacks[0].id; // Fallback
    }

    const recipe = selected[Math.floor(Math.random() * selected.length)];
    this.usedRecipes.snacks.add(recipe.id);

    return recipe.id;
  }

  selectBedtimeSnack(weekNumber) {
    // Bedtime snacks need 15g carbs + protein
    const snacks = recipeData.snacks;
    const bedtimeSnacks = snacks.filter(
      (s) =>
        s.nutrition.carbs >= 14 &&
        s.nutrition.carbs <= 16 &&
        s.nutrition.protein >= 5 &&
        !this.usedRecipes.snacks.has(s.id),
    );

    if (bedtimeSnacks.length === 0) {
      // If we've used all bedtime snacks, reset that subset
      const allBedtime = snacks.filter(
        (s) =>
          s.nutrition.carbs >= 14 &&
          s.nutrition.carbs <= 16 &&
          s.nutrition.protein >= 5,
      );
      const recipe = allBedtime[Math.floor(Math.random() * allBedtime.length)];
      return recipe.id;
    }

    const recipe =
      bedtimeSnacks[Math.floor(Math.random() * bedtimeSnacks.length)];
    this.usedRecipes.snacks.add(recipe.id);

    return recipe.id;
  }

  filterByTheme(recipes, weekNumber) {
    const theme = WEEKLY_THEMES.find((t) => t.week === weekNumber);

    switch (theme.theme) {
      case "Mediterranean Inspired":
        return recipes.filter(
          (r) =>
            r.title.toLowerCase().includes("mediterranean") ||
            r.title.toLowerCase().includes("greek") ||
            r.title.toLowerCase().includes("italian"),
        );

      case "Quick & Easy":
      case "30-Minute Meals":
        return recipes.filter((r) => r.totalTime <= 30);

      case "Asian Fusion":
        return recipes.filter(
          (r) =>
            r.title.toLowerCase().includes("asian") ||
            r.title.toLowerCase().includes("stir-fry") ||
            r.title.toLowerCase().includes("thai"),
        );

      default:
        return recipes;
    }
  }

  calculateStats(weekMeals) {
    let totalCarbs = 0;
    let totalCalories = 0;
    let totalPrepTime = 0;
    const uniqueIngredients = new Set();

    Object.values(weekMeals).forEach((day) => {
      Object.values(day).forEach((recipeId) => {
        const recipe = this.findRecipeById(recipeId);
        if (recipe) {
          totalCarbs += recipe.nutrition.carbs;
          totalCalories += recipe.nutrition.calories;
          totalPrepTime += recipe.totalTime;
          recipe.ingredients.forEach((ing) => {
            uniqueIngredients.add(ing.item.toLowerCase());
          });
        }
      });
    });

    return {
      avgDailyCarbs: Math.round(totalCarbs / 7),
      avgDailyCalories: Math.round(totalCalories / 7),
      avgPrepTime: Math.round(totalPrepTime / (7 * 6)),
      totalUniqueIngredients: uniqueIngredients.size,
    };
  }

  generateGroceryList(weekMeals) {
    const ingredientMap = new Map();

    Object.values(weekMeals).forEach((day) => {
      Object.values(day).forEach((recipeId) => {
        const recipe = this.findRecipeById(recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            const key = ing.item.toLowerCase();
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key);
              existing.recipes.push(recipe.title);
            } else {
              ingredientMap.set(key, {
                name: ing.item,
                amount: ing.amount,
                unit: ing.unit,
                category: this.categorizeIngredient(ing.item),
                recipes: [recipe.title],
              });
            }
          });
        }
      });
    });

    // Organize by category
    const categories = {};
    ingredientMap.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    const categoryArray = Object.entries(categories).map(([name, items]) => ({
      name,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));

    return {
      categories: categoryArray,
      totalItems: ingredientMap.size,
    };
  }

  categorizeIngredient(ingredient) {
    const lower = ingredient.toLowerCase();

    if (
      [
        "chicken",
        "beef",
        "turkey",
        "fish",
        "tofu",
        "eggs",
        "salmon",
        "tuna",
      ].some((p) => lower.includes(p))
    ) {
      return "Proteins";
    }
    if (
      ["milk", "yogurt", "cheese", "cream", "butter"].some((d) =>
        lower.includes(d),
      )
    ) {
      return "Dairy";
    }
    if (
      [
        "tomato",
        "lettuce",
        "carrot",
        "broccoli",
        "spinach",
        "pepper",
        "cucumber",
        "onion",
      ].some((v) => lower.includes(v))
    ) {
      return "Produce";
    }
    if (
      ["bread", "rice", "pasta", "oats", "quinoa", "flour"].some((g) =>
        lower.includes(g),
      )
    ) {
      return "Grains";
    }

    return "Other";
  }

  findRecipeById(id) {
    const allRecipes = [
      ...recipeData.breakfast,
      ...recipeData.lunch,
      ...recipeData.dinner,
      ...recipeData.snacks,
    ];
    return allRecipes.find((r) => r.id === id);
  }

  getSeasonForWeek(weekNumber) {
    if (weekNumber >= 1 && weekNumber <= 3) return "winter";
    if (weekNumber >= 4 && weekNumber <= 6) return "spring";
    if (weekNumber >= 7 && weekNumber <= 9) return "summer";
    if (weekNumber >= 10 && weekNumber <= 12) return "fall";
    return "any";
  }

  printStats(plans) {
    console.log("\n=== Master Plan Statistics ===");
    console.log(
      `Total unique recipes used: ${this.usedRecipes.breakfast.size + this.usedRecipes.lunch.size + this.usedRecipes.dinner.size + this.usedRecipes.snacks.size}`,
    );
    console.log(
      `Breakfast recipes used: ${this.usedRecipes.breakfast.size}/90`,
    );
    console.log(`Lunch recipes used: ${this.usedRecipes.lunch.size}/90`);
    console.log(`Dinner recipes used: ${this.usedRecipes.dinner.size}/90`);
    console.log(`Snack recipes used: ${this.usedRecipes.snacks.size}/90`);

    plans.forEach((plan) => {
      console.log(`\nWeek ${plan.weekNumber} - ${plan.theme}:`);
      console.log(`  Avg daily carbs: ${plan.stats.avgDailyCarbs}g`);
      console.log(`  Avg daily calories: ${plan.stats.avgDailyCalories}`);
      console.log(`  Grocery items: ${plan.groceryList.totalItems}`);
    });
  }
}

// Create output directory
const outputDir = path.join(__dirname, "..", "data", "meal-plans");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate all plans
const generator = new MasterPlanGenerator();
generator.generateAllPlans();
