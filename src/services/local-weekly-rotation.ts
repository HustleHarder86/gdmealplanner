import { LocalRecipeService } from './local-recipe-service';
import { MealPlanAlgorithm } from '@/src/lib/meal-planning/meal-plan-algorithm';
import { 
  WeeklyRotationPlan, 
  RotationTrack, 
  CurrentWeekInfo,
  ROTATION_TRACKS 
} from '@/src/types/weekly-rotation';
import { MealPlan, MealPlanPreferences } from '@/src/types/meal-plan';

/**
 * Local Weekly Rotation Service
 * 
 * Generates weekly rotation plans locally without Firebase
 * Pre-generates rotation plans and serves them instantly
 */
export class LocalWeeklyRotationService {
  private static rotationLibraries: Map<RotationTrack, WeeklyRotationPlan[]> = new Map();
  private static initialized = false;

  /**
   * Initialize the rotation service with pre-generated plans
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[LOCAL_ROTATION] Initializing rotation service...');
    
    // Generate rotation plans for each track
    for (const trackConfig of ROTATION_TRACKS) {
      const plans = await this.generateRotationPlansForTrack(trackConfig.track, 8); // Generate 8 weeks
      this.rotationLibraries.set(trackConfig.track, plans);
      console.log(`[LOCAL_ROTATION] Generated ${plans.length} weeks for ${trackConfig.track} track`);
    }

    this.initialized = true;
    console.log('[LOCAL_ROTATION] Rotation service initialized');
  }

  /**
   * Get current week info for a track
   */
  static async getCurrentWeekInfo(
    userId: string = 'demo-user',
    track: RotationTrack = 'standard'
  ): Promise<CurrentWeekInfo> {
    await this.initialize();

    const plans = this.rotationLibraries.get(track) || [];
    if (plans.length === 0) {
      throw new Error(`No plans available for track: ${track}`);
    }

    // Get current week (cycle through available weeks)
    const currentWeekIndex = this.getCurrentWeekIndex() % plans.length;
    const nextWeekIndex = (currentWeekIndex + 1) % plans.length;

    const currentWeek = plans[currentWeekIndex];
    const nextWeek = plans[nextWeekIndex];

    return {
      rotationTrack: track,
      currentWeek,
      nextWeek,
      weekOfYear: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
      weekProgress: {
        current: currentWeekIndex + 1,
        total: plans.length
      }
    };
  }

  /**
   * Switch to a different track
   */
  static async switchTrack(
    userId: string,
    newTrack: RotationTrack
  ): Promise<CurrentWeekInfo> {
    return this.getCurrentWeekInfo(userId, newTrack);
  }

  /**
   * Get preview of next week
   */
  static async getNextWeekPreview(
    userId: string,
    track: RotationTrack = 'standard'
  ): Promise<WeeklyRotationPlan | null> {
    const weekInfo = await this.getCurrentWeekInfo(userId, track);
    return weekInfo.nextWeek;
  }

  /**
   * Generate rotation plans for a specific track
   */
  private static async generateRotationPlansForTrack(
    track: RotationTrack,
    weekCount: number
  ): Promise<WeeklyRotationPlan[]> {
    const plans: WeeklyRotationPlan[] = [];
    const trackConfig = ROTATION_TRACKS.find(t => t.track === track);
    
    if (!trackConfig) {
      throw new Error(`Unknown track: ${track}`);
    }

    // Create meal plan preferences based on track
    const preferences: MealPlanPreferences = {
      dietaryRestrictions: trackConfig.dietaryFilters || [],
      allergies: [],
      dislikedIngredients: [],
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
      preferredCookTime: trackConfig.preferences?.maxCookTime && 
                          trackConfig.preferences.maxCookTime <= 30 ? 'quick' : 'medium'
    };

    const usedRecipeIds = new Set<string>();

    for (let week = 1; week <= weekCount; week++) {
      try {
        const options = {
          startDate: this.getDateForWeek(week),
          daysToGenerate: 7,
          prioritizeNew: true,
          avoidRecentMeals: true,
          maxRecipeRepeats: 1
        };

        const mealPlan = await MealPlanAlgorithm.generateMealPlan(preferences, options);
        
        // Track used recipes to ensure variety
        this.trackUsedRecipes(mealPlan, usedRecipeIds);

        const rotationPlan: WeeklyRotationPlan = {
          id: `${track}-week-${week}`,
          weekNumber: week,
          rotationTrack: track,
          mealPlan,
          title: this.generateWeekTitle(week, track),
          description: this.generateWeekDescription(week, track),
          tags: this.generateWeekTags(track, mealPlan),
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };

        plans.push(rotationPlan);
      } catch (error) {
        console.error(`[LOCAL_ROTATION] Failed to generate week ${week} for ${track}:`, error);
        // Continue with other weeks
      }
    }

    return plans;
  }

  /**
   * Get current week index based on date
   */
  private static getCurrentWeekIndex(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(dayOfYear / 7);
  }

  /**
   * Get date string for a specific week
   */
  private static getDateForWeek(weekNumber: number): string {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + (weekNumber - 1) * 7);
    return startDate.toISOString().split('T')[0];
  }

  /**
   * Track used recipes for variety
   */
  private static trackUsedRecipes(mealPlan: MealPlan, usedRecipeIds: Set<string>): void {
    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        if (meal.recipeId) {
          usedRecipeIds.add(meal.recipeId);
        }
      });
    });
  }

  /**
   * Generate week title
   */
  private static generateWeekTitle(weekNumber: number, track: RotationTrack): string {
    const themes = [
      'Fresh & Light', 'Comfort Classics', 'Global Flavors', 'One-Pot Wonders',
      'Protein Power', 'Veggie Forward', 'Quick & Simple', 'Mediterranean Mix'
    ];
    
    const theme = themes[(weekNumber - 1) % themes.length];
    const trackPrefix = track === 'vegetarian' ? 'Plant-Based ' :
                       track === 'quick' ? 'Quick & Easy ' :
                       track === 'family' ? 'Family-Style ' : '';
    
    return `${trackPrefix}${theme}`;
  }

  /**
   * Generate week description
   */
  private static generateWeekDescription(weekNumber: number, track: RotationTrack): string {
    return `Week ${weekNumber}: Carefully curated meals following GD guidelines with maximum variety`;
  }

  /**
   * Generate week tags
   */
  private static generateWeekTags(track: RotationTrack, mealPlan: MealPlan): string[] {
    const tags = [track];
    
    // Analyze meal plan for additional tags
    const recipes = this.getMealPlanRecipes(mealPlan);
    const avgCookTime = recipes.reduce((sum, r) => sum + (r.totalTime || 30), 0) / recipes.length;
    
    if (avgCookTime <= 25) tags.push('quick');
    if (recipes.some(r => r.dietaryInfo?.isVegetarian)) tags.push('vegetarian-friendly');
    if (recipes.some(r => r.dietaryInfo?.isGlutenFree)) tags.push('gluten-free-options');
    
    return tags;
  }

  /**
   * Get recipes from meal plan
   */
  private static getMealPlanRecipes(mealPlan: MealPlan) {
    const recipeIds = new Set<string>();
    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        if (meal.recipeId) recipeIds.add(meal.recipeId);
      });
    });

    return Array.from(recipeIds)
      .map(id => LocalRecipeService.getRecipeById(id))
      .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null);
  }

  /**
   * Get all available tracks
   */
  static getAvailableTracks() {
    return ROTATION_TRACKS;
  }

  /**
   * Check if service is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
}