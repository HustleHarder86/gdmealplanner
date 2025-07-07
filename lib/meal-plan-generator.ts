import { Recipe } from "./types";
import {
  WeeklyMasterPlan,
  DayMeals,
  WeekMeals,
  WEEKLY_THEMES,
  GroceryItem,
  GroceryCategory,
} from "./meal-plan-types";
// TODO: Replace with API calls
// import { recipeService } from "./recipe-service";
import { MedicalComplianceService } from "./medical-compliance";

export class MealPlanGenerator {
  private allRecipes: {
    breakfast: Recipe[];
    lunch: Recipe[];
    dinner: Recipe[];
    snacks: Recipe[];
  };

  constructor() {
    // TODO: Load recipes from API
    this.allRecipes = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
  }

  // Generate all 12 unique weekly meal plans
  generateAllMasterPlans(): WeeklyMasterPlan[] {
    const masterPlans: WeeklyMasterPlan[] = [];
    const usedRecipes = {
      breakfast: new Set<string>(),
      lunch: new Set<string>(),
      dinner: new Set<string>(),
      snacks: new Set<string>(),
    };

    for (let week = 1; week <= 12; week++) {
      const theme = WEEKLY_THEMES.find((t) => t.week === week)!;
      const weekPlan = this.generateWeekPlan(week, theme, usedRecipes);
      masterPlans.push(weekPlan);
    }

    return masterPlans;
  }

  private generateWeekPlan(
    weekNumber: number,
    theme: { theme: string; description: string },
    usedRecipes: Record<string, Set<string>>,
  ): WeeklyMasterPlan {
    const weekMeals: WeekMeals = {
      monday: this.generateDayMeals(usedRecipes, weekNumber),
      tuesday: this.generateDayMeals(usedRecipes, weekNumber),
      wednesday: this.generateDayMeals(usedRecipes, weekNumber),
      thursday: this.generateDayMeals(usedRecipes, weekNumber),
      friday: this.generateDayMeals(usedRecipes, weekNumber),
      saturday: this.generateDayMeals(usedRecipes, weekNumber),
      sunday: this.generateDayMeals(usedRecipes, weekNumber),
    };

    const stats = this.calculateWeekStats(weekMeals);
    const groceryList = this.generateGroceryList(weekMeals);

    return {
      weekNumber,
      theme: theme.theme,
      description: theme.description,
      meals: weekMeals,
      stats,
      groceryList,
      season: this.getSeasonForWeek(weekNumber),
    };
  }

  private generateDayMeals(
    usedRecipes: Record<string, Set<string>>,
    weekNumber: number,
  ): DayMeals {
    // Select recipes ensuring variety and no repetition
    const breakfast = this.selectRecipe(
      "breakfast",
      usedRecipes.breakfast,
      weekNumber,
    );
    const lunch = this.selectRecipe("lunch", usedRecipes.lunch, weekNumber);
    const dinner = this.selectRecipe("dinner", usedRecipes.dinner, weekNumber);

    // Select snacks with variety (sweet/savory balance)
    const morningSnack = this.selectSnack(
      usedRecipes.snacks,
      "morning",
      weekNumber,
    );
    const afternoonSnack = this.selectSnack(
      usedRecipes.snacks,
      "afternoon",
      weekNumber,
    );
    const eveningSnack = this.selectBedtimeSnack(
      usedRecipes.snacks,
      weekNumber,
    );

    return {
      breakfast,
      morningSnack,
      lunch,
      afternoonSnack,
      dinner,
      eveningSnack,
    };
  }

  private selectRecipe(
    category: "breakfast" | "lunch" | "dinner",
    usedSet: Set<string>,
    weekNumber: number,
  ): string {
    const available = this.allRecipes[category].filter(
      (r) => !usedSet.has(r.id),
    );

    // Apply theme-based filtering
    const themed = this.filterByTheme(available, weekNumber);
    const selected = themed.length > 0 ? themed : available;

    // Pick a recipe and mark as used
    const recipe = selected[Math.floor(Math.random() * selected.length)];
    usedSet.add(recipe.id);

    return recipe.id;
  }

  private selectSnack(
    usedSet: Set<string>,
    timeOfDay: "morning" | "afternoon",
    weekNumber: number,
  ): string {
    const available = this.allRecipes.snacks.filter((r) => !usedSet.has(r.id));

    // Morning snacks tend to be fruit-based, afternoon more savory
    const filtered = available.filter((snack) => {
      if (timeOfDay === "morning") {
        return snack.tags.some((tag) =>
          ["fruit", "yogurt", "smoothie"].includes(tag.toLowerCase()),
        );
      } else {
        return snack.tags.some((tag) =>
          ["savory", "nuts", "cheese", "vegetables"].includes(
            tag.toLowerCase(),
          ),
        );
      }
    });

    const selected = filtered.length > 0 ? filtered : available;
    const recipe = selected[Math.floor(Math.random() * selected.length)];
    usedSet.add(recipe.id);

    return recipe.id;
  }

  private selectBedtimeSnack(usedSet: Set<string>, weekNumber: number): string {
    // TODO: Load bedtime snacks from API
    // Bedtime snacks must have 15g carbs + protein
    const bedtimeSnacks: Recipe[] = [];
    const available = bedtimeSnacks.filter((r) => !usedSet.has(r.id));

    if (available.length === 0) {
      return "placeholder-bedtime-snack";
    }

    const recipe = available[Math.floor(Math.random() * available.length)];
    usedSet.add(recipe.id);

    return recipe.id;
  }

  private filterByTheme(recipes: Recipe[], weekNumber: number): Recipe[] {
    const theme = WEEKLY_THEMES.find((t) => t.week === weekNumber)!;

    switch (theme.theme) {
      case "Mediterranean Inspired":
        return recipes.filter((r) =>
          r.tags.some((tag) =>
            ["mediterranean", "greek", "italian"].includes(tag.toLowerCase()),
          ),
        );
      case "Quick & Easy":
        return recipes.filter((r) => r.totalTime <= 30);
      case "Asian Fusion":
        return recipes.filter((r) =>
          r.tags.some((tag) =>
            ["asian", "chinese", "thai", "japanese"].includes(
              tag.toLowerCase(),
            ),
          ),
        );
      case "Budget Conscious":
        return recipes.filter((r) =>
          r.tags.some((tag) =>
            ["budget-friendly", "economical"].includes(tag.toLowerCase()),
          ),
        );
      // Add more theme filters as needed
      default:
        return recipes;
    }
  }

  private calculateWeekStats(weekMeals: WeekMeals): {
    avgDailyCarbs: number;
    avgDailyCalories: number;
    avgPrepTime: number;
    totalUniqueIngredients: number;
  } {
    let totalCarbs = 0;
    let totalCalories = 0;
    let totalPrepTime = 0;
    const allIngredients = new Set<string>();

    Object.values(weekMeals).forEach((day) => {
      Object.values(day).forEach((recipeId) => {
        // TODO: Get recipe from API
        // For now, skip recipe stats calculation
      });
    });

    return {
      avgDailyCarbs: Math.round(totalCarbs / 7),
      avgDailyCalories: Math.round(totalCalories / 7),
      avgPrepTime: Math.round(totalPrepTime / (7 * 6)), // 6 meals per day
      totalUniqueIngredients: allIngredients.size,
    };
  }

  private generateGroceryList(weekMeals: WeekMeals): {
    categories: GroceryCategory[];
    totalItems: number;
  } {
    const ingredientMap = new Map<string, GroceryItem>();

    // Aggregate all ingredients from all recipes
    Object.values(weekMeals).forEach((day) => {
      Object.entries(day).forEach(([mealType, recipeId]) => {
        // TODO: Get recipe from API and aggregate ingredients
        // For now, skip ingredient aggregation
      });
    });

    // Organize by category
    const categories = this.organizeByCategory(ingredientMap);

    return {
      categories,
      totalItems: ingredientMap.size,
    };
  }

  private normalizeIngredient(ingredient: string): string {
    // Normalize ingredient names for better aggregation
    return ingredient
      .toLowerCase()
      .replace(/^\d+(\.\d+)?\s*/, "") // Remove leading numbers
      .replace(/\s+/g, " ")
      .trim();
  }

  private aggregateQuantity(
    existing: string,
    newAmount: string,
    unit: string,
  ): string {
    // Simple aggregation - in production, would need unit conversion
    const existingNum = parseFloat(existing) || 0;
    const newNum = parseFloat(newAmount) || 0;
    return `${existingNum + newNum} ${unit}`;
  }

  private categorizeIngredient(ingredient: string): string {
    const lower = ingredient.toLowerCase();

    if (
      ["chicken", "beef", "pork", "fish", "tofu", "eggs"].some((p) =>
        lower.includes(p),
      )
    ) {
      return "Proteins";
    }
    if (["milk", "yogurt", "cheese", "cream"].some((d) => lower.includes(d))) {
      return "Dairy";
    }
    if (
      ["lettuce", "tomato", "carrot", "broccoli", "spinach"].some((v) =>
        lower.includes(v),
      )
    ) {
      return "Produce";
    }
    if (
      ["bread", "rice", "pasta", "oats", "flour"].some((g) => lower.includes(g))
    ) {
      return "Grains";
    }
    if (["oil", "butter", "nuts", "seeds"].some((f) => lower.includes(f))) {
      return "Fats & Oils";
    }

    return "Other";
  }

  private organizeByCategory(
    ingredientMap: Map<string, GroceryItem>,
  ): GroceryCategory[] {
    const categoryMap = new Map<string, GroceryItem[]>();

    ingredientMap.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category)!.push(item);
    });

    // Convert to array and sort
    const categories: GroceryCategory[] = [];
    const categoryOrder = [
      "Produce",
      "Proteins",
      "Dairy",
      "Grains",
      "Fats & Oils",
      "Other",
    ];

    categoryOrder.forEach((catName) => {
      if (categoryMap.has(catName)) {
        categories.push({
          name: catName,
          items: categoryMap
            .get(catName)!
            .sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    });

    return categories;
  }

  private getSeasonForWeek(
    weekNumber: number,
  ): "spring" | "summer" | "fall" | "winter" | "any" {
    // Map weeks to seasons (rough approximation)
    if (weekNumber >= 1 && weekNumber <= 3) return "winter";
    if (weekNumber >= 4 && weekNumber <= 6) return "spring";
    if (weekNumber >= 7 && weekNumber <= 9) return "summer";
    if (weekNumber >= 10 && weekNumber <= 12) return "fall";
    return "any";
  }
}

// Export singleton instance
export const mealPlanGenerator = new MealPlanGenerator();
