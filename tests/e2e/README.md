# E2E Testing Guide for Dietary Restrictions

This comprehensive test suite ensures the dietary restrictions feature works correctly end-to-end, captures visual regressions, and monitors performance.

## Test Structure

```
tests/e2e/
├── dietary-restrictions.spec.ts    # Main functionality tests
├── visual-regression.spec.ts       # Visual consistency tests
├── performance-monitoring.spec.ts  # Performance metrics
├── run-tests.sh                   # Test runner script
├── screenshots/                   # Test screenshots
├── reports/                      # Test reports
└── README.md                     # This file
```

## Running Tests

### Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:dietary      # Dietary restrictions functionality
npm run test:e2e:visual       # Visual regression tests
npm run test:e2e:performance  # Performance monitoring

# Run full test suite with reports
npm run test:e2e:full
```

### Interactive Mode

```bash
# Open Playwright UI for debugging
npm run test:e2e:ui
```

### Update Visual Baselines

```bash
# Update screenshots when UI changes are intentional
npm run test:e2e:update-snapshots
```

## Test Coverage

### 1. Dietary Restrictions Functionality

Tests the complete user flow:
- Opening dietary preferences
- Selecting restrictions (vegetarian, vegan, gluten-free, etc.)
- Adding disliked ingredients
- Generating meal plans with restrictions
- Verifying meals comply with restrictions
- Testing meal swapping
- Checking shopping list generation

### 2. Visual Regression

Captures screenshots for:
- Dietary preferences UI (collapsed/expanded)
- Meal plan layouts (desktop/tablet/mobile)
- Shopping list view
- Error states

### 3. Performance Monitoring

Measures:
- Page load time (<3s target)
- First Contentful Paint (<1.8s)
- Largest Contentful Paint (<2.5s)
- Meal plan generation time (<5s)
- Memory usage and leak detection

### 4. Edge Cases

Tests:
- All restrictions enabled
- Rapid clicking/race conditions
- Data persistence across reloads
- Cross-tab synchronization

### 5. Accessibility

Verifies:
- Keyboard navigation
- ARIA labels
- Color contrast
- Screen reader compatibility

## Understanding Test Output

### Screenshots

Found in `tests/e2e/screenshots/`:
- Named by test step (e.g., `01-meal-planner-landing.png`)
- Includes annotation files explaining what to check

### Reports

Generated in `tests/e2e/reports/`:
- `consolidated-report.md` - Overall test summary
- `*-improvements.md` - Specific improvement suggestions
- `performance-metrics.json` - Raw performance data
- `visual-regression-report.md` - Visual test guide

### HTML Report

After running tests:
```bash
npm run test:e2e:report
```

## Improvement Suggestions

The tests automatically generate improvement suggestions for:

1. **UX Improvements**
   - Missing helper text
   - Unclear error messages
   - Poor mobile experience

2. **Performance Issues**
   - Slow page loads
   - Inefficient algorithms
   - Memory leaks

3. **Accessibility Gaps**
   - Missing ARIA labels
   - Poor keyboard navigation
   - Low color contrast

4. **Visual Inconsistencies**
   - Layout shifts
   - Responsive design issues
   - Animation problems

## CI/CD Integration

To run in CI:

```yaml
# Example GitHub Actions workflow
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      tests/e2e/screenshots/
      tests/e2e/reports/
```

## Debugging Failed Tests

1. **Check screenshots**: Compare actual vs expected in `test-results/`
2. **View traces**: Playwright records test execution traces
3. **Read reports**: Check improvement suggestions
4. **Run locally**: Use `npm run test:e2e:ui` for step-by-step debugging

## Best Practices

1. **Keep tests independent**: Each test should start fresh
2. **Use meaningful assertions**: Test user-visible behavior
3. **Capture evidence**: Screenshots help diagnose issues
4. **Monitor performance**: Prevent regressions
5. **Update baselines carefully**: Only when changes are intentional

## Extending Tests

To add new test cases:

1. Add to existing spec files or create new ones
2. Follow the pattern of existing tests
3. Include screenshot captures for important states
4. Add improvement detection logic
5. Update this README with new coverage

## Troubleshooting

### Tests fail on "Generate Meal Plan"
- Ensure recipes are loaded in `public/data/`
- Check Firebase configuration
- Verify dietary tagging is complete

### Visual tests fail frequently
- Run `npm run test:e2e:update-snapshots` if changes are intentional
- Check for animation timing issues
- Ensure consistent test environment

### Performance tests timeout
- Increase timeout in test configuration
- Check for actual performance issues
- Run on faster hardware for baseline