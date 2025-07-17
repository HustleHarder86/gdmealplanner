import { test, expect, Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

// Helper to take annotated screenshots
async function takeAnnotatedScreenshot(page: Page, name: string, annotations?: string[]) {
  const screenshotPath = `tests/e2e/screenshots/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  if (annotations && annotations.length > 0) {
    const annotationsPath = `tests/e2e/screenshots/${name}.annotations.txt`;
    await fs.writeFile(annotationsPath, annotations.join('\n'));
  }
}

// Helper to generate improvement suggestions
async function generateImprovementReport(testName: string, suggestions: string[]) {
  const reportPath = `tests/e2e/reports/${testName}-improvements.md`;
  const content = `# ${testName} - Improvement Suggestions\n\n${suggestions.map(s => `- ${s}`).join('\n')}`;
  await fs.writeFile(reportPath, content);
}

test.describe('Dietary Restrictions E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('Complete dietary restrictions flow', async ({ page }) => {
    const improvements: string[] = [];

    // 1. Navigate to meal planner
    await test.step('Navigate to meal planner', async () => {
      await page.goto('/meal-planner-v2');
      await takeAnnotatedScreenshot(page, '01-meal-planner-landing', [
        'Initial meal planner page load',
        'Check for clear CTA and explanatory text'
      ]);

      // Check if dietary preferences are visible
      const dietarySection = page.locator('text=Dietary Preferences');
      if (!await dietarySection.isVisible()) {
        improvements.push('Dietary preferences section should be more prominent on initial load');
      }
    });

    // 2. Open dietary preferences
    await test.step('Open dietary preferences section', async () => {
      const dietaryButton = page.locator('button:has-text("Dietary Preferences")');
      await dietaryButton.click();
      await page.waitForTimeout(500); // Wait for animation
      
      await takeAnnotatedScreenshot(page, '02-dietary-preferences-open', [
        'Expanded dietary preferences section',
        'All dietary options visible'
      ]);

      // Check accessibility
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      if (checkboxes < 7) {
        improvements.push(`Only ${checkboxes} dietary options found - consider adding more common restrictions`);
      }

      // Check for helper text
      const helperText = await page.locator('text=Note:').isVisible();
      if (!helperText) {
        improvements.push('Add helper text explaining how dietary restrictions affect meal planning');
      }
    });

    // 3. Select vegetarian restriction
    await test.step('Select vegetarian diet', async () => {
      await page.locator('label:has-text("Vegetarian")').click();
      await page.waitForTimeout(300);
      
      await takeAnnotatedScreenshot(page, '03-vegetarian-selected', [
        'Vegetarian option selected',
        'Check if selection is clearly indicated'
      ]);

      // Verify the selection is reflected in the summary
      const summary = await page.locator('text=Active: Vegetarian').isVisible();
      if (!summary) {
        improvements.push('Add real-time summary of selected restrictions');
      }
    });

    // 4. Add disliked ingredients
    await test.step('Add disliked ingredients', async () => {
      const dislikeInput = page.locator('input[placeholder*="mushrooms"]');
      await dislikeInput.fill('mushrooms');
      await dislikeInput.press('Enter');
      
      await dislikeInput.fill('olives');
      await page.locator('button:has-text("Add")').click();
      
      await page.waitForTimeout(300);
      await takeAnnotatedScreenshot(page, '04-dislikes-added', [
        'Disliked ingredients added',
        'Check if removal option is clear'
      ]);

      // Check if dislikes are displayed as tags
      const mushroomTag = await page.locator('span:has-text("mushrooms")').isVisible();
      const olivesTag = await page.locator('span:has-text("olives")').isVisible();
      
      if (!mushroomTag || !olivesTag) {
        improvements.push('Disliked ingredients should be displayed as removable tags');
      }
    });

    // 5. Generate meal plan
    await test.step('Generate meal plan with restrictions', async () => {
      const generateButton = page.locator('button:has-text("Generate Meal Plan")');
      await generateButton.click();
      
      // Wait for generation to complete
      await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
      
      await takeAnnotatedScreenshot(page, '05-meal-plan-generated', [
        'Generated meal plan with vegetarian restriction',
        'All meals should be vegetarian'
      ]);

      // Verify no meat in any meals
      const mealCards = page.locator('[class*="meal-card"], [class*="MealCard"]');
      const mealCount = await mealCards.count();
      
      for (let i = 0; i < Math.min(mealCount, 5); i++) {
        const mealText = await mealCards.nth(i).textContent();
        if (mealText && (mealText.includes('chicken') || mealText.includes('beef') || mealText.includes('pork'))) {
          improvements.push(`Found non-vegetarian meal: ${mealText.substring(0, 50)}...`);
        }
      }

      // Check for variety
      const uniqueMeals = new Set();
      for (let i = 0; i < mealCount; i++) {
        const mealTitle = await mealCards.nth(i).locator('h3, h4').first().textContent();
        if (mealTitle) uniqueMeals.add(mealTitle);
      }
      
      if (uniqueMeals.size < mealCount * 0.7) {
        improvements.push('Meal plans should have more variety - too many repeated meals');
      }
    });

    // 6. Test meal swapping
    await test.step('Test meal swapping', async () => {
      const firstSwapButton = page.locator('button:has-text("Swap")').first();
      await firstSwapButton.click();
      
      await page.waitForTimeout(2000); // Wait for swap to complete
      
      await takeAnnotatedScreenshot(page, '06-meal-swapped', [
        'Meal successfully swapped',
        'New meal should also be vegetarian'
      ]);
    });

    // 7. Navigate to shopping list
    await test.step('View shopping list', async () => {
      const shoppingTab = page.locator('button:has-text("Shopping List")');
      await shoppingTab.click();
      
      await page.waitForTimeout(500);
      await takeAnnotatedScreenshot(page, '07-shopping-list', [
        'Shopping list generated from meal plan',
        'Items should be organized by category'
      ]);

      // Check organization
      const categories = await page.locator('h3').filter({ hasText: /(Produce|Proteins|Dairy|Pantry)/ }).count();
      if (categories < 3) {
        improvements.push('Shopping list should be better organized by store sections');
      }

      // Check for export option
      const exportButton = await page.locator('button:has-text("Export")').isVisible();
      if (!exportButton) {
        improvements.push('Add export functionality for shopping lists');
      }
    });

    // 8. Test multiple dietary restrictions
    await test.step('Test multiple restrictions', async () => {
      // Go back to meal plan tab
      await page.locator('button:has-text("Meal Plan")').click();
      
      // Open dietary preferences again
      await page.locator('button:has-text("Dietary Preferences")').click();
      
      // Add gluten-free
      await page.locator('label:has-text("Gluten-Free")').click();
      
      await page.waitForTimeout(300);
      await takeAnnotatedScreenshot(page, '08-multiple-restrictions', [
        'Multiple dietary restrictions selected',
        'Both Vegetarian and Gluten-Free active'
      ]);

      // Generate new plan
      await page.locator('button:has-text("Generate New Plan")').click();
      await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
      
      await takeAnnotatedScreenshot(page, '09-restricted-meal-plan', [
        'Meal plan with multiple restrictions',
        'Should have fewer recipe options'
      ]);

      // Check if there's a warning about limited options
      const warning = await page.locator('text=/limited|fewer/i').isVisible();
      if (!warning) {
        improvements.push('Add warnings when dietary restrictions significantly limit recipe options');
      }
    });

    // 9. Test mobile responsiveness
    await test.step('Test mobile view', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      await takeAnnotatedScreenshot(page, '10-mobile-view', [
        'Mobile responsive design',
        'All features accessible on mobile'
      ]);

      // Check if dietary preferences are still accessible
      const mobileMenuButton = page.locator('button[aria-label*="menu"]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
      }

      const mobileDietaryAccess = await page.locator('text=Dietary Preferences').isVisible();
      if (!mobileDietaryAccess) {
        improvements.push('Dietary preferences should be easily accessible on mobile');
      }
    });

    // 10. Performance check
    await test.step('Performance metrics', async () => {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });

      if (metrics.loadComplete > 3000) {
        improvements.push(`Page load time is ${metrics.loadComplete}ms - consider optimizing for better performance`);
      }
    });

    // Generate improvement report
    await generateImprovementReport('dietary-restrictions', improvements);
  });

  test('Edge cases and error handling', async ({ page }) => {
    const improvements: string[] = [];

    await test.step('Test with all restrictions enabled', async () => {
      await page.goto('/meal-planner-v2');
      await page.locator('button:has-text("Dietary Preferences")').click();
      
      // Select all dietary restrictions
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click();
      }
      
      await takeAnnotatedScreenshot(page, '11-all-restrictions', [
        'All dietary restrictions selected',
        'This should be a challenging scenario'
      ]);

      // Try to generate meal plan
      await page.locator('button:has-text("Generate Meal Plan")').click();
      
      // Wait for either success or error
      const result = await Promise.race([
        page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 }).then(() => 'success'),
        page.waitForSelector('text=/error|failed|unable/i', { timeout: 30000 }).then(() => 'error'),
      ]);

      await takeAnnotatedScreenshot(page, '12-extreme-restrictions-result', [
        `Result with all restrictions: ${result}`,
        'Should handle gracefully with clear messaging'
      ]);

      if (result === 'error') {
        const errorMessage = await page.locator('text=/error|failed|unable/i').textContent();
        if (!errorMessage?.includes('recipe') && !errorMessage?.includes('restriction')) {
          improvements.push('Error messages should be more specific about why meal plan generation failed');
        }
      }
    });

    await test.step('Test rapid clicking and race conditions', async () => {
      await page.goto('/meal-planner-v2');
      
      // Rapidly click generate multiple times
      const generateButton = page.locator('button:has-text("Generate Meal Plan")');
      
      for (let i = 0; i < 5; i++) {
        await generateButton.click();
        await page.waitForTimeout(100);
      }
      
      // Check if the UI handles this gracefully
      const spinners = await page.locator('[class*="spinner"], [class*="loading"]').count();
      if (spinners > 1) {
        improvements.push('Multiple loading states detected - implement debouncing for generate button');
      }

      await takeAnnotatedScreenshot(page, '13-rapid-clicking', [
        'UI state after rapid clicking',
        'Should prevent multiple simultaneous generations'
      ]);
    });

    await generateImprovementReport('edge-cases', improvements);
  });

  test('Accessibility audit', async ({ page }) => {
    const improvements: string[] = [];

    await page.goto('/meal-planner-v2');
    await page.locator('button:has-text("Dietary Preferences")').click();

    // Run accessibility checks
    await test.step('Keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      
      await takeAnnotatedScreenshot(page, '14-keyboard-navigation', [
        'Testing keyboard navigation',
        `Currently focused element: ${focusedElement}`
      ]);

      // Test checkbox selection with keyboard
      await page.keyboard.press('Space');
      
      // Check if selection worked
      const keyboardSelected = await page.locator('input[type="checkbox"]:checked').count();
      if (keyboardSelected === 0) {
        improvements.push('Checkboxes should be selectable via keyboard (Space key)');
      }
    });

    await test.step('Screen reader labels', async () => {
      // Check for proper ARIA labels
      const unlabeledInputs = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
      if (unlabeledInputs > 0) {
        improvements.push(`Found ${unlabeledInputs} inputs without proper ARIA labels`);
      }

      // Check for form landmarks
      const forms = await page.locator('form, [role="form"]').count();
      if (forms === 0) {
        improvements.push('Dietary preferences should be wrapped in a form element for better accessibility');
      }
    });

    await test.step('Color contrast', async () => {
      // This is a basic check - for comprehensive testing, use axe-core
      const lowContrastElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const issues = [];
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const bgColor = styles.backgroundColor;
          
          // Very basic contrast check (would need proper algorithm)
          if (color === 'rgb(200, 200, 200)' || color === 'rgb(150, 150, 150)') {
            issues.push(el.textContent?.substring(0, 50));
          }
        });
        
        return issues;
      });

      if (lowContrastElements.length > 0) {
        improvements.push('Some text may have insufficient color contrast for accessibility');
      }
    });

    await generateImprovementReport('accessibility', improvements);
  });

  test('Data persistence and recovery', async ({ page, context }) => {
    const improvements: string[] = [];

    await test.step('Save dietary preferences', async () => {
      await page.goto('/meal-planner-v2');
      await page.locator('button:has-text("Dietary Preferences")').click();
      
      // Select some preferences
      await page.locator('label:has-text("Vegetarian")').click();
      await page.locator('label:has-text("Gluten-Free")').click();
      
      // Add dislikes
      const dislikeInput = page.locator('input[placeholder*="mushrooms"]');
      await dislikeInput.fill('mushrooms');
      await dislikeInput.press('Enter');
      
      await takeAnnotatedScreenshot(page, '15-preferences-set', [
        'Dietary preferences configured',
        'These should persist across sessions'
      ]);
    });

    await test.step('Verify persistence after reload', async () => {
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if preferences are retained
      await page.locator('button:has-text("Dietary Preferences")').click();
      
      const vegetarianChecked = await page.locator('input[type="checkbox"]:checked').filter({ hasText: 'Vegetarian' }).count();
      const glutenFreeChecked = await page.locator('input[type="checkbox"]:checked').filter({ hasText: 'Gluten-Free' }).count();
      const mushroomDislike = await page.locator('span:has-text("mushrooms")').isVisible();
      
      await takeAnnotatedScreenshot(page, '16-preferences-after-reload', [
        'Preferences after page reload',
        'Should maintain previous selections'
      ]);

      if (!vegetarianChecked || !glutenFreeChecked || !mushroomDislike) {
        improvements.push('Dietary preferences should persist across page reloads');
      }
    });

    await test.step('Test in new tab', async () => {
      // Open new tab
      const newPage = await context.newPage();
      await newPage.goto('/meal-planner-v2');
      await newPage.locator('button:has-text("Dietary Preferences")').click();
      
      const vegetarianInNewTab = await newPage.locator('input[type="checkbox"]:checked').filter({ hasText: 'Vegetarian' }).count();
      
      await takeAnnotatedScreenshot(newPage, '17-preferences-new-tab', [
        'Preferences in new tab',
        'Should sync across tabs'
      ]);

      if (!vegetarianInNewTab) {
        improvements.push('Dietary preferences should sync across browser tabs');
      }
      
      await newPage.close();
    });

    await generateImprovementReport('data-persistence', improvements);
  });
});

// Additional test for performance monitoring
test.describe('Performance Tests', () => {
  test('Measure meal plan generation performance', async ({ page }) => {
    const improvements: string[] = [];
    const timings: number[] = [];

    await page.goto('/meal-planner-v2');

    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      await page.locator('button:has-text("Generate")')
        .or(page.locator('button:has-text("Generate New")'))
        .click();
      await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 60000 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      timings.push(duration);
      
      console.log(`Generation ${i + 1} took ${duration}ms`);
      
      if (duration > 5000) {
        improvements.push(`Meal plan generation took ${duration}ms - consider optimizing algorithm performance`);
      }

      // Small delay before next generation
      await page.waitForTimeout(1000);
    }

    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    
    await fs.writeFile(
      'tests/e2e/reports/performance-metrics.json',
      JSON.stringify({
        mealPlanGenerationTimes: timings,
        averageTime: avgTime,
        timestamp: new Date().toISOString()
      }, null, 2)
    );

    await generateImprovementReport('performance', improvements);
  });
});