import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

// Configure visual regression settings
test.use({
  // Threshold for pixel differences (0-1, where 0 is identical)
  // @ts-ignore
  toHaveScreenshot: { threshold: 0.2 },
});

test.describe('Visual Regression Tests', () => {
  test('Dietary preferences UI components', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Test 1: Initial state
    await expect(page).toHaveScreenshot('dietary-preferences-collapsed.png', {
      fullPage: false,
      clip: {
        x: 0,
        y: 100,
        width: 1200,
        height: 200
      }
    });

    // Test 2: Expanded state
    await page.locator('button:has-text("Dietary Preferences")').click();
    await page.waitForTimeout(500); // Wait for animation
    
    await expect(page).toHaveScreenshot('dietary-preferences-expanded.png', {
      fullPage: false,
      clip: {
        x: 0,
        y: 100,
        width: 1200,
        height: 600
      }
    });

    // Test 3: With selections
    await page.locator('label:has-text("Vegetarian")').click();
    await page.locator('label:has-text("Gluten-Free")').click();
    
    const dislikeInput = page.locator('input[placeholder*="mushrooms"]');
    await dislikeInput.fill('mushrooms');
    await dislikeInput.press('Enter');
    
    await expect(page).toHaveScreenshot('dietary-preferences-with-selections.png', {
      fullPage: false,
      clip: {
        x: 0,
        y: 100,
        width: 1200,
        height: 600
      }
    });
  });

  test('Meal plan layouts', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Generate a meal plan
    await page.locator('button:has-text("Generate Meal Plan")').click();
    await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
    await page.waitForTimeout(1000); // Let animations settle

    // Test different viewport sizes
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`meal-plan-${viewport.name}.png`, {
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: viewport.width,
          height: Math.min(viewport.height, 800)
        }
      });
    }
  });

  test('Shopping list view', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Generate a meal plan first
    await page.locator('button:has-text("Generate Meal Plan")').click();
    await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
    
    // Switch to shopping list
    await page.locator('button:has-text("Shopping List")').click();
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('shopping-list-view.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('Error states and edge cases', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Select all restrictions to potentially trigger an error
    await page.locator('button:has-text("Dietary Preferences")').click();
    
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click();
    }
    
    await page.locator('button:has-text("Generate Meal Plan")').click();
    
    // Wait for either success or error state
    await page.waitForTimeout(3000);
    
    await expect(page).toHaveScreenshot('extreme-restrictions-state.png', {
      fullPage: true
    });
  });
});

// Helper to generate visual diff report
test.afterAll(async () => {
  const reportPath = 'tests/e2e/reports/visual-regression-report.md';
  const report = `# Visual Regression Test Report

Generated on: ${new Date().toISOString()}

## Overview

Visual regression tests help ensure UI consistency across changes. These tests capture screenshots of key UI states and compare them against baseline images.

## Test Coverage

1. **Dietary Preferences UI**
   - Collapsed state
   - Expanded state
   - With selections

2. **Meal Plan Layouts**
   - Desktop view (1920x1080)
   - Tablet view (768x1024)
   - Mobile view (375x667)

3. **Shopping List View**
   - Full shopping list layout

4. **Error States**
   - Extreme restrictions scenario

## How to Update Baselines

If UI changes are intentional, update the baseline images:

\`\`\`bash
npx playwright test visual-regression.spec.ts --update-snapshots
\`\`\`

## Reviewing Differences

Failed visual tests will generate diff images in the test results showing:
- Expected (baseline) image
- Actual (current) image
- Diff highlighting changes in red

`;

  await fs.writeFile(reportPath, report);
});