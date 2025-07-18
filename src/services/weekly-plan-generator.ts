import { MealPlanAlgorithm } from '@/src/lib/meal-planning/meal-plan-algorithm';
import { LocalRecipeService } from './local-recipe-service';
import { DietaryFilterService } from './dietary-filter-service';
import { 
  WeeklyRotationPlan, 
  RotationTrack, 
  RotationLibrary, 
  ROTATION_TRACKS,
  RotationTrackConfig 
} from '@/src/types/weekly-rotation';
import { MealPlan } from '@/src/types/meal-plan';
import { Recipe } from '@/src/types/recipe';
import { DietaryPreferences } from '@/src/types/dietary';
import { MealPlanPreferences, MealPlanGenerationOptions } from '@/src/types/meal-plan';
import { v4 as uuidv4 } from 'uuid';

/**
 * WeeklyPlanGenerator
 * 
 * Generates pre-built meal plan rotations with maximum variety and minimal repetition
 * Uses existing meal planning algorithm to create 52+ weeks of curated plans
 */
export class WeeklyPlanGenerator {
  
  /**
   * Generate a complete rotation library for a specific track
   */
  static async generateRotationLibrary(
    track: RotationTrack, 
    totalWeeks: number = 52
  ): Promise<RotationLibrary> {
    console.log(`[WEEKLY_GENERATOR] Generating ${totalWeeks} weeks for ${track} track`);
    
    const trackConfig = ROTATION_TRACKS.find(t => t.track === track);
    if (!trackConfig) {
      throw new Error(`Unknown rotation track: ${track}`);
    }
    
    // Get filtered recipes for this track
    const availableRecipes = this.getRecipesForTrack(trackConfig);
    console.log(`[WEEKLY_GENERATOR] Found ${availableRecipes.length} recipes for ${track} track`);
    
    // Generate weekly plans with recipe spacing logic
    const plans: WeeklyRotationPlan[] = [];
    const recipeUsageTracker = new Map<string, number[]>(); // Recipe ID -> weeks used
    
    for (let week = 1; week <= totalWeeks; week++) {
      const weekPlan = await this.generateWeekPlan(
        week,
        track,
        trackConfig,
        availableRecipes,
        recipeUsageTracker
      );
      
      plans.push(weekPlan);
      
      // Update recipe usage tracking
      this.updateRecipeUsage(weekPlan.mealPlan, recipeUsageTracker, week);
      
      if (week % 10 === 0) {
        console.log(`[WEEKLY_GENERATOR] Generated ${week}/${totalWeeks} weeks for ${track}`);
      }
    }
    
    return {
      track,
      totalWeeks,
      plans,
      lastGenerated: new Date().toISOString(),
    };
  }
  
  /**
   * Generate all rotation tracks
   */
  static async generateAllRotations(totalWeeks: number = 52): Promise<RotationLibrary[]> {
    const libraries: RotationLibrary[] = [];
    
    for (const trackConfig of ROTATION_TRACKS) {
      try {
        const library = await this.generateRotationLibrary(trackConfig.track, totalWeeks);
        libraries.push(library);
        console.log(`[WEEKLY_GENERATOR] Completed ${trackConfig.track} track: ${library.plans.length} weeks`);
      } catch (error) {
        console.error(`[WEEKLY_GENERATOR] Failed to generate ${trackConfig.track} track:`, error);
      }
    }
    
    return libraries;
  }
  
  /**
   * Get recipes suitable for a specific track
   */
  private static getRecipesForTrack(trackConfig: RotationTrackConfig): Recipe[] {
    let recipes = LocalRecipeService.getAllRecipes();
    
    // Apply dietary filters
    if (trackConfig.dietaryFilters) {
      const preferences: DietaryPreferences = {
        restrictions: trackConfig.dietaryFilters as any[],
        dislikes: [],
        allergies: [],
      };
      
      const filtered = DietaryFilterService.filterRecipes(recipes, preferences);
      recipes = filtered.suitable;
    }
    
    // Apply preference filters
    if (trackConfig.preferences) {
      if (trackConfig.preferences.maxCookTime) {
        recipes = recipes.filter(r => r.totalTime <= trackConfig.preferences!.maxCookTime!);
      }
      
      if (trackConfig.preferences.complexity === 'simple') {
        // Prefer recipes with fewer ingredients and steps
        recipes = recipes.filter(r => 
          r.ingredients.length <= 8 && 
          r.instructions.length <= 6
        );
      }
    }
    
    return recipes;
  }
  
  /**
   * Generate a single week's meal plan with recipe spacing logic
   */
  private static async generateWeekPlan(
    weekNumber: number,
    track: RotationTrack,
    trackConfig: RotationTrackConfig,
    availableRecipes: Recipe[],
    recipeUsageTracker: Map<string, number[]>
  ): Promise<WeeklyRotationPlan> {
    
    // Create dietary preferences for this track
    const dietaryPreferences: DietaryPreferences = {
      restrictions: (trackConfig.dietaryFilters || []) as any[],
      dislikes: [],
      allergies: [],
    };
    
    // Generate meal plan with spacing constraints
    let mealPlan: MealPlan;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      // Convert DietaryPreferences to MealPlanPreferences format
      const mealPlanPrefs: MealPlanPreferences = {
        dietaryRestrictions: dietaryPreferences.restrictions,
        dislikedIngredients: dietaryPreferences.dislikes,
        allergies: dietaryPreferences.allergies || [],
        carbDistribution: {
          breakfast: 30,
          morningSnack: 15,
          lunch: 45,
          afternoonSnack: 15,
          dinner: 45,
          eveningSnack: 15
        },
        skipMorningSnack: false,
        skipAfternoonSnack: false,
        requireEveningSnack: true,
        mealPrepFriendly: false,
        familySize: 2,
        preferredCookTime: trackConfig.preferences?.maxCookTime && trackConfig.preferences.maxCookTime <= 30 ? 'quick' : 'medium'
      };
      
      const options: MealPlanGenerationOptions = {
        startDate: new Date().toISOString().split('T')[0],
        daysToGenerate: 7,
        prioritizeNew: true,
        avoidRecentMeals: true,
        maxRecipeRepeats: 1
      };
      
      mealPlan = await MealPlanAlgorithm.generateMealPlan(mealPlanPrefs, options);
      attempts++;
      
      // Check recipe spacing - ensure no recipe used in last 8 weeks
      const hasRecentRepeats = this.checkRecipeSpacing(mealPlan, recipeUsageTracker, weekNumber, 8);
      
      if (!hasRecentRepeats || attempts >= maxAttempts) {
        break;
      }
      
      console.log(`[WEEKLY_GENERATOR] Week ${weekNumber} attempt ${attempts}: recipes too recent, regenerating...`);
    } while (attempts < maxAttempts);
    
    // Generate week title and description
    const { title, description } = this.generateWeekMetadata(weekNumber, track, mealPlan);
    
    return {
      id: uuidv4(),
      weekNumber,
      rotationTrack: track,
      mealPlan,
      title,
      description,
      tags: this.generateWeekTags(mealPlan, trackConfig),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }
  
  /**
   * Check if meal plan has recipes used too recently
   */
  private static checkRecipeSpacing(
    mealPlan: MealPlan,
    recipeUsageTracker: Map<string, number[]>,
    currentWeek: number,
    minSpacing: number
  ): boolean {
    const usedRecipes = this.extractRecipeIds(mealPlan);
    
    for (const recipeId of usedRecipes) {
      const previousWeeks = recipeUsageTracker.get(recipeId) || [];
      const recentWeeks = previousWeeks.filter(week => currentWeek - week < minSpacing);
      
      if (recentWeeks.length > 0) {
        return true; // Found recent repeat
      }
    }
    
    return false; // No recent repeats
  }
  
  /**
   * Extract all recipe IDs from a meal plan
   */
  private static extractRecipeIds(mealPlan: MealPlan): string[] {
    const recipeIds: string[] = [];
    
    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        if (meal.recipeId) {
          recipeIds.push(meal.recipeId);
        }
      });
    });
    
    return [...new Set(recipeIds)]; // Remove duplicates
  }
  
  /**
   * Update recipe usage tracking
   */
  private static updateRecipeUsage(
    mealPlan: MealPlan,
    recipeUsageTracker: Map<string, number[]>,
    weekNumber: number
  ): void {
    const usedRecipes = this.extractRecipeIds(mealPlan);
    
    usedRecipes.forEach(recipeId => {
      const weeks = recipeUsageTracker.get(recipeId) || [];
      weeks.push(weekNumber);
      recipeUsageTracker.set(recipeId, weeks);
    });
  }
  
  /**
   * Generate descriptive title and description for a week
   */
  private static generateWeekMetadata(
    weekNumber: number,
    track: RotationTrack,
    mealPlan: MealPlan
  ): { title: string; description: string } {
    const themes = this.getWeekThemes();
    const themeIndex = (weekNumber - 1) % themes.length;
    const theme = themes[themeIndex];
    
    // Track-specific prefixes
    const trackPrefixes = {
      standard: '',
      vegetarian: 'Plant-Based ',
      quick: 'Quick & Easy ',
      family: 'Family-Style ',
    };
    
    const title = `${trackPrefixes[track]}${theme.title}`;
    const description = `Week ${weekNumber}: ${theme.description}`;
    
    return { title, description };
  }
  
  /**
   * Generate tags for a week based on meal plan contents
   */
  private static generateWeekTags(
    mealPlan: MealPlan,
    trackConfig: RotationTrackConfig
  ): string[] {
    const tags: string[] = [];
    
    // Add track-specific tags
    tags.push(trackConfig.track);
    
    // Analyze meal plan for additional tags
    const recipes = this.getMealPlanRecipes(mealPlan);
    
    // Cooking time analysis
    const avgCookTime = recipes.reduce((sum, r) => sum + r.totalTime, 0) / recipes.length;
    if (avgCookTime <= 25) tags.push('quick');
    if (avgCookTime >= 60) tags.push('elaborate');
    
    // Cuisine analysis
    const cuisines = recipes.flatMap(r => r.tags || [])
      .filter(tag => ['mediterranean', 'asian', 'mexican', 'italian', 'american'].includes(tag.toLowerCase()));
    if (cuisines.length > 0) {
      tags.push(...[...new Set(cuisines)].slice(0, 2));
    }
    
    // Dietary tags
    if (recipes.every(r => r.dietaryInfo?.isVegetarian)) tags.push('vegetarian');
    if (recipes.every(r => r.dietaryInfo?.isGlutenFree)) tags.push('gluten-free');
    
    return [...new Set(tags)];
  }
  
  /**
   * Get all recipes from a meal plan
   */
  private static getMealPlanRecipes(mealPlan: MealPlan): Recipe[] {
    const recipeIds = this.extractRecipeIds(mealPlan);
    return recipeIds
      .map(id => LocalRecipeService.getRecipeById(id))
      .filter((recipe): recipe is Recipe => recipe !== null);
  }
  
  /**
   * Get weekly themes for variety
   */
  private static getWeekThemes() {
    return [
      { title: 'Fresh & Light', description: 'Light, refreshing meals perfect for any season' },
      { title: 'Comfort Classics', description: 'Hearty, satisfying dishes that feel like home' },
      { title: 'Global Flavors', description: 'A journey through international cuisines' },
      { title: 'One-Pot Wonders', description: 'Simple meals that minimize cleanup' },
      { title: 'Protein Power', description: 'High-protein meals for sustained energy' },
      { title: 'Veggie Forward', description: 'Vegetable-focused dishes bursting with flavor' },
      { title: 'Quick & Simple', description: 'Fast meals for busy schedules' },
      { title: 'Mediterranean Mix', description: 'Fresh, healthy Mediterranean-inspired meals' },
      { title: 'Cozy & Warm', description: 'Warming dishes perfect for cooler days' },
      { title: 'Fresh Start', description: 'Clean, energizing meals to reset your week' },
      { title: 'Balanced Basics', description: 'Well-rounded meals with perfect nutrition' },
      { title: 'Flavor Fusion', description: 'Creative combinations of tastes and textures' },
      { title: 'Seasonal Favorites', description: 'Meals celebrating seasonal ingredients' },
      { title: 'Family Feast', description: 'Satisfying meals the whole family will love' },
      { title: 'Lean & Clean', description: 'Light meals focused on clean eating' },
      { title: 'Spice & Nice', description: 'Flavorful dishes with aromatic spices' },
      { title: 'Simple Pleasures', description: 'Uncomplicated meals with maximum flavor' },
      { title: 'Nutrient Dense', description: 'Power-packed meals for optimal nutrition' },
      { title: 'Weekend Worthy', description: 'Special meals worth the extra effort' },
      { title: 'Everyday Easy', description: 'Practical meals for everyday life' },
    ];
  }
  
  /**
   * Get recipe variety statistics for a rotation
   */
  static analyzeRotationVariety(library: RotationLibrary): {
    totalRecipes: number;
    uniqueRecipes: number;
    averageRepeats: number;
    maxGapBetweenRepeats: number;
    recipeDistribution: Record<string, number>;
  } {
    const recipeUsage = new Map<string, number[]>();
    
    // Track when each recipe is used
    library.plans.forEach((plan, index) => {
      const recipeIds = this.extractRecipeIds(plan.mealPlan);
      recipeIds.forEach(recipeId => {
        const weeks = recipeUsage.get(recipeId) || [];
        weeks.push(index + 1);
        recipeUsage.set(recipeId, weeks);
      });
    });
    
    const totalRecipes = Array.from(recipeUsage.values()).reduce((sum, weeks) => sum + weeks.length, 0);
    const uniqueRecipes = recipeUsage.size;
    const averageRepeats = totalRecipes / uniqueRecipes;
    
    // Calculate maximum gap between repeats
    let maxGap = 0;
    recipeUsage.forEach(weeks => {
      if (weeks.length > 1) {
        for (let i = 1; i < weeks.length; i++) {
          const gap = weeks[i] - weeks[i - 1];
          maxGap = Math.max(maxGap, gap);
        }
      }
    });
    
    // Create distribution map
    const distribution: Record<string, number> = {};
    recipeUsage.forEach((weeks, recipeId) => {
      const recipe = LocalRecipeService.getRecipeById(recipeId);
      if (recipe) {
        distribution[recipe.title] = weeks.length;
      }
    });
    
    return {
      totalRecipes,
      uniqueRecipes,
      averageRepeats: Math.round(averageRepeats * 100) / 100,
      maxGapBetweenRepeats: maxGap,
      recipeDistribution: distribution,
    };
  }
}