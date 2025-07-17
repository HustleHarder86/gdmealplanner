import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
  mealPlanGenerationTime: number;
  recipeLoadTime: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
}

test.describe('Performance Monitoring', () => {
  let metrics: PerformanceMetrics[] = [];

  test('Measure initial page load performance', async ({ page }) => {
    const navigationStart = Date.now();
    
    // Enable performance metrics collection
    await page.goto('/meal-planner-v2', { waitUntil: 'networkidle' });
    
    const navigationEnd = Date.now();
    const pageLoadTime = navigationEnd - navigationStart;

    // Collect Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        // Wait for LCP to be reported
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1];
          
          // Get other metrics
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          
          resolve({
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            largestContentfulPaint: lcp.startTime,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domComplete: navigation.domComplete - navigation.domContentLoadedEventEnd,
          });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    // Measure Time to Interactive
    const timeToInteractive = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const tti = entries.find(e => e.name === 'first-input-delay');
          if (tti) {
            observer.disconnect();
            resolve(tti.startTime);
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    // Measure memory usage
    const memoryUsage = await page.evaluate(() => {
      // @ts-ignore
      if (performance.memory) {
        return {
          // @ts-ignore
          usedJSHeapSize: performance.memory.usedJSHeapSize / 1048576, // Convert to MB
          // @ts-ignore
          totalJSHeapSize: performance.memory.totalJSHeapSize / 1048576
        };
      }
      return null;
    });

    const performanceData: Partial<PerformanceMetrics> = {
      pageLoad: pageLoadTime,
      firstContentfulPaint: webVitals.firstContentfulPaint,
      largestContentfulPaint: webVitals.largestContentfulPaint,
      timeToInteractive: timeToInteractive || webVitals.domComplete,
      memoryUsage: memoryUsage || undefined
    };

    metrics.push(performanceData as PerformanceMetrics);

    // Assert performance budgets
    expect(pageLoadTime).toBeLessThan(3000); // Page should load in under 3 seconds
    expect(webVitals.largestContentfulPaint).toBeLessThan(2500); // LCP under 2.5s
    expect(webVitals.firstContentfulPaint).toBeLessThan(1800); // FCP under 1.8s
  });

  test('Measure meal plan generation performance', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Wait for recipes to load
    await page.waitForSelector('text=/[0-9]+ recipes available/');
    
    // Measure generation time
    const startTime = Date.now();
    
    await page.locator('button:has-text("Generate Meal Plan")').click();
    await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 60000 });
    
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // Count DOM nodes to check for memory leaks
    const domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

    // Update metrics
    if (metrics.length > 0) {
      metrics[0].mealPlanGenerationTime = generationTime;
    }

    // Performance assertions
    expect(generationTime).toBeLessThan(5000); // Should generate in under 5 seconds
    expect(domNodeCount).toBeLessThan(5000); // Reasonable DOM size
    
    console.log(`Meal plan generation took ${generationTime}ms with ${domNodeCount} DOM nodes`);
  });

  test('Measure dietary filtering performance', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    await page.locator('button:has-text("Dietary Preferences")').click();
    
    // Measure time to filter with multiple restrictions
    const filteringTimes: number[] = [];
    
    const restrictions = ['Vegetarian', 'Gluten-Free', 'Dairy-Free'];
    
    for (const restriction of restrictions) {
      const startTime = Date.now();
      
      await page.locator(`label:has-text("${restriction}")`).click();
      
      // Wait for any UI updates
      await page.waitForTimeout(100);
      
      const endTime = Date.now();
      filteringTimes.push(endTime - startTime);
    }

    // Generate meal plan with restrictions
    const restrictedGenerationStart = Date.now();
    
    await page.locator('button:has-text("Generate Meal Plan")').click();
    await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 60000 });
    
    const restrictedGenerationEnd = Date.now();
    const restrictedGenerationTime = restrictedGenerationEnd - restrictedGenerationStart;

    console.log('Filtering times:', filteringTimes);
    console.log('Restricted generation time:', restrictedGenerationTime);

    // Performance assertions
    filteringTimes.forEach(time => {
      expect(time).toBeLessThan(500); // Each filter should apply quickly
    });
    expect(restrictedGenerationTime).toBeLessThan(8000); // Allow more time for restricted generation
  });

  test('Measure shopping list generation performance', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Generate meal plan first
    await page.locator('button:has-text("Generate Meal Plan")').click();
    await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
    
    // Measure shopping list rendering
    const startTime = Date.now();
    
    await page.locator('button:has-text("Shopping List")').click();
    await page.waitForSelector('h3:has-text("Produce")'); // Wait for categories to load
    
    const endTime = Date.now();
    const shoppingListTime = endTime - startTime;

    console.log(`Shopping list rendered in ${shoppingListTime}ms`);
    
    expect(shoppingListTime).toBeLessThan(1000); // Should render quickly
  });

  test('Memory leak detection', async ({ page }) => {
    await page.goto('/meal-planner-v2');
    
    // Get initial memory usage
    const getMemoryUsage = async () => {
      return await page.evaluate(() => {
        // @ts-ignore
        if (performance.memory) {
          return {
            // @ts-ignore
            usedJSHeapSize: performance.memory.usedJSHeapSize / 1048576,
            // @ts-ignore
            totalJSHeapSize: performance.memory.totalJSHeapSize / 1048576
          };
        }
        return null;
      });
    };

    const initialMemory = await getMemoryUsage();
    console.log('Initial memory:', initialMemory);

    // Perform multiple operations
    for (let i = 0; i < 5; i++) {
      // Generate meal plan
      await page.locator('button:has-text("Generate").or(page.locator("button:has-text("Generate New"))).click();
      await page.waitForSelector('text=GD Meal Plan - Week of', { timeout: 30000 });
      
      // Switch to shopping list and back
      await page.locator('button:has-text("Shopping List")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Meal Plan")').click();
      await page.waitForTimeout(500);
      
      // Open and close dietary preferences
      await page.locator('button:has-text("Dietary Preferences")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Dietary Preferences")').click();
      await page.waitForTimeout(500);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      // @ts-ignore
      if (window.gc) {
        // @ts-ignore
        window.gc();
      }
    });

    await page.waitForTimeout(2000);

    const finalMemory = await getMemoryUsage();
    console.log('Final memory:', finalMemory);

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
      
      // Allow for some memory growth but flag potential leaks
      if (memoryIncrease > 50) {
        console.warn('Potential memory leak detected: Memory increased by more than 50MB');
      }
    }
  });

  test.afterAll(async () => {
    // Save performance metrics
    const report = {
      timestamp: new Date().toISOString(),
      metrics: metrics,
      summary: {
        avgPageLoad: metrics.reduce((acc, m) => acc + (m.pageLoad || 0), 0) / metrics.length,
        avgMealPlanGeneration: metrics.reduce((acc, m) => acc + (m.mealPlanGenerationTime || 0), 0) / metrics.filter(m => m.mealPlanGenerationTime).length,
      }
    };

    await fs.writeFile(
      'tests/e2e/reports/performance-metrics.json',
      JSON.stringify(report, null, 2)
    );

    // Generate performance report
    const performanceReport = `# Performance Test Report

Generated on: ${report.timestamp}

## Summary

- **Average Page Load Time**: ${report.summary.avgPageLoad.toFixed(0)}ms
- **Average Meal Plan Generation**: ${report.summary.avgMealPlanGeneration.toFixed(0)}ms

## Detailed Metrics

### Web Vitals
- **First Contentful Paint (FCP)**: ${metrics[0]?.firstContentfulPaint?.toFixed(0)}ms (Target: <1800ms)
- **Largest Contentful Paint (LCP)**: ${metrics[0]?.largestContentfulPaint?.toFixed(0)}ms (Target: <2500ms)
- **Time to Interactive (TTI)**: ${metrics[0]?.timeToInteractive?.toFixed(0)}ms (Target: <3800ms)

### Application Performance
- **Initial Page Load**: ${metrics[0]?.pageLoad}ms
- **Meal Plan Generation**: ${metrics[0]?.mealPlanGenerationTime}ms
- **Recipe Loading**: ${metrics[0]?.recipeLoadTime || 'N/A'}ms

### Memory Usage
${metrics[0]?.memoryUsage ? `
- **JS Heap Used**: ${metrics[0].memoryUsage.usedJSHeapSize.toFixed(2)} MB
- **JS Heap Total**: ${metrics[0].memoryUsage.totalJSHeapSize.toFixed(2)} MB
` : 'Memory metrics not available (requires Chrome with --enable-precise-memory-info flag)'}

## Recommendations

${report.summary.avgPageLoad > 3000 ? '- ⚠️ Page load time exceeds 3 second target. Consider optimizing bundle size and initial render.' : '- ✅ Page load time is within acceptable range.'}

${report.summary.avgMealPlanGeneration > 5000 ? '- ⚠️ Meal plan generation is slow. Consider optimizing the algorithm or adding loading states.' : '- ✅ Meal plan generation performance is acceptable.'}

${metrics[0]?.largestContentfulPaint && metrics[0].largestContentfulPaint > 2500 ? '- ⚠️ LCP exceeds target. Optimize largest content elements and resource loading.' : '- ✅ LCP is within target range.'}

## Performance Budget Status

| Metric | Budget | Actual | Status |
|--------|--------|--------|--------|
| Page Load | <3000ms | ${metrics[0]?.pageLoad}ms | ${metrics[0]?.pageLoad && metrics[0].pageLoad < 3000 ? '✅' : '❌'} |
| FCP | <1800ms | ${metrics[0]?.firstContentfulPaint?.toFixed(0)}ms | ${metrics[0]?.firstContentfulPaint && metrics[0].firstContentfulPaint < 1800 ? '✅' : '❌'} |
| LCP | <2500ms | ${metrics[0]?.largestContentfulPaint?.toFixed(0)}ms | ${metrics[0]?.largestContentfulPaint && metrics[0].largestContentfulPaint < 2500 ? '✅' : '❌'} |
| Meal Plan Gen | <5000ms | ${metrics[0]?.mealPlanGenerationTime}ms | ${metrics[0]?.mealPlanGenerationTime && metrics[0].mealPlanGenerationTime < 5000 ? '✅' : '❌'} |
`;

    await fs.writeFile(
      'tests/e2e/reports/performance-report.md',
      performanceReport
    );
  });
});