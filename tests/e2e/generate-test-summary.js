#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read all improvement reports
function readImprovementReports() {
  const reportsDir = path.join(__dirname, 'reports');
  const improvements = {};
  
  if (!fs.existsSync(reportsDir)) {
    return improvements;
  }

  const files = fs.readdirSync(reportsDir);
  
  files.forEach(file => {
    if (file.endsWith('-improvements.md')) {
      const content = fs.readFileSync(path.join(reportsDir, file), 'utf8');
      const category = file.replace('-improvements.md', '');
      
      // Parse improvements from markdown
      const lines = content.split('\n');
      const items = lines
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2));
      
      improvements[category] = items;
    }
  });
  
  return improvements;
}

// Count screenshots
function countScreenshots() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  if (!fs.existsSync(screenshotsDir)) {
    return 0;
  }
  
  return fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png')).length;
}

// Read performance metrics
function readPerformanceMetrics() {
  const metricsPath = path.join(__dirname, 'reports', 'performance-metrics.json');
  
  if (!fs.existsSync(metricsPath)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
}

// Generate executive summary
function generateSummary() {
  const improvements = readImprovementReports();
  const screenshotCount = countScreenshots();
  const performanceData = readPerformanceMetrics();
  
  const totalImprovements = Object.values(improvements).flat().length;
  
  let summary = `# E2E Test Executive Summary

Generated: ${new Date().toISOString()}

## Quick Stats

- 📸 **Screenshots Captured**: ${screenshotCount}
- 💡 **Improvement Suggestions**: ${totalImprovements}
- 🎯 **Test Coverage**: Dietary restrictions, Visual regression, Performance, Accessibility

`;

  if (performanceData && performanceData.summary) {
    summary += `## Performance Highlights

- ⏱️ **Page Load**: ${performanceData.summary.avgPageLoad.toFixed(0)}ms
- 🍽️ **Meal Plan Generation**: ${performanceData.summary.avgMealPlanGeneration.toFixed(0)}ms

`;
  }

  summary += `## Top Priority Improvements

`;

  // Categorize improvements by priority
  const highPriority = [];
  const mediumPriority = [];
  const lowPriority = [];

  Object.entries(improvements).forEach(([category, items]) => {
    items.forEach(item => {
      if (item.includes('error') || item.includes('fail') || item.includes('crash')) {
        highPriority.push({ category, item });
      } else if (item.includes('performance') || item.includes('slow') || item.includes('accessibility')) {
        mediumPriority.push({ category, item });
      } else {
        lowPriority.push({ category, item });
      }
    });
  });

  if (highPriority.length > 0) {
    summary += `### 🔴 High Priority (Bugs/Errors)\n\n`;
    highPriority.forEach(({ category, item }) => {
      summary += `- **[${category}]** ${item}\n`;
    });
    summary += '\n';
  }

  if (mediumPriority.length > 0) {
    summary += `### 🟡 Medium Priority (Performance/A11y)\n\n`;
    mediumPriority.slice(0, 5).forEach(({ category, item }) => {
      summary += `- **[${category}]** ${item}\n`;
    });
    if (mediumPriority.length > 5) {
      summary += `- ...and ${mediumPriority.length - 5} more\n`;
    }
    summary += '\n';
  }

  if (lowPriority.length > 0) {
    summary += `### 🟢 Low Priority (Enhancements)\n\n`;
    lowPriority.slice(0, 3).forEach(({ category, item }) => {
      summary += `- **[${category}]** ${item}\n`;
    });
    if (lowPriority.length > 3) {
      summary += `- ...and ${lowPriority.length - 3} more\n`;
    }
    summary += '\n';
  }

  summary += `## Next Steps

1. Review high priority issues immediately
2. Check screenshots in \`tests/e2e/screenshots/\` for visual issues
3. Run \`npm run test:e2e:report\` to see detailed HTML report
4. Consider implementing suggested improvements in priority order

## Test Commands

\`\`\`bash
# Re-run specific tests
npm run test:e2e:dietary      # Functionality tests
npm run test:e2e:visual       # Visual regression
npm run test:e2e:performance  # Performance tests

# Update visual baselines if needed
npm run test:e2e:update-snapshots
\`\`\`
`;

  // Write summary
  fs.writeFileSync(path.join(__dirname, 'reports', 'test-summary.md'), summary);
  console.log('✅ Test summary generated: tests/e2e/reports/test-summary.md');
  
  // Also output key stats to console
  console.log('\n📊 Test Results Summary:');
  console.log(`   - Total improvements suggested: ${totalImprovements}`);
  console.log(`   - High priority issues: ${highPriority.length}`);
  console.log(`   - Screenshots captured: ${screenshotCount}`);
  
  if (performanceData) {
    console.log(`   - Avg page load time: ${performanceData.summary.avgPageLoad.toFixed(0)}ms`);
  }
}

// Run summary generation
generateSummary();