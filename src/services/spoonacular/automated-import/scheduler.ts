import { SpoonacularClient } from "../client";
import { SpoonacularRecipeInfo } from "../types";
import { getImportStrategiesForDay, getCurrentPhase, ImportStrategy } from "./import-strategies";
import { validateRecipeForImport, ValidationResult } from "./quality-validator";
import { RecipeDeduplicator, DeduplicationResult } from "./deduplicator";
import { RecipeCategorizer, CategorizationResult } from "./categorizer";
import { generateDailyReport, ImportReport } from "./reporter";
import { RecipeModel } from "../../../lib/firebase/models/recipe";
import { transformSpoonacularRecipe } from "../transformers";
import { Recipe } from "../../../types/recipe";

/**
 * Daily Import Scheduler for Automated Recipe Import
 * Orchestrates the entire import process according to the 20-day campaign
 */

export interface ImportSession {
  sessionId: string;
  date: string;
  dayNumber: number;
  dayOfCycle: number;
  phase: 1 | 2 | 3;
  startTime: Date;
  endTime?: Date;
  status: "pending" | "running" | "completed" | "failed";
  recipesImported: number;
  recipesProcessed: number;
  recipesRejected: number;
  apiCallsUsed: number;
  errors: string[];
}

export interface ImportedRecipe {
  spoonacularId: number;
  spoonacularData: SpoonacularRecipeInfo;
  validation: ValidationResult;
  categorization: CategorizationResult;
  importMetadata: {
    sessionId: string;
    importDate: string;
    strategy: string;
    qualityScore: number;
    apiCall: number;
  };
}

export interface ImportConfiguration {
  campaignStartDate: string;
  totalDays: number;
  dailyQuota: number;
  minQualityScore: number;
  maxRetries: number;
  rateLimitDelay: number; // milliseconds between API calls
}

export class RecipeImportScheduler {
  private client: SpoonacularClient;
  private deduplicator: RecipeDeduplicator;
  private categorizer: RecipeCategorizer;
  private config: ImportConfiguration;
  private currentSession: ImportSession | null = null;

  constructor(
    apiKey: string,
    config: Partial<ImportConfiguration> = {}
  ) {
    this.client = new SpoonacularClient(apiKey);
    this.deduplicator = new RecipeDeduplicator();
    this.categorizer = new RecipeCategorizer();
    
    this.config = {
      campaignStartDate: config.campaignStartDate || new Date().toISOString().split('T')[0],
      totalDays: config.totalDays || 20,
      dailyQuota: config.dailyQuota || 100,
      minQualityScore: config.minQualityScore || 50,
      maxRetries: config.maxRetries || 3,
      rateLimitDelay: config.rateLimitDelay || 1000,
    };
  }

  /**
   * Execute daily import based on current campaign day
   */
  async executeDailyImport(): Promise<ImportReport> {
    try {
      // Initialize session
      const session = await this.initializeSession();
      this.currentSession = session;

      console.log(`Starting import session ${session.sessionId} for day ${session.dayNumber}`);

      // Load existing recipes for deduplication
      await this.loadExistingRecipes();

      // Get strategies for today
      const dayStrategy = getImportStrategiesForDay(session.dayOfCycle);
      const phase = getCurrentPhase(session.dayNumber);

      console.log(`Day ${session.dayNumber}: ${dayStrategy.category} focus (${dayStrategy.strategies.length} strategies)`);

      // Execute import strategies
      const importedRecipes: ImportedRecipe[] = [];
      let totalApiCalls = 0;

      for (const strategy of dayStrategy.strategies) {
        if (importedRecipes.length >= this.config.dailyQuota) {
          break;
        }

        const remaining = this.config.dailyQuota - importedRecipes.length;
        const strategyResults = await this.executeStrategy(strategy, remaining, phase);
        
        importedRecipes.push(...strategyResults.recipes);
        totalApiCalls += strategyResults.apiCalls;

        // Update session stats
        session.recipesProcessed += strategyResults.processed;
        session.recipesRejected += strategyResults.rejected;
        session.apiCallsUsed = totalApiCalls;
      }

      // Store imported recipes
      await this.storeImportedRecipes(importedRecipes);

      // Complete session
      session.endTime = new Date();
      session.status = "completed";
      session.recipesImported = importedRecipes.length;

      // Generate report
      const report = await generateDailyReport(session, importedRecipes);

      console.log(`Import session completed: ${importedRecipes.length} recipes imported`);

      return report;

    } catch (error) {
      console.error("Import session failed:", error);
      
      if (this.currentSession) {
        this.currentSession.status = "failed";
        this.currentSession.errors.push(error instanceof Error ? error.message : "Unknown error");
      }

      throw error;
    }
  }

  /**
   * Initialize import session
   */
  private async initializeSession(): Promise<ImportSession> {
    const today = new Date();
    const campaignStart = new Date(this.config.campaignStartDate);
    const daysSinceStart = Math.floor((today.getTime() - campaignStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayNumber = daysSinceStart + 1;
    const dayOfCycle = ((dayNumber - 1) % 7) + 1;
    const phase = getCurrentPhase(dayNumber);

    return {
      sessionId: `import-${today.toISOString().split('T')[0]}-${Date.now()}`,
      date: today.toISOString().split('T')[0],
      dayNumber,
      dayOfCycle,
      phase,
      startTime: new Date(),
      status: "running",
      recipesImported: 0,
      recipesProcessed: 0,
      recipesRejected: 0,
      apiCallsUsed: 0,
      errors: [],
    };
  }

  /**
   * Load existing recipes for deduplication
   */
  private async loadExistingRecipes(): Promise<void> {
    console.log("Loading existing recipes for deduplication...");
    
    try {
      // Get all existing recipe IDs from Firebase
      const existingRecipeIds = await RecipeModel.getAllIds();
      
      // Load a sample of recipes for content-based deduplication
      // We'll load recipes from each category to ensure good coverage
      const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      for (const category of categories) {
        const categoryRecipes = await RecipeModel.getByCategory(category, 50);
        
        // Add to deduplicator
        for (const recipe of categoryRecipes) {
          // Convert our Recipe format back to a minimal format for deduplication
          const minimalRecipe = {
            id: parseInt(recipe.id.replace('sp-', '')),
            title: recipe.title,
            nutrition: {
              nutrients: [
                { name: 'Carbohydrates', amount: recipe.nutrition.carbohydrates, unit: 'g' },
                { name: 'Protein', amount: recipe.nutrition.protein, unit: 'g' },
                { name: 'Fat', amount: recipe.nutrition.fat, unit: 'g' }
              ]
            },
            extendedIngredients: recipe.ingredients.map((ing: any) => ({
              name: ing.name,
              original: ing.original
            }))
          };
          
          this.deduplicator.addRecipe(recipe.id, minimalRecipe as any);
        }
      }
      
      console.log(`Loaded ${existingRecipeIds.length} existing recipes for deduplication`);
      
    } catch (error) {
      console.error("Error loading existing recipes:", error);
      // Continue with import even if loading fails
    }
  }

  /**
   * Execute a single import strategy
   */
  private async executeStrategy(
    strategy: ImportStrategy,
    remainingQuota: number,
    phase: 1 | 2 | 3
  ): Promise<{
    recipes: ImportedRecipe[];
    apiCalls: number;
    processed: number;
    rejected: number;
  }> {
    console.log(`Executing strategy: ${strategy.name}`);
    
    const recipes: ImportedRecipe[] = [];
    let apiCalls = 0;
    let processed = 0;
    let rejected = 0;
    let offset = 0;
    let retries = 0;

    while (recipes.length < Math.min(strategy.targetCount, remainingQuota)) {
      try {
        // Apply phase-specific modifications
        const modifiedStrategy = this.applyPhaseModifications(strategy, phase);

        // Make API call
        await this.rateLimitDelay();
        const searchParams = {
          ...modifiedStrategy.filters,
          offset,
        };

        console.log(`API call ${apiCalls + 1}: offset=${offset}`);
        const response = await this.client.searchRecipes(searchParams);
        apiCalls++;

        if (!response.results || response.results.length === 0) {
          console.log("No more results for this strategy");
          break;
        }

        // Process each recipe
        for (const searchResult of response.results) {
          if (recipes.length >= Math.min(strategy.targetCount, remainingQuota)) {
            break;
          }

          processed++;

          // Get full recipe details
          await this.rateLimitDelay();
          const fullRecipe = await this.client.getRecipeInfo(searchResult.id);
          apiCalls++;

          // Check for duplicates
          const duplicationResult = this.deduplicator.checkDuplicate(fullRecipe);
          if (duplicationResult.isDuplicate) {
            rejected++;
            console.log(`Duplicate detected: ${fullRecipe.title} (${duplicationResult.reason})`);
            continue;
          }

          // Validate recipe
          const validation = validateRecipeForImport(fullRecipe);
          if (!validation.isValid) {
            rejected++;
            console.log(`Recipe rejected: ${fullRecipe.title} - ${validation.rejectionReasons?.join(", ")}`);
            continue;
          }

          // Check quality threshold
          if (validation.qualityScore.totalScore < this.config.minQualityScore) {
            rejected++;
            console.log(`Quality too low: ${fullRecipe.title} (${validation.qualityScore.totalScore})`);
            continue;
          }

          // Categorize recipe
          const categorization = this.categorizer.categorizeRecipe(fullRecipe);

          // Create imported recipe record
          const importedRecipe: ImportedRecipe = {
            spoonacularId: fullRecipe.id,
            spoonacularData: fullRecipe,
            validation,
            categorization,
            importMetadata: {
              sessionId: this.currentSession!.sessionId,
              importDate: new Date().toISOString(),
              strategy: strategy.name,
              qualityScore: validation.qualityScore.totalScore,
              apiCall: apiCalls,
            },
          };

          recipes.push(importedRecipe);
          
          // Add to deduplicator
          this.deduplicator.addRecipe(`sp-${fullRecipe.id}`, fullRecipe);

          console.log(`✓ Imported: ${fullRecipe.title} (${categorization.primaryCategory}, score: ${validation.qualityScore.totalScore})`);
        }

        // Move to next page
        offset += response.number;

        // Reset retries on success
        retries = 0;

      } catch (error) {
        console.error(`Strategy execution error:`, error);
        retries++;

        if (retries >= this.config.maxRetries) {
          console.error(`Max retries reached for strategy ${strategy.name}`);
          break;
        }

        // Wait before retry
        await this.delay(5000 * retries);
      }
    }

    console.log(`Strategy completed: ${recipes.length} recipes imported, ${rejected} rejected`);

    return {
      recipes,
      apiCalls,
      processed,
      rejected,
    };
  }

  /**
   * Apply phase-specific modifications to strategy
   */
  private applyPhaseModifications(strategy: ImportStrategy, phase: 1 | 2 | 3): ImportStrategy {
    const modified = { ...strategy };

    switch (phase) {
      case 1:
        // Phase 1: Focus on popular recipes
        modified.filters = {
          ...modified.filters,
          sort: "popularity",
          sortDirection: "desc",
        };
        break;

      case 2:
        // Phase 2: Add dietary variations
        // This would be more sophisticated in practice
        if (Math.random() > 0.5) {
          modified.filters = {
            ...modified.filters,
            diet: Math.random() > 0.5 ? "vegetarian" : "gluten free",
          };
        }
        break;

      case 3:
        // Phase 3: More variety
        modified.filters = {
          ...modified.filters,
          sort: "random",
        };
        break;
    }

    return modified;
  }

  /**
   * Store imported recipes in Firebase
   */
  private async storeImportedRecipes(recipes: ImportedRecipe[]): Promise<void> {
    console.log(`Storing ${recipes.length} recipes in database...`);

    try {
      // Transform and batch save recipes
      const recipesToSave: Recipe[] = [];
      
      for (const importedRecipe of recipes) {
        // Transform Spoonacular recipe to our Recipe format
        const recipe = transformSpoonacularRecipe(
          importedRecipe.spoonacularData,
          importedRecipe.categorization.primaryCategory as Recipe['category']
        );
        
        // Enrich with import metadata and validation results
        const enrichedRecipe: Recipe = {
          ...recipe,
          category: importedRecipe.categorization.primaryCategory as Recipe['category'],
          tags: importedRecipe.categorization.tags,
          gdValidation: {
            isValid: importedRecipe.validation.isValid,
            score: importedRecipe.validation.qualityScore.totalScore,
            details: importedRecipe.validation.qualityScore,
            warnings: importedRecipe.validation.rejectionReasons || []
          },
          importedFrom: 'spoonacular',
          importedAt: importedRecipe.importMetadata.importDate,
          verified: false,
          popularity: 0,
          userRatings: [],
          timesViewed: 0,
          timesAddedToPlan: 0
        };
        
        recipesToSave.push(enrichedRecipe);
      }
      
      // Batch save to Firebase
      await RecipeModel.batchSave(recipesToSave);
      
      // Log summary
      const categoryCounts = recipes.reduce((acc, recipe) => {
        const category = recipe.categorization.primaryCategory;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("✅ Successfully stored recipes by category:", categoryCounts);
      
    } catch (error) {
      console.error("❌ Error storing recipes in Firebase:", error);
      throw new Error(`Failed to store recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rate limiting delay
   */
  private async rateLimitDelay(): Promise<void> {
    await this.delay(this.config.rateLimitDelay);
  }

  /**
   * Simple delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current campaign status
   */
  async getCampaignStatus(): Promise<{
    currentDay: number;
    totalDays: number;
    phase: 1 | 2 | 3;
    nextImportTime: string;
    totalRecipesImported: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const today = new Date();
    const campaignStart = new Date(this.config.campaignStartDate);
    const daysSinceStart = Math.floor((today.getTime() - campaignStart.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = daysSinceStart + 1;

    // Get actual stats from Firebase
    let totalRecipesImported = 0;
    let categoryBreakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    
    try {
      totalRecipesImported = await RecipeModel.getCount();
      categoryBreakdown = await RecipeModel.getCountByCategory() as any;
    } catch (error) {
      console.error("Error getting campaign stats from Firebase:", error);
    }

    return {
      currentDay,
      totalDays: this.config.totalDays,
      phase: getCurrentPhase(currentDay),
      nextImportTime: "02:00 AM",
      totalRecipesImported,
      categoryBreakdown,
    };
  }

  /**
   * Manual import with custom filters
   */
  async manualImport(
    strategy: ImportStrategy,
    limit: number = 20
  ): Promise<ImportReport> {
    const session = await this.initializeSession();
    session.sessionId = `manual-${Date.now()}`;
    this.currentSession = session;

    await this.loadExistingRecipes();

    const results = await this.executeStrategy(strategy, limit, 1);

    session.endTime = new Date();
    session.status = "completed";
    session.recipesImported = results.recipes.length;
    session.recipesProcessed = results.processed;
    session.recipesRejected = results.rejected;
    session.apiCallsUsed = results.apiCalls;

    await this.storeImportedRecipes(results.recipes);

    return generateDailyReport(session, results.recipes);
  }
}