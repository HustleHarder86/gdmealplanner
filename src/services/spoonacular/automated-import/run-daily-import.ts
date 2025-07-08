#!/usr/bin/env tsx

/**
 * Daily Recipe Import Runner
 *
 * This script is designed to be run daily (e.g., via cron job) to import
 * 100 recipes according to the 20-day campaign schedule.
 *
 * Usage:
 *   npm run import:daily
 *
 * Environment variables required:
 *   - SPOONACULAR_API_KEY: Your Spoonacular API key
 *   - CAMPAIGN_START_DATE: Campaign start date (optional, defaults to today)
 *   - FIREBASE_ADMIN_KEY: Path to Firebase admin SDK key (when implemented)
 */

import { config } from "dotenv";
import { RecipeImportScheduler } from "./scheduler";
import { formatReportForDisplay } from "./reporter";
import fs from "fs/promises";
import path from "path";

// Load environment variables
config();

// Configuration
const LOGS_DIR = path.join(process.cwd(), "logs", "imports");
const REPORTS_DIR = path.join(process.cwd(), "reports", "imports");

async function ensureDirectories() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function saveReport(report: any, sessionId: string) {
  const date = new Date().toISOString().split("T")[0];
  const reportPath = path.join(REPORTS_DIR, `${date}-${sessionId}.json`);
  const reportTextPath = path.join(REPORTS_DIR, `${date}-${sessionId}.txt`);

  // Save JSON report
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Save formatted text report
  await fs.writeFile(reportTextPath, formatReportForDisplay(report));

  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`📄 Text report saved to: ${reportTextPath}`);
}

async function saveLog(
  message: string,
  level: "info" | "error" | "warn" = "info",
) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split("T")[0];
  const logPath = path.join(LOGS_DIR, `${date}.log`);

  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  await fs.appendFile(logPath, logEntry);

  // Also log to console
  if (level === "error") {
    console.error(logEntry.trim());
  } else if (level === "warn") {
    console.warn(logEntry.trim());
  } else {
    console.log(logEntry.trim());
  }
}

async function main() {
  try {
    await ensureDirectories();

    await saveLog("Starting daily recipe import", "info");

    // Check API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("SPOONACULAR_API_KEY not found in environment variables");
    }

    // Get campaign start date
    const campaignStartDate =
      process.env.CAMPAIGN_START_DATE || new Date().toISOString().split("T")[0];

    // Create scheduler
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate,
      totalDays: 20,
      dailyQuota: 100,
      minQualityScore: 50,
      maxRetries: 3,
      rateLimitDelay: 1000,
    });

    // Get campaign status
    const status = await scheduler.getCampaignStatus();
    await saveLog(
      `Campaign day ${status.currentDay}/${status.totalDays}, Phase ${status.phase}`,
      "info",
    );

    // Check if campaign is complete
    if (status.currentDay > status.totalDays) {
      await saveLog(
        "Campaign complete! All 20 days have been processed.",
        "info",
      );
      console.log("✅ Import campaign is complete!");
      return;
    }

    // Execute daily import
    console.log("\n🚀 Starting Daily Import");
    console.log("=".repeat(60));
    console.log(`Day: ${status.currentDay}/${status.totalDays}`);
    console.log(`Phase: ${status.phase}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log("=".repeat(60) + "\n");

    const report = await scheduler.executeDailyImport();

    // Save report
    await saveReport(report, report.summary.sessionId);

    // Log summary
    await saveLog(
      `Import completed: ${report.summary.recipesImported} recipes imported, ` +
        `${report.summary.recipesRejected} rejected, ` +
        `${report.summary.apiCallsUsed} API calls used`,
      report.summary.success ? "info" : "error",
    );

    // Display report
    console.log("\n" + formatReportForDisplay(report));

    // Check for issues
    if (report.summary.recipesImported < 80) {
      await saveLog(
        `Warning: Only ${report.summary.recipesImported} recipes imported (target: 100)`,
        "warn",
      );
    }

    if (report.gdCompliance.overallComplianceRate < 85) {
      await saveLog(
        `Warning: GD compliance rate is ${report.gdCompliance.overallComplianceRate}% (target: 90%+)`,
        "warn",
      );
    }

    // Send notification (placeholder for email/webhook integration)
    if (process.env.NOTIFICATION_WEBHOOK) {
      // TODO: Send webhook notification
      await saveLog("Sending notification webhook...", "info");
    }

    console.log("\n✅ Daily import completed successfully!");
  } catch (error) {
    await saveLog(
      `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`,
      "error",
    );
    console.error("\n❌ Daily import failed!");
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", async (error) => {
  await saveLog(`Unhandled rejection: ${error}`, "error");
  process.exit(1);
});

process.on("uncaughtException", async (error) => {
  await saveLog(`Uncaught exception: ${error}`, "error");
  process.exit(1);
});

// Run the import
main();
