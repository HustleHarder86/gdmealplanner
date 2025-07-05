import { ImportSession, ImportedRecipe } from "./scheduler";
import { GD_REQUIREMENTS } from "../validators";

/**
 * Reporting Service for Automated Recipe Import
 * Generates comprehensive reports on import sessions
 */

export interface ImportReport {
  summary: {
    sessionId: string;
    date: string;
    dayNumber: number;
    phase: 1 | 2 | 3;
    duration: number; // minutes
    success: boolean;
    recipesImported: number;
    recipesProcessed: number;
    recipesRejected: number;
    rejectionRate: number;
    apiCallsUsed: number;
    apiEfficiency: number; // recipes per API call
  };
  categoryBreakdown: {
    category: keyof typeof GD_REQUIREMENTS;
    count: number;
    percentage: number;
    averageQualityScore: number;
  }[];
  qualityMetrics: {
    averageScore: number;
    scoreDistribution: {
      range: string;
      count: number;
    }[];
    topRecipes: {
      title: string;
      category: string;
      score: number;
    }[];
    lowQualityRecipes: {
      title: string;
      category: string;
      score: number;
      warnings: string[];
    }[];
  };
  gdCompliance: {
    overallComplianceRate: number;
    categoryCompliance: Record<keyof typeof GD_REQUIREMENTS, number>;
    commonWarnings: {
      warning: string;
      count: number;
    }[];
  };
  deduplication: {
    duplicatesFound: number;
    duplicateTypes: {
      exact: number;
      similar: number;
      variant: number;
    };
  };
  errors: string[];
  recommendations: string[];
}

/**
 * Generate daily import report
 */
export async function generateDailyReport(
  session: ImportSession,
  importedRecipes: ImportedRecipe[]
): Promise<ImportReport> {
  const duration = session.endTime
    ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    : 0;

  const rejectionRate = session.recipesProcessed > 0
    ? (session.recipesRejected / session.recipesProcessed) * 100
    : 0;

  const apiEfficiency = session.apiCallsUsed > 0
    ? session.recipesImported / session.apiCallsUsed
    : 0;

  // Generate category breakdown
  const categoryBreakdown = generateCategoryBreakdown(importedRecipes);

  // Generate quality metrics
  const qualityMetrics = generateQualityMetrics(importedRecipes);

  // Generate GD compliance metrics
  const gdCompliance = generateGDComplianceMetrics(importedRecipes);

  // Generate deduplication metrics (would need access to rejected recipes in real implementation)
  const deduplication = {
    duplicatesFound: 0,
    duplicateTypes: {
      exact: 0,
      similar: 0,
      variant: 0,
    },
  };

  // Generate recommendations
  const recommendations = generateRecommendations(
    session,
    importedRecipes,
    categoryBreakdown,
    qualityMetrics,
    gdCompliance
  );

  return {
    summary: {
      sessionId: session.sessionId,
      date: session.date,
      dayNumber: session.dayNumber,
      phase: session.phase,
      duration: Math.round(duration),
      success: session.status === "completed",
      recipesImported: session.recipesImported,
      recipesProcessed: session.recipesProcessed,
      recipesRejected: session.recipesRejected,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      apiCallsUsed: session.apiCallsUsed,
      apiEfficiency: Math.round(apiEfficiency * 100) / 100,
    },
    categoryBreakdown,
    qualityMetrics,
    gdCompliance,
    deduplication,
    errors: session.errors,
    recommendations,
  };
}

/**
 * Generate category breakdown
 */
function generateCategoryBreakdown(
  recipes: ImportedRecipe[]
): ImportReport["categoryBreakdown"] {
  const categoryMap = new Map<keyof typeof GD_REQUIREMENTS, { count: number; totalScore: number }>();

  // Initialize categories
  for (const category of Object.keys(GD_REQUIREMENTS) as Array<keyof typeof GD_REQUIREMENTS>) {
    categoryMap.set(category, { count: 0, totalScore: 0 });
  }

  // Count recipes and sum scores
  for (const recipe of recipes) {
    const category = recipe.categorization.primaryCategory;
    const current = categoryMap.get(category)!;
    current.count++;
    current.totalScore += recipe.validation.qualityScore.totalScore;
  }

  // Convert to array format
  const breakdown: ImportReport["categoryBreakdown"] = [];
  const total = recipes.length;

  for (const [category, data] of categoryMap) {
    if (data.count > 0) {
      breakdown.push({
        category,
        count: data.count,
        percentage: Math.round((data.count / total) * 1000) / 10,
        averageQualityScore: Math.round(data.totalScore / data.count),
      });
    }
  }

  // Sort by count descending
  breakdown.sort((a, b) => b.count - a.count);

  return breakdown;
}

/**
 * Generate quality metrics
 */
function generateQualityMetrics(recipes: ImportedRecipe[]): ImportReport["qualityMetrics"] {
  const scores = recipes.map((r) => r.validation.qualityScore.totalScore);
  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  // Score distribution
  const distribution = [
    { range: "90-100", count: 0 },
    { range: "80-89", count: 0 },
    { range: "70-79", count: 0 },
    { range: "60-69", count: 0 },
    { range: "50-59", count: 0 },
    { range: "Below 50", count: 0 },
  ];

  for (const score of scores) {
    if (score >= 90) distribution[0].count++;
    else if (score >= 80) distribution[1].count++;
    else if (score >= 70) distribution[2].count++;
    else if (score >= 60) distribution[3].count++;
    else if (score >= 50) distribution[4].count++;
    else distribution[5].count++;
  }

  // Top recipes
  const sortedByScore = [...recipes].sort(
    (a, b) => b.validation.qualityScore.totalScore - a.validation.qualityScore.totalScore
  );

  const topRecipes = sortedByScore.slice(0, 5).map((r) => ({
    title: r.spoonacularData.title,
    category: r.categorization.primaryCategory,
    score: r.validation.qualityScore.totalScore,
  }));

  // Low quality recipes (if any passed the threshold)
  const lowQualityRecipes = sortedByScore
    .slice(-5)
    .filter((r) => r.validation.qualityScore.totalScore < 70)
    .map((r) => ({
      title: r.spoonacularData.title,
      category: r.categorization.primaryCategory,
      score: r.validation.qualityScore.totalScore,
      warnings: r.validation.qualityScore.warnings,
    }));

  return {
    averageScore: Math.round(averageScore),
    scoreDistribution: distribution,
    topRecipes,
    lowQualityRecipes,
  };
}

/**
 * Generate GD compliance metrics
 */
function generateGDComplianceMetrics(
  recipes: ImportedRecipe[]
): ImportReport["gdCompliance"] {
  let totalCompliant = 0;
  const categoryCompliance: Record<string, { compliant: number; total: number }> = {};
  const warningCounts = new Map<string, number>();

  // Initialize category compliance
  for (const category of Object.keys(GD_REQUIREMENTS)) {
    categoryCompliance[category] = { compliant: 0, total: 0 };
  }

  // Process each recipe
  for (const recipe of recipes) {
    const category = recipe.categorization.primaryCategory;
    const validation = recipe.validation.gdValidation;

    categoryCompliance[category].total++;

    if (validation.isValid) {
      totalCompliant++;
      categoryCompliance[category].compliant++;
    }

    // Count warnings
    for (const warning of validation.warnings) {
      warningCounts.set(warning, (warningCounts.get(warning) || 0) + 1);
    }
  }

  // Calculate compliance rates
  const overallComplianceRate = recipes.length > 0
    ? (totalCompliant / recipes.length) * 100
    : 0;

  const categoryComplianceRates: Record<keyof typeof GD_REQUIREMENTS, number> = {} as any;
  for (const [category, data] of Object.entries(categoryCompliance)) {
    categoryComplianceRates[category as keyof typeof GD_REQUIREMENTS] =
      data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0;
  }

  // Sort warnings by frequency
  const commonWarnings = Array.from(warningCounts.entries())
    .map(([warning, count]) => ({ warning, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    overallComplianceRate: Math.round(overallComplianceRate),
    categoryCompliance: categoryComplianceRates,
    commonWarnings,
  };
}

/**
 * Generate recommendations based on report data
 */
function generateRecommendations(
  session: ImportSession,
  recipes: ImportedRecipe[],
  categoryBreakdown: ImportReport["categoryBreakdown"],
  qualityMetrics: ImportReport["qualityMetrics"],
  gdCompliance: ImportReport["gdCompliance"]
): string[] {
  const recommendations: string[] = [];

  // Check if daily quota was met
  if (session.recipesImported < 100) {
    recommendations.push(
      `Only ${session.recipesImported} recipes imported. Consider adjusting filters to be less restrictive.`
    );
  }

  // Check rejection rate
  if (session.recipesRejected > session.recipesImported) {
    recommendations.push(
      "High rejection rate detected. Review quality thresholds and deduplication settings."
    );
  }

  // Check category balance
  const underrepresented = categoryBreakdown.filter((cat) => cat.percentage < 15);
  if (underrepresented.length > 0) {
    recommendations.push(
      `Categories underrepresented: ${underrepresented.map((c) => c.category).join(", ")}. Adjust import schedule.`
    );
  }

  // Check quality scores
  if (qualityMetrics.averageScore < 70) {
    recommendations.push(
      "Average quality score is below 70. Consider adjusting search parameters for higher quality recipes."
    );
  }

  // Check GD compliance
  if (gdCompliance.overallComplianceRate < 90) {
    recommendations.push(
      `GD compliance rate is ${gdCompliance.overallComplianceRate}%. Review and adjust nutrition filters.`
    );
  }

  // Check for common warnings
  const topWarning = gdCompliance.commonWarnings[0];
  if (topWarning && topWarning.count > recipes.length * 0.3) {
    recommendations.push(
      `"${topWarning.warning}" appears in ${Math.round((topWarning.count / recipes.length) * 100)}% of recipes. Address this issue in filters.`
    );
  }

  // Phase-specific recommendations
  switch (session.phase) {
    case 1:
      if (session.dayNumber >= 8) {
        recommendations.push("Consider transitioning more aggressively to Phase 2 dietary variations.");
      }
      break;
    case 2:
      recommendations.push("Ensure good coverage of vegetarian, vegan, and gluten-free options.");
      break;
    case 3:
      recommendations.push("Focus on seasonal recipes and international cuisines for variety.");
      break;
  }

  // API efficiency
  if (session.apiCallsUsed > session.recipesImported * 3) {
    recommendations.push(
      "Low API efficiency. Consider batch operations or adjusting filters to reduce API calls."
    );
  }

  return recommendations;
}

/**
 * Generate weekly summary report
 */
export async function generateWeeklySummary(
  dailyReports: ImportReport[]
): Promise<{
  weekNumber: number;
  totalRecipesImported: number;
  categoryDistribution: Record<string, number>;
  averageQualityScore: number;
  averageComplianceRate: number;
  totalApiCalls: number;
  recommendations: string[];
}> {
  const weekNumber = Math.ceil(dailyReports[0].summary.dayNumber / 7);
  let totalRecipes = 0;
  let totalQualityScore = 0;
  let totalComplianceRate = 0;
  let totalApiCalls = 0;
  const categoryTotals: Record<string, number> = {};

  for (const report of dailyReports) {
    totalRecipes += report.summary.recipesImported;
    totalApiCalls += report.summary.apiCallsUsed;
    totalQualityScore += report.qualityMetrics.averageScore * report.summary.recipesImported;
    totalComplianceRate += report.gdCompliance.overallComplianceRate;

    for (const category of report.categoryBreakdown) {
      categoryTotals[category.category] = (categoryTotals[category.category] || 0) + category.count;
    }
  }

  const averageQualityScore = totalRecipes > 0 ? totalQualityScore / totalRecipes : 0;
  const averageComplianceRate = dailyReports.length > 0
    ? totalComplianceRate / dailyReports.length
    : 0;

  const recommendations: string[] = [];

  // Check weekly progress
  const expectedRecipes = weekNumber <= 2 ? 700 : 500;
  if (totalRecipes < expectedRecipes * 0.9) {
    recommendations.push(
      `Week ${weekNumber}: Only ${totalRecipes} recipes imported (expected ~${expectedRecipes}). Increase daily imports.`
    );
  }

  // Check category balance
  const totalByCategory = Object.values(categoryTotals).reduce((sum, count) => sum + count, 0);
  for (const [category, count] of Object.entries(categoryTotals)) {
    const percentage = (count / totalByCategory) * 100;
    if (percentage < 20 && category !== "snack") {
      recommendations.push(`${category} recipes are underrepresented (${Math.round(percentage)}%).`);
    }
  }

  return {
    weekNumber,
    totalRecipesImported: totalRecipes,
    categoryDistribution: categoryTotals,
    averageQualityScore: Math.round(averageQualityScore),
    averageComplianceRate: Math.round(averageComplianceRate),
    totalApiCalls,
    recommendations,
  };
}

/**
 * Format report for display/email
 */
export function formatReportForDisplay(report: ImportReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("DAILY RECIPE IMPORT REPORT");
  lines.push("=".repeat(60));
  lines.push("");

  // Summary
  lines.push("SUMMARY");
  lines.push("-".repeat(30));
  lines.push(`Date: ${report.summary.date}`);
  lines.push(`Day: ${report.summary.dayNumber} (Phase ${report.summary.phase})`);
  lines.push(`Duration: ${report.summary.duration} minutes`);
  lines.push(`Status: ${report.summary.success ? "✓ SUCCESS" : "✗ FAILED"}`);
  lines.push("");
  lines.push(`Recipes Imported: ${report.summary.recipesImported}`);
  lines.push(`Recipes Processed: ${report.summary.recipesProcessed}`);
  lines.push(`Recipes Rejected: ${report.summary.recipesRejected} (${report.summary.rejectionRate}%)`);
  lines.push(`API Calls Used: ${report.summary.apiCallsUsed}`);
  lines.push(`API Efficiency: ${report.summary.apiEfficiency} recipes/call`);
  lines.push("");

  // Category breakdown
  lines.push("CATEGORY BREAKDOWN");
  lines.push("-".repeat(30));
  for (const category of report.categoryBreakdown) {
    lines.push(
      `${category.category}: ${category.count} (${category.percentage}%) - Avg Score: ${category.averageQualityScore}`
    );
  }
  lines.push("");

  // Quality metrics
  lines.push("QUALITY METRICS");
  lines.push("-".repeat(30));
  lines.push(`Average Quality Score: ${report.qualityMetrics.averageScore}`);
  lines.push("Score Distribution:");
  for (const range of report.qualityMetrics.scoreDistribution) {
    if (range.count > 0) {
      lines.push(`  ${range.range}: ${range.count}`);
    }
  }
  lines.push("");

  // GD Compliance
  lines.push("GD COMPLIANCE");
  lines.push("-".repeat(30));
  lines.push(`Overall Compliance Rate: ${report.gdCompliance.overallComplianceRate}%`);
  lines.push("Category Compliance:");
  for (const [category, rate] of Object.entries(report.gdCompliance.categoryCompliance)) {
    lines.push(`  ${category}: ${rate}%`);
  }
  lines.push("");

  // Top recipes
  if (report.qualityMetrics.topRecipes.length > 0) {
    lines.push("TOP RECIPES");
    lines.push("-".repeat(30));
    for (const recipe of report.qualityMetrics.topRecipes) {
      lines.push(`${recipe.title} (${recipe.category}) - Score: ${recipe.score}`);
    }
    lines.push("");
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push("RECOMMENDATIONS");
    lines.push("-".repeat(30));
    for (const rec of report.recommendations) {
      lines.push(`• ${rec}`);
    }
    lines.push("");
  }

  // Errors
  if (report.errors.length > 0) {
    lines.push("ERRORS");
    lines.push("-".repeat(30));
    for (const error of report.errors) {
      lines.push(`✗ ${error}`);
    }
    lines.push("");
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}