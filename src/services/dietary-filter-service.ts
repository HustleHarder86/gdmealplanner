/**
 * Dietary Filter Service
 * Filters recipes based on dietary restrictions
 */

import { Recipe } from '@/src/types/recipe';
import { DietaryRestriction, DietaryPreferences } from '@/src/types/dietary';

export class DietaryFilterService {
  /**
   * Filter recipes based on dietary restrictions
   */
  static filterByDietaryRestrictions(
    recipes: Recipe[],
    restrictions: DietaryRestriction[]
  ): Recipe[] {
    if (!restrictions || restrictions.length === 0) {
      return recipes;
    }

    return recipes.filter(recipe => {
      // If recipe doesn't have dietary info, exclude it when restrictions are active
      if (!recipe.dietaryInfo) {
        return false;
      }

      // Check each restriction
      for (const restriction of restrictions) {
        switch (restriction) {
          case 'vegetarian':
            if (!recipe.dietaryInfo.isVegetarian) return false;
            break;
          case 'vegan':
            if (!recipe.dietaryInfo.isVegan) return false;
            break;
          case 'glutenFree':
            if (!recipe.dietaryInfo.isGlutenFree) return false;
            break;
          case 'dairyFree':
            if (!recipe.dietaryInfo.isDairyFree) return false;
            break;
          case 'nutFree':
            if (!recipe.dietaryInfo.isNutFree) return false;
            break;
          case 'pescatarian':
            if (!recipe.dietaryInfo.isPescatarian) return false;
            break;
          case 'eggFree':
            if (!recipe.dietaryInfo.isEggFree) return false;
            break;
        }
      }

      return true;
    });
  }

  /**
   * Filter recipes and return structured result with exclusion reasons
   */
  static filterRecipes(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): { suitable: Recipe[]; excluded: Array<{recipe: Recipe; reason: string}> } {
    const suitable: Recipe[] = [];
    const excluded: Array<{recipe: Recipe; reason: string}> = [];

    for (const recipe of recipes) {
      // Check dietary restrictions
      let excludeReason: string | null = null;

      // Check each restriction
      for (const restriction of preferences.restrictions) {
        if (!recipe.dietaryInfo) {
          excludeReason = 'No dietary information available';
          break;
        }

        switch (restriction) {
          case 'vegetarian':
            if (!recipe.dietaryInfo.isVegetarian) {
              excludeReason = 'Contains meat (vegetarian restriction)';
            }
            break;
          case 'vegan':
            if (!recipe.dietaryInfo.isVegan) {
              excludeReason = 'Contains animal products (vegan restriction)';
            }
            break;
          case 'glutenFree':
            if (!recipe.dietaryInfo.isGlutenFree) {
              excludeReason = 'Contains gluten (gluten-free restriction)';
            }
            break;
          case 'dairyFree':
            if (!recipe.dietaryInfo.isDairyFree) {
              excludeReason = 'Contains dairy (dairy-free restriction)';
            }
            break;
          case 'nutFree':
            if (!recipe.dietaryInfo.isNutFree) {
              excludeReason = 'Contains nuts (nut-free restriction)';
            }
            break;
          case 'pescatarian':
            if (!recipe.dietaryInfo.isPescatarian) {
              excludeReason = 'Contains non-seafood meat (pescatarian restriction)';
            }
            break;
          case 'eggFree':
            if (!recipe.dietaryInfo.isEggFree) {
              excludeReason = 'Contains eggs (egg-free restriction)';
            }
            break;
        }

        if (excludeReason) break;
      }

      // Check dislikes if not already excluded
      if (!excludeReason && preferences.dislikes && preferences.dislikes.length > 0) {
        for (const dislike of preferences.dislikes) {
          const hasDisliked = recipe.ingredients.some(ing =>
            ing.name.toLowerCase().includes(dislike.toLowerCase())
          );
          if (hasDisliked) {
            excludeReason = `Contains ${dislike} (disliked ingredient)`;
            break;
          }
        }
      }

      // Add to appropriate array
      if (excludeReason) {
        excluded.push({ recipe, reason: excludeReason });
      } else {
        suitable.push(recipe);
      }
    }

    return { suitable, excluded };
  }

  /**
   * Filter recipes by complete dietary preferences (restrictions + dislikes + allergies)
   */
  static filterByPreferences(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): Recipe[] {
    // First filter by restrictions
    let filtered = this.filterByDietaryRestrictions(recipes, preferences.restrictions);

    // Filter by dislikes (ingredient-based)
    if (preferences.dislikes && preferences.dislikes.length > 0) {
      filtered = filtered.filter(recipe => {
        const ingredientNames = recipe.ingredients
          .map(ing => ing.name.toLowerCase())
          .join(' ');
        
        // Check if any disliked ingredient is present
        for (const dislike of preferences.dislikes) {
          if (ingredientNames.includes(dislike.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    }

    // Filter by allergies (stricter than restrictions)
    if (preferences.allergies && preferences.allergies.length > 0) {
      filtered = filtered.filter(recipe => {
        if (!recipe.allergenInfo) return false;
        
        // Check if recipe contains any allergens
        for (const allergy of preferences.allergies) {
          if (recipe.allergenInfo.contains.includes(allergy.toLowerCase())) {
            return false;
          }
          // Also check "may contain" for severe allergies
          if (recipe.allergenInfo.mayContain.includes(allergy.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    }

    return filtered;
  }

  /**
   * Get recipe counts by dietary restriction
   */
  static getRecipeCountsByRestriction(
    recipes: Recipe[]
  ): Record<DietaryRestriction, number> {
    const counts: Record<DietaryRestriction, number> = {
      vegetarian: 0,
      vegan: 0,
      glutenFree: 0,
      dairyFree: 0,
      nutFree: 0,
      pescatarian: 0,
      eggFree: 0,
    };

    for (const recipe of recipes) {
      if (!recipe.dietaryInfo) continue;

      if (recipe.dietaryInfo.isVegetarian) counts.vegetarian++;
      if (recipe.dietaryInfo.isVegan) counts.vegan++;
      if (recipe.dietaryInfo.isGlutenFree) counts.glutenFree++;
      if (recipe.dietaryInfo.isDairyFree) counts.dairyFree++;
      if (recipe.dietaryInfo.isNutFree) counts.nutFree++;
      if (recipe.dietaryInfo.isPescatarian) counts.pescatarian++;
      if (recipe.dietaryInfo.isEggFree) counts.eggFree++;
    }

    return counts;
  }

  /**
   * Check if there are enough recipes for meal planning with given restrictions
   */
  static hasEnoughRecipesForMealPlan(
    recipes: Recipe[],
    restrictions: DietaryRestriction[],
    daysNeeded: number = 7
  ): { isValid: boolean; message?: string; breakdown?: Record<string, number> } {
    const filtered = this.filterByDietaryRestrictions(recipes, restrictions);
    
    // Group by category
    const byCategory = {
      breakfast: filtered.filter(r => r.category === 'breakfast').length,
      lunch: filtered.filter(r => r.category === 'lunch').length,
      dinner: filtered.filter(r => r.category === 'dinner').length,
      snack: filtered.filter(r => r.category === 'snack').length,
    };

    // Minimum needed for a week (with some variety)
    const minNeeded = {
      breakfast: daysNeeded * 1.5, // Allow some variety
      lunch: daysNeeded * 1.5,
      dinner: daysNeeded * 1.5,
      snack: daysNeeded * 2, // Multiple snacks per day
    };

    const issues: string[] = [];
    
    if (byCategory.breakfast < minNeeded.breakfast) {
      issues.push(`Only ${byCategory.breakfast} breakfast options (need at least ${Math.floor(minNeeded.breakfast)})`);
    }
    if (byCategory.lunch < minNeeded.lunch) {
      issues.push(`Only ${byCategory.lunch} lunch options (need at least ${Math.floor(minNeeded.lunch)})`);
    }
    if (byCategory.dinner < minNeeded.dinner) {
      issues.push(`Only ${byCategory.dinner} dinner options (need at least ${Math.floor(minNeeded.dinner)})`);
    }
    if (byCategory.snack < minNeeded.snack) {
      issues.push(`Only ${byCategory.snack} snack options (need at least ${Math.floor(minNeeded.snack)})`);
    }

    return {
      isValid: issues.length === 0,
      message: issues.length > 0 ? `Limited recipes: ${issues.join(', ')}` : undefined,
      breakdown: byCategory,
    };
  }

  /**
   * Get compatible recipes that could be easily adapted
   */
  static getAdaptableRecipes(
    recipes: Recipe[],
    restriction: DietaryRestriction
  ): { recipe: Recipe; adaptations: string[] }[] {
    const adaptable: { recipe: Recipe; adaptations: string[] }[] = [];

    for (const recipe of recipes) {
      if (!recipe.dietaryInfo) continue;

      const adaptations: string[] = [];

      switch (restriction) {
        case 'vegetarian':
          // Check if only meat needs to be replaced
          if (!recipe.dietaryInfo.isVegetarian && recipe.dietaryInfo.isDairyFree === false) {
            const meatIngredients = recipe.ingredients.filter(ing => 
              /chicken|beef|pork|turkey|lamb|bacon|ham|sausage|meat/i.test(ing.name)
            );
            if (meatIngredients.length === 1) {
              adaptations.push(`Replace ${meatIngredients[0].name} with tofu, tempeh, or beans`);
            }
          }
          break;

        case 'glutenFree':
          // Check if only pasta/bread needs substitution
          if (!recipe.dietaryInfo.isGlutenFree) {
            const glutenIngredients = recipe.ingredients.filter(ing =>
              /pasta|noodles|bread|flour|soy sauce/i.test(ing.name)
            );
            if (glutenIngredients.length === 1) {
              if (glutenIngredients[0].name.includes('pasta')) {
                adaptations.push('Use gluten-free pasta');
              } else if (glutenIngredients[0].name.includes('bread')) {
                adaptations.push('Use gluten-free bread');
              } else if (glutenIngredients[0].name.includes('soy sauce')) {
                adaptations.push('Use tamari or coconut aminos');
              }
            }
          }
          break;

        case 'dairyFree':
          // Check for simple dairy substitutions
          if (!recipe.dietaryInfo.isDairyFree) {
            const dairyIngredients = recipe.ingredients.filter(ing =>
              /milk|cheese|yogurt|butter|cream/i.test(ing.name)
            );
            if (dairyIngredients.length === 1) {
              const dairy = dairyIngredients[0].name.toLowerCase();
              if (dairy.includes('milk')) {
                adaptations.push('Use plant-based milk (almond, oat, soy)');
              } else if (dairy.includes('cheese')) {
                adaptations.push('Use nutritional yeast or dairy-free cheese');
              } else if (dairy.includes('yogurt')) {
                adaptations.push('Use coconut or almond yogurt');
              } else if (dairy.includes('butter')) {
                adaptations.push('Use olive oil or vegan butter');
              }
            }
          }
          break;
      }

      if (adaptations.length > 0) {
        adaptable.push({ recipe, adaptations });
      }
    }

    return adaptable;
  }
}