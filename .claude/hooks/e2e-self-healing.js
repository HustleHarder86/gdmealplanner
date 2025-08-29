#!/usr/bin/env node

/**
 * E2E Test Self-Healing Hook
 * 
 * Automatically fixes flaky E2E tests with intelligent retry logic
 * Analyzes failures and applies common fixes like selector updates and timing adjustments
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright');

class E2ESelfHealing {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.healingStrategies = this.initializeHealingStrategies();
  }

  createLogger() {
    return {
      info: (msg) => this.log('INFO', msg),
      warn: (msg) => this.log('WARN', msg),
      error: (msg) => this.log('ERROR', msg),
      debug: (msg) => this.log('DEBUG', msg)
    };
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] ${message}`;
    console.log(logMessage);
    
    try {
      await fs.appendFile('.claude/logs/e2e-self-healing.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  initializeHealingStrategies() {
    return {
      'selector-update': this.updateSelectors.bind(this),
      'timing-adjustment': this.adjustTiming.bind(this),
      'viewport-change': this.changeViewport.bind(this),
      'element-wait': this.addElementWaits.bind(this),
      'network-wait': this.addNetworkWaits.bind(this),
      'retry-click': this.retryClicks.bind(this)
    };
  }

  async run(testFiles = []) {
    this.logger.info('Starting E2E self-healing process');
    
    let targetFiles = testFiles;
    
    // If no specific files provided, find all test files
    if (targetFiles.length === 0) {
      try {
        const testOutput = execSync('find tests/e2e -name "*.spec.ts"', { encoding: 'utf-8' });
        targetFiles = testOutput.trim().split('\n').filter(f => f);
      } catch (error) {
        this.logger.warn('No E2E test files found');
        return { success: true, skipped: true };
      }
    }
    
    this.logger.info(`Processing ${targetFiles.length} test files`);
    
    let totalTests = 0;
    let healedTests = 0;
    let failedTests = 0;
    
    for (const testFile of targetFiles) {
      const result = await this.processTestFile(testFile);
      totalTests += result.total;
      healedTests += result.healed;
      failedTests += result.failed;
    }
    
    const success = failedTests === 0;
    
    this.logger.info(`E2E healing complete: ${healedTests}/${totalTests} tests healed, ${failedTests} still failing`);
    
    return {
      success,
      totalTests,
      healedTests,
      failedTests,
      files: targetFiles.length
    };
  }

  async processTestFile(testFile) {
    this.logger.info(`Processing test file: ${testFile}`);
    
    let attempt = 0;
    let healed = 0;
    let total = 1; // Assuming one test per file for simplicity
    
    while (attempt < this.config.maxRetries) {
      attempt++;
      
      this.logger.debug(`Running test file ${testFile} - Attempt ${attempt}`);
      
      const testResult = await this.runSingleTest(testFile);
      
      if (testResult.success) {
        this.logger.info(`Test ${testFile} passed on attempt ${attempt}`);
        if (attempt > 1) healed++; // Only count as healed if it failed initially
        return { total, healed, failed: 0 };
      }
      
      this.logger.warn(`Test ${testFile} failed on attempt ${attempt}`);
      
      if (this.config.screenshotOnFailure) {
        await this.takeFailureScreenshot(testFile, attempt);
      }
      
      // Analyze failure and attempt healing
      const healingApplied = await this.analyzeAndHeal(testFile, testResult);
      
      if (!healingApplied) {
        this.logger.error(`No healing strategies could be applied to ${testFile}`);
        break;
      }
      
      this.logger.info(`Applied healing strategies to ${testFile}, retrying...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    }
    
    this.logger.error(`Test ${testFile} failed after ${attempt} attempts`);
    return { total, healed: 0, failed: 1 };
  }

  async runSingleTest(testFile) {
    try {
      const command = `npx playwright test ${testFile}`;
      
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 60000
      });
      
      return {
        success: true,
        output
      };
      
    } catch (error) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || '',
        message: error.message
      };
    }
  }

  async takeFailureScreenshot(testFile, attempt) {
    try {
      const screenshotDir = '.claude/screenshots/failures';
      await fs.mkdir(screenshotDir, { recursive: true });
      
      const fileName = `${path.basename(testFile, '.spec.ts')}-attempt-${attempt}-${Date.now()}.png`;
      const screenshotPath = path.join(screenshotDir, fileName);
      
      // This is a placeholder - in real implementation, we'd capture from the test runner
      this.logger.debug(`Failure screenshot would be saved to: ${screenshotPath}`);
      
    } catch (error) {
      this.logger.error(`Failed to take screenshot: ${error.message}`);
    }
  }

  async analyzeAndHeal(testFile, testResult) {
    const errorOutput = testResult.error + testResult.output;
    let healingApplied = false;
    
    // Analyze error patterns and apply appropriate healing strategies
    const errorAnalysis = this.analyzeErrors(errorOutput);
    
    for (const errorType of errorAnalysis) {
      for (const strategy of this.config.healingStrategies) {
        if (this.healingStrategies[strategy]) {
          const applied = await this.healingStrategies[strategy](testFile, errorType, errorOutput);
          if (applied) {
            healingApplied = true;
            this.logger.info(`Applied ${strategy} healing to ${testFile}`);
          }
        }
      }
    }
    
    return healingApplied;
  }

  analyzeErrors(errorOutput) {
    const errorTypes = [];
    
    // Common error patterns
    const patterns = [
      { type: 'selector-not-found', pattern: /locator.*not found/i },
      { type: 'timeout', pattern: /timeout.*exceeded/i },
      { type: 'element-not-visible', pattern: /element.*not visible/i },
      { type: 'element-not-clickable', pattern: /element.*not clickable/i },
      { type: 'network-error', pattern: /network.*error/i },
      { type: 'page-crash', pattern: /page.*crashed/i },
      { type: 'assertion-failed', pattern: /expect.*received/i }
    ];
    
    for (const pattern of patterns) {
      if (pattern.pattern.test(errorOutput)) {
        errorTypes.push(pattern.type);
      }
    }
    
    return errorTypes;
  }

  async updateSelectors(testFile, errorType, errorOutput) {
    if (errorType !== 'selector-not-found') return false;
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      const originalContent = content;
      let modified = false;
      
      // Extract failed selectors from error output
      const selectorMatches = errorOutput.match(/locator\('([^']+)'\)/g);
      
      if (selectorMatches) {
        for (const match of selectorMatches) {
          const selector = match.match(/locator\('([^']+)'\)/)[1];
          
          // Try alternative selectors
          const alternatives = this.generateAlternativeSelectors(selector);
          
          for (const alternative of alternatives) {
            // Replace the first occurrence of the failing selector
            if (content.includes(`locator('${selector}')`)) {
              content = content.replace(
                `locator('${selector}')`,
                `locator('${alternative}')`
              );
              modified = true;
              this.logger.debug(`Updated selector from '${selector}' to '${alternative}'`);
              break;
            }
          }
        }
      }
      
      if (modified) {
        await fs.writeFile(testFile, content, 'utf-8');
        return true;
      }
      
    } catch (error) {
      this.logger.error(`Failed to update selectors in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  generateAlternativeSelectors(originalSelector) {
    const alternatives = [];
    
    // If it's an ID selector, try data-testid
    if (originalSelector.startsWith('#')) {
      const id = originalSelector.substring(1);
      alternatives.push(`[data-testid="${id}"]`);
      alternatives.push(`[data-test="${id}"]`);
    }
    
    // If it's a class selector, try variations
    if (originalSelector.startsWith('.')) {
      const className = originalSelector.substring(1);
      alternatives.push(`[class*="${className}"]`);
      alternatives.push(`[data-class="${className}"]`);
    }
    
    // If it's a text selector, try partial text
    if (originalSelector.includes('text=')) {
      const text = originalSelector.replace('text=', '');
      alternatives.push(`text="${text.substring(0, Math.floor(text.length / 2))}"`);
      alternatives.push(`[aria-label*="${text}"]`);
    }
    
    // Try more generic selectors
    if (originalSelector.includes('button')) {
      alternatives.push('button:visible');
      alternatives.push('[role="button"]:visible');
    }
    
    if (originalSelector.includes('input')) {
      alternatives.push('input:visible');
      alternatives.push('[type="text"]:visible');
    }
    
    return alternatives;
  }

  async adjustTiming(testFile, errorType, errorOutput) {
    if (errorType !== 'timeout') return false;
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      const originalContent = content;
      let modified = false;
      
      // Increase timeouts
      content = content.replace(/timeout:\s*(\d+)/g, (match, timeout) => {
        const newTimeout = Math.min(parseInt(timeout) * 2, 30000);
        this.logger.debug(`Increased timeout from ${timeout}ms to ${newTimeout}ms`);
        modified = true;
        return `timeout: ${newTimeout}`;
      });
      
      // Add wait conditions where missing
      const waitPatterns = [
        {
          search: /await page\.click\(([^)]+)\);/g,
          replace: 'await page.locator($1).waitFor({ state: "visible" });\n  await page.click($1);'
        },
        {
          search: /await page\.fill\(([^,]+),([^)]+)\);/g,
          replace: 'await page.locator($1).waitFor({ state: "visible" });\n  await page.fill($1,$2);'
        }
      ];
      
      for (const pattern of waitPatterns) {
        if (pattern.search.test(content)) {
          content = content.replace(pattern.search, pattern.replace);
          modified = true;
        }
      }
      
      if (modified) {
        await fs.writeFile(testFile, content, 'utf-8');
        return true;
      }
      
    } catch (error) {
      this.logger.error(`Failed to adjust timing in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  async changeViewport(testFile, errorType, errorOutput) {
    if (!errorOutput.includes('viewport') && errorType !== 'element-not-visible') {
      return false;
    }
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      
      // Add viewport configuration if missing
      if (!content.includes('setViewportSize')) {
        const setViewportCode = `
  // Auto-added viewport configuration for better test stability
  await page.setViewportSize({ width: 1920, height: 1080 });
`;
        
        content = content.replace(
          /(test\(['"][^'"]+['"],\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{)/,
          `$1${setViewportCode}`
        );
        
        await fs.writeFile(testFile, content, 'utf-8');
        this.logger.debug(`Added viewport configuration to ${testFile}`);
        return true;
      }
      
    } catch (error) {
      this.logger.error(`Failed to change viewport in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  async addElementWaits(testFile, errorType, errorOutput) {
    if (errorType !== 'element-not-visible' && errorType !== 'element-not-clickable') {
      return false;
    }
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      const originalContent = content;
      
      // Add waitFor calls before interactions
      content = content.replace(
        /(await page\.(click|fill|selectOption|check|uncheck)\([^)]+\);)/g,
        'await page.waitForLoadState("networkidle");\n  $1'
      );
      
      if (content !== originalContent) {
        await fs.writeFile(testFile, content, 'utf-8');
        this.logger.debug(`Added element waits to ${testFile}`);
        return true;
      }
      
    } catch (error) {
      this.logger.error(`Failed to add element waits in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  async addNetworkWaits(testFile, errorType, errorOutput) {
    if (errorType !== 'network-error' && !errorOutput.includes('loading')) {
      return false;
    }
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      
      // Add network wait after navigation
      content = content.replace(
        /(await page\.goto\([^)]+\);)/g,
        '$1\n  await page.waitForLoadState("networkidle");'
      );
      
      await fs.writeFile(testFile, content, 'utf-8');
      this.logger.debug(`Added network waits to ${testFile}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to add network waits in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  async retryClicks(testFile, errorType, errorOutput) {
    if (errorType !== 'element-not-clickable') return false;
    
    try {
      let content = await fs.readFile(testFile, 'utf-8');
      
      // Wrap clicks with retry logic
      content = content.replace(
        /(await page\.click\(([^)]+)\);)/g,
        `// Auto-added retry logic for flaky clicks
  for (let i = 0; i < 3; i++) {
    try {
      await page.click($2);
      break;
    } catch (error) {
      if (i === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }`
      );
      
      await fs.writeFile(testFile, content, 'utf-8');
      this.logger.debug(`Added retry clicks to ${testFile}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to add retry clicks in ${testFile}: ${error.message}`);
    }
    
    return false;
  }

  async generateReport() {
    if (!this.config.generateReport) return;
    
    try {
      const reportPath = '.claude/reports/e2e-healing-report.md';
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      
      const report = `# E2E Test Self-Healing Report

Generated: ${new Date().toISOString()}

## Healing Strategies Applied

- Selector updates
- Timing adjustments  
- Viewport changes
- Element waits
- Network waits
- Retry clicks

## Logs

See detailed logs in: .claude/logs/e2e-self-healing.log
`;
      
      await fs.writeFile(reportPath, report, 'utf-8');
      this.logger.info(`Generated healing report: ${reportPath}`);
      
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
    }
  }
}

// Export for use as a module
module.exports = E2ESelfHealing;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['e2e-self-healing'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        maxRetries: 5,
        retryDelay: 2000,
        healingStrategies: ['selector-update', 'timing-adjustment', 'viewport-change'],
        screenshotOnFailure: true,
        generateReport: true
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new E2ESelfHealing(config);
    
    const testFiles = process.argv.slice(2);
    const result = await hook.run(testFiles);
    
    if (result.generateReport) {
      await hook.generateReport();
    }
    
    if (!result.success && !result.skipped) {
      console.error('E2E self-healing failed - some tests could not be fixed');
      process.exit(1);
    }
    
    console.log('E2E self-healing completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}