#!/bin/bash

echo "🧪 Running Comprehensive E2E Tests for Dietary Restrictions"
echo "=========================================================="

# Create necessary directories
mkdir -p tests/e2e/screenshots
mkdir -p tests/e2e/reports
mkdir -p test-results

# Install playwright browsers if not already installed
echo "📦 Ensuring Playwright browsers are installed..."
npx playwright install

# Clear previous results
echo "🧹 Cleaning previous test results..."
rm -f tests/e2e/screenshots/*.png
rm -f tests/e2e/screenshots/*.txt
rm -f tests/e2e/reports/*.md
rm -f test-results/*.json

# Run the tests
echo "🚀 Starting tests..."
npx playwright test dietary-restrictions.spec.ts --reporter=html,list

# Generate consolidated report
echo "📊 Generating consolidated report..."

cat > tests/e2e/reports/consolidated-report.md << 'EOF'
# Dietary Restrictions E2E Test Report

Generated on: $(date)

## Test Results Summary

### Screenshots Captured
EOF

# List all screenshots
echo "" >> tests/e2e/reports/consolidated-report.md
echo "The following screenshots were captured during testing:" >> tests/e2e/reports/consolidated-report.md
echo "" >> tests/e2e/reports/consolidated-report.md

for screenshot in tests/e2e/screenshots/*.png; do
  if [ -f "$screenshot" ]; then
    filename=$(basename "$screenshot")
    echo "- $filename" >> tests/e2e/reports/consolidated-report.md
    
    # Include annotations if available
    annotations_file="${screenshot%.png}.annotations.txt"
    if [ -f "$annotations_file" ]; then
      echo "  - Annotations:" >> tests/e2e/reports/consolidated-report.md
      while IFS= read -r line; do
        echo "    - $line" >> tests/e2e/reports/consolidated-report.md
      done < "$annotations_file"
    fi
    echo "" >> tests/e2e/reports/consolidated-report.md
  fi
done

# Append improvement reports
echo "## Improvement Suggestions" >> tests/e2e/reports/consolidated-report.md
echo "" >> tests/e2e/reports/consolidated-report.md

for report in tests/e2e/reports/*-improvements.md; do
  if [ -f "$report" ]; then
    echo "" >> tests/e2e/reports/consolidated-report.md
    cat "$report" >> tests/e2e/reports/consolidated-report.md
    echo "" >> tests/e2e/reports/consolidated-report.md
  fi
done

# Generate executive summary
echo "📝 Generating executive summary..."
node tests/e2e/generate-test-summary.js

# Show summary
echo ""
echo "✅ Testing complete!"
echo ""
echo "📁 Results available at:"
echo "   - Executive Summary: tests/e2e/reports/test-summary.md"
echo "   - HTML Report: playwright-report/index.html"
echo "   - Screenshots: tests/e2e/screenshots/"
echo "   - Improvement Reports: tests/e2e/reports/"
echo "   - Consolidated Report: tests/e2e/reports/consolidated-report.md"
echo ""
echo "To view the HTML report, run: npx playwright show-report"