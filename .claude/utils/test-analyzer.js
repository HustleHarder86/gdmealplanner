/**
 * Test Analyzer Utility
 * 
 * Utilities for analyzing test failures and suggesting fixes
 */

const fs = require('fs').promises;
const path = require('path');

class TestAnalyzer {
  constructor() {
    this.errorPatterns = this.initializeErrorPatterns();
  }

  initializeErrorPatterns() {
    return [
      {
        pattern: /locator.*not found/i,
        type: 'selector-not-found',
        severity: 'high',
        suggestions: [
          'Try alternative selectors',
          'Add wait conditions',
          'Check if element is in viewport'
        ]
      },
      {
        pattern: /timeout.*exceeded/i,
        type: 'timeout',
        severity: 'medium',
        suggestions: [
          'Increase timeout values',
          'Add network wait conditions',
          'Check for loading states'
        ]
      },
      {
        pattern: /element.*not visible/i,
        type: 'visibility',
        severity: 'medium',
        suggestions: [
          'Add visibility wait',
          'Check viewport size',
          'Scroll element into view'
        ]
      },
      {
        pattern: /page.*crashed/i,
        type: 'crash',
        severity: 'critical',
        suggestions: [
          'Check console errors',
          'Verify resource loading',
          'Check memory usage'
        ]
      }
    ];
  }

  /**
   * Analyze test failure output
   * @param {string} errorOutput - Test failure output
   * @returns {Array} Array of analyzed errors
   */
  analyzeFailure(errorOutput) {
    const errors = [];
    
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorOutput)) {
        errors.push({
          type: pattern.type,
          severity: pattern.severity,
          suggestions: pattern.suggestions,
          originalError: errorOutput
        });
      }
    }
    
    return errors;
  }

  /**
   * Generate alternative selectors
   * @param {string} originalSelector
   * @returns {Array} Array of alternative selectors
   */
  generateAlternativeSelectors(originalSelector) {
    const alternatives = [];
    
    // ID selector alternatives
    if (originalSelector.startsWith('#')) {
      const id = originalSelector.substring(1);
      alternatives.push(
        `[data-testid="${id}"]`,
        `[data-test="${id}"]`,
        `[id="${id}"]:visible`
      );
    }
    
    // Class selector alternatives
    if (originalSelector.startsWith('.')) {
      const className = originalSelector.substring(1);
      alternatives.push(
        `[class*="${className}"]`,
        `.${className}:visible`,
        `[data-class="${className}"]`
      );
    }
    
    // Text selector alternatives
    if (originalSelector.includes('text=')) {
      const text = originalSelector.replace('text=', '');
      alternatives.push(
        `text="${text.substring(0, Math.floor(text.length / 2))}"`,
        `[aria-label*="${text}"]`,
        `[title*="${text}"]`
      );
    }
    
    return alternatives;
  }

  /**
   * Suggest timing adjustments
   * @param {string} testCode - Test code to analyze
   * @returns {Array} Array of timing suggestions
   */
  suggestTimingAdjustments(testCode) {
    const suggestions = [];
    
    // Check for missing waits
    if (testCode.includes('click') && !testCode.includes('waitFor')) {
      suggestions.push({
        type: 'add-wait',
        suggestion: 'Add waitFor condition before click',
        code: 'await page.waitForSelector(selector, { state: "visible" });'
      });
    }
    
    // Check for network operations
    if (testCode.includes('goto') && !testCode.includes('networkidle')) {
      suggestions.push({
        type: 'network-wait',
        suggestion: 'Add network idle wait after navigation',
        code: 'await page.waitForLoadState("networkidle");'
      });
    }
    
    return suggestions;
  }

  /**
   * Generate test fix suggestions
   * @param {Array} errors - Analyzed errors
   * @param {string} testCode - Original test code
   * @returns {Array} Fix suggestions
   */
  generateFixSuggestions(errors, testCode) {
    const fixes = [];
    
    for (const error of errors) {
      switch (error.type) {
        case 'selector-not-found':
          fixes.push({
            type: 'selector-update',
            priority: 'high',
            description: 'Update selector to more reliable alternative',
            code: this.generateSelectorFix(testCode)
          });
          break;
          
        case 'timeout':
          fixes.push({
            type: 'timeout-increase',
            priority: 'medium',
            description: 'Increase timeout or add wait conditions',
            code: this.generateTimeoutFix(testCode)
          });
          break;
          
        case 'visibility':
          fixes.push({
            type: 'visibility-wait',
            priority: 'medium',
            description: 'Add visibility wait condition',
            code: 'await element.waitForVisible();'
          });
          break;
      }
    }
    
    return fixes;
  }

  generateSelectorFix(testCode) {
    // Extract selectors and provide alternatives
    const selectorMatch = testCode.match(/locator\('([^']+)'\)/);
    if (selectorMatch) {
      const alternatives = this.generateAlternativeSelectors(selectorMatch[1]);
      return `// Try these alternative selectors:\n// ${alternatives.join('\n// ')}`;
    }
    return '// Update selector to be more specific';
  }

  generateTimeoutFix(testCode) {
    return testCode.replace(
      /(timeout:\s*)(\d+)/g,
      (match, prefix, timeout) => {
        const newTimeout = Math.min(parseInt(timeout) * 2, 30000);
        return `${prefix}${newTimeout}`;
      }
    );
  }
}

module.exports = TestAnalyzer;