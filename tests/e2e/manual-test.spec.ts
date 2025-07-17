import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

test.describe('Manual Dietary Test', () => {
  test('Test with manual initialization', async ({ page }) => {
    // Go to page
    await page.goto('/meal-planner-v2');
    
    // Wait a bit for initial render
    await page.waitForTimeout(2000);
    
    // Force recipe initialization manually
    await page.evaluate(async () => {
      console.log('Manually fetching recipes...');
      
      // Fetch the recipe data
      const response = await fetch('/data/all-recipes.min.json');
      const data = await response.json();
      console.log('Fetched', data.recipes.length, 'recipes');
      
      // @ts-ignore
      if (window.LocalRecipeService) {
        // @ts-ignore
        window.LocalRecipeService.initialize(data.recipes);
        console.log('LocalRecipeService manually initialized');
      }
    });
    
    // Wait a bit more
    await page.waitForTimeout(1000);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/manual-test-1.png',
      fullPage: true 
    });
    
    // Check what's visible now
    const bodyText = await page.locator('body').innerText();
    console.log('Body text includes:', {
      hasRecipes: bodyText.includes('recipes available'),
      hasDietary: bodyText.includes('Dietary Preferences'),
      hasGenerate: bodyText.includes('Generate Meal Plan'),
      recipeCount: bodyText.match(/(\d+) GD-friendly recipes/)?.[1] || 'not found'
    });
    
    // Try clicking dietary preferences
    const dietaryVisible = await page.locator('text=Dietary Preferences').isVisible();
    if (dietaryVisible) {
      await page.locator('text=Dietary Preferences').click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/manual-test-2-dietary-open.png',
        fullPage: true 
      });
      
      // Select vegetarian
      await page.locator('label:has-text("Vegetarian")').click();
      
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/manual-test-3-vegetarian.png',
        fullPage: true 
      });
      
      // Try to generate meal plan
      const generateBtn = page.locator('button:has-text("Generate Meal Plan")');
      if (await generateBtn.isVisible()) {
        await generateBtn.click();
        
        // Wait with longer timeout
        try {
          await page.waitForSelector('text=GD Meal Plan', { timeout: 20000 });
          console.log('Meal plan generated!');
          
          await page.screenshot({ 
            path: 'tests/e2e/screenshots/manual-test-4-meal-plan.png',
            fullPage: true 
          });
          
          // Count vegetarian violations
          const mealTexts = await page.locator('.meal-card, [class*="meal"]').allTextContents();
          const meatWords = ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon'];
          let violations = 0;
          
          for (const meal of mealTexts) {
            for (const meat of meatWords) {
              if (meal.toLowerCase().includes(meat)) {
                console.log('Found meat in:', meal.substring(0, 50));
                violations++;
              }
            }
          }
          
          console.log('Vegetarian violations found:', violations);
          
        } catch (e) {
          console.log('Failed to generate meal plan:', e.message);
          await page.screenshot({ 
            path: 'tests/e2e/screenshots/manual-test-error.png',
            fullPage: true 
          });
        }
      }
    }
    
    // Create summary
    const summary = `# Manual Test Summary

## Test Date: ${new Date().toISOString()}

## Results:
- Page loaded: ✅
- Dietary Preferences visible: ${dietaryVisible ? '✅' : '❌'}
- Recipes loaded: ${bodyText.includes('455') ? '✅' : '❌'}
- Meal plan generation: Check screenshots

## Screenshots:
1. manual-test-1.png - Initial page state
2. manual-test-2-dietary-open.png - Dietary preferences expanded
3. manual-test-3-vegetarian.png - Vegetarian selected
4. manual-test-4-meal-plan.png - Generated meal plan (if successful)

## Notes:
The manual initialization approach ${bodyText.includes('455') ? 'did' : 'did not'} help with recipe loading.
`;
    
    await fs.writeFile('tests/e2e/reports/manual-test-summary.md', summary);
  });
});