// Main exports for meal planning module
export * from './types';
export * from './algorithm';
export * from './meal-swap';
export * from './meal-plan-service';
export * from './portion-calculator';
export * from './meal-prep-optimizer';
export * from './meal-plan-formatter';

// Re-export main classes for convenience
export { MealPlanningAlgorithm } from './algorithm';
export { MealSwapService } from './meal-swap';
export { MealPlanService } from './meal-plan-service';
export { PortionCalculator } from './portion-calculator';
export { MealPrepOptimizer } from './meal-prep-optimizer';
export { MealPlanFormatter } from './meal-plan-formatter';