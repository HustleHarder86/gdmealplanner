/**
 * Automated Recipe Import System
 * 
 * This system imports 100 GD-compliant recipes daily from Spoonacular API
 * with intelligent filtering, quality validation, and categorization.
 */

export { RecipeImportScheduler, type ImportSession, type ImportedRecipe, type ImportConfiguration } from "./scheduler";
export { type ImportStrategy, type DayStrategy, getImportStrategiesForDay, getCurrentPhase } from "./import-strategies";
export { type QualityScore, type ValidationResult, validateRecipeForImport, calculateQualityScore } from "./quality-validator";
export { RecipeDeduplicator, type DeduplicationResult, type RecipeFingerprint } from "./deduplicator";
export { RecipeCategorizer, type CategorizationResult, type CategoryFeatures } from "./categorizer";
export { generateDailyReport, generateWeeklySummary, formatReportForDisplay, type ImportReport } from "./reporter";

// Re-export commonly used configurations
export { BREAKFAST_STRATEGIES, LUNCH_STRATEGIES, DINNER_STRATEGIES, SNACK_STRATEGIES } from "./import-strategies";

/**
 * Quick start example:
 * 
 * ```typescript
 * import { RecipeImportScheduler } from './automated-import';
 * 
 * const scheduler = new RecipeImportScheduler(process.env.SPOONACULAR_API_KEY);
 * 
 * // Execute daily import
 * const report = await scheduler.executeDailyImport();
 * console.log(formatReportForDisplay(report));
 * 
 * // Or run manual import with custom strategy
 * const customStrategy = {
 *   name: "High Protein Breakfast",
 *   description: "Import high protein breakfast recipes",
 *   filters: {
 *     query: "breakfast eggs protein",
 *     minProtein: 20,
 *     maxCarbs: 30,
 *     maxReadyTime: 20,
 *   },
 *   targetCount: 20,
 *   priority: 1,
 * };
 * 
 * const manualReport = await scheduler.manualImport(customStrategy, 20);
 * ```
 */