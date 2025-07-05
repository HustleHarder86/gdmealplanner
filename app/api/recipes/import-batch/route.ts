import { NextRequest, NextResponse } from "next/server";
import { RecipeImportScheduler } from "@/src/services/spoonacular/automated-import/scheduler";
import { initializeFirebaseAdmin } from "@/src/lib/firebase/admin";
import { BREAKFAST_STRATEGIES, LUNCH_STRATEGIES, DINNER_STRATEGIES, SNACK_STRATEGIES } from "@/src/services/spoonacular/automated-import/import-strategies";

export async function POST(request: NextRequest) {
  try {
    // In development, allow imports without auth
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // Parse request body
    const body = await request.json();
    const { 
      category = "breakfast", 
      count = 5,
      strategyIndex = 0,
    } = body;

    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Create scheduler
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate: new Date().toISOString().split('T')[0],
      dailyQuota: count,
      minQualityScore: 50,
      rateLimitDelay: 2000, // 2 seconds between API calls
    });

    // Select strategy based on category
    let strategies;
    switch (category) {
      case "breakfast":
        strategies = BREAKFAST_STRATEGIES;
        break;
      case "lunch":
        strategies = LUNCH_STRATEGIES;
        break;
      case "dinner":
        strategies = DINNER_STRATEGIES;
        break;
      case "snack":
        strategies = SNACK_STRATEGIES;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid category. Use: breakfast, lunch, dinner, or snack" },
          { status: 400 }
        );
    }

    // Check strategy index
    if (strategyIndex >= strategies.length) {
      return NextResponse.json(
        { error: `Invalid strategy index. Maximum for ${category} is ${strategies.length - 1}` },
        { status: 400 }
      );
    }

    // Get selected strategy
    const selectedStrategy = {
      ...strategies[strategyIndex],
      targetCount: count,
    };

    console.log(`Starting import: ${category} - ${selectedStrategy.name}`);

    // Execute import
    const report = await scheduler.manualImport(selectedStrategy, count);

    // Get current library stats
    const status = await scheduler.getCampaignStatus();

    // Extract category counts from the report
    const categoryBreakdown: Record<string, number> = {};
    report.categoryBreakdown.forEach(cat => {
      categoryBreakdown[cat.category] = cat.count;
    });

    // Extract quality distribution
    const qualityDistribution: Record<string, number> = {};
    report.qualityMetrics.scoreDistribution.forEach(dist => {
      qualityDistribution[dist.range] = dist.count;
    });

    return NextResponse.json({
      success: true,
      import: {
        strategy: selectedStrategy.name,
        category,
        imported: report.summary.recipesImported,
        processed: report.summary.recipesProcessed,
        rejected: report.summary.recipesRejected,
        apiCalls: report.summary.apiCallsUsed,
        errors: report.errors,
        categoryBreakdown,
        qualityDistribution,
      },
      library: {
        total: status.totalRecipesImported,
        breakdown: status.categoryBreakdown,
      },
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { 
        error: "Import failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check import status
export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Create scheduler just to get status
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 }
      );
    }

    const scheduler = new RecipeImportScheduler(apiKey);
    const status = await scheduler.getCampaignStatus();

    // Get available strategies
    const strategies = {
      breakfast: BREAKFAST_STRATEGIES.map((s, i) => ({ index: i, name: s.name, description: s.description })),
      lunch: LUNCH_STRATEGIES.map((s, i) => ({ index: i, name: s.name, description: s.description })),
      dinner: DINNER_STRATEGIES.map((s, i) => ({ index: i, name: s.name, description: s.description })),
      snack: SNACK_STRATEGIES.map((s, i) => ({ index: i, name: s.name, description: s.description })),
    };

    return NextResponse.json({
      library: {
        total: status.totalRecipesImported,
        breakdown: status.categoryBreakdown,
        targetTotal: 600,
        percentComplete: Math.round((status.totalRecipesImported / 600) * 100),
      },
      availableStrategies: strategies,
      usage: {
        endpoint: "/api/recipes/import-batch",
        method: "POST",
        body: {
          category: "breakfast|lunch|dinner|snack",
          count: "number of recipes to import (default: 5)",
          strategyIndex: "index of strategy to use (default: 0)",
        },
      },
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}