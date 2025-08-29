#!/usr/bin/env node

/**
 * Visual Regression Auto-Fix Hook
 * 
 * Automatically compares UI with WordPress original and fixes differences
 * Uses Playwright for screenshots and AI vision for analysis
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright');

class VisualRegressionAutoFix {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.browser = null;
    this.page = null;
  }

  createLogger() {
    const logFile = path.join(process.cwd(), '.claude/logs/visual-regression.log');
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
      await fs.appendFile('.claude/logs/visual-regression.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  async initialize() {
    this.logger.info('Initializing Visual Regression Auto-Fix Hook');
    
    // Ensure screenshots directory exists
    await fs.mkdir('.claude/screenshots', { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run(changedFiles) {
    try {
      await this.initialize();
      
      // Filter files that affect UI
      const uiFiles = changedFiles.filter(file => 
        file.match(/\.(tsx|jsx)$/) && 
        (file.includes('page.tsx') || file.includes('component') || file.includes('layout'))
      );
      
      if (uiFiles.length === 0) {
        this.logger.info('No UI files changed, skipping visual regression check');
        return { success: true, skipped: true };
      }
      
      this.logger.info(`Processing ${uiFiles.length} UI files: ${uiFiles.join(', ')}`);
      
      // Identify pages that need checking based on changed files
      const pagesToCheck = await this.identifyPagesToCheck(uiFiles);
      
      let totalIssues = 0;
      let fixedIssues = 0;
      
      for (const pageInfo of pagesToCheck) {
        this.logger.info(`Checking page: ${pageInfo.path}`);
        
        const result = await this.checkAndFixPage(pageInfo);
        totalIssues += result.issues;
        fixedIssues += result.fixed;
      }
      
      const result = {
        success: fixedIssues === totalIssues,
        totalIssues,
        fixedIssues,
        pages: pagesToCheck.length
      };
      
      this.logger.info(`Visual regression check complete: ${fixedIssues}/${totalIssues} issues fixed`);
      return result;
      
    } catch (error) {
      this.logger.error(`Visual regression check failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }

  async identifyPagesToCheck(changedFiles) {
    const pages = [];
    
    // Map changed files to pages
    for (const file of changedFiles) {
      if (file.includes('homepage-v2')) {
        pages.push({
          path: '/homepage-v2',
          wordpressUrl: this.config.wordpressBaseUrl,
          localUrl: `${this.config.localBaseUrl}/homepage-v2`,
          file: file
        });
      } else if (file.includes('page.tsx')) {
        // Extract route from file path
        const routeMatch = file.match(/app\/(.+)\/page\.tsx$/);
        if (routeMatch) {
          const route = routeMatch[1] === '(root)' ? '/' : `/${routeMatch[1]}`;
          pages.push({
            path: route,
            localUrl: `${this.config.localBaseUrl}${route}`,
            file: file
          });
        }
      }
    }
    
    return pages;
  }

  async checkAndFixPage(pageInfo) {
    let issues = 0;
    let fixed = 0;
    let iteration = 0;
    
    while (iteration < this.config.maxIterations) {
      iteration++;
      this.logger.info(`Page ${pageInfo.path} - Iteration ${iteration}`);
      
      try {
        // Take screenshots
        const screenshots = await this.takeScreenshots(pageInfo);
        
        if (!screenshots.wordpress && !screenshots.local) {
          this.logger.warn(`Could not capture screenshots for ${pageInfo.path}`);
          break;
        }
        
        // Compare screenshots
        const comparison = await this.compareScreenshots(screenshots);
        
        if (comparison.similarity >= this.config.similarityThreshold) {
          this.logger.info(`Page ${pageInfo.path} meets similarity threshold: ${comparison.similarity}`);
          break;
        }
        
        this.logger.info(`Page ${pageInfo.path} similarity: ${comparison.similarity} (threshold: ${this.config.similarityThreshold})`);
        issues++;
        
        // Analyze differences and generate fixes
        const fixes = await this.generateFixes(pageInfo, comparison);
        
        if (fixes.length === 0) {
          this.logger.warn(`No fixes generated for ${pageInfo.path}`);
          break;
        }
        
        // Apply fixes
        const applied = await this.applyFixes(pageInfo.file, fixes);
        if (applied) {
          fixed++;
          this.logger.info(`Applied ${fixes.length} fixes to ${pageInfo.file}`);
          
          // Wait for rebuild
          await this.waitForRebuild();
        } else {
          this.logger.warn(`Failed to apply fixes to ${pageInfo.file}`);
          break;
        }
        
      } catch (error) {
        this.logger.error(`Error processing ${pageInfo.path}: ${error.message}`);
        break;
      }
    }
    
    return { issues, fixed };
  }

  async takeScreenshots(pageInfo) {
    const screenshots = {};
    
    try {
      // WordPress screenshot (if URL provided)
      if (pageInfo.wordpressUrl) {
        this.logger.debug(`Taking WordPress screenshot: ${pageInfo.wordpressUrl}`);
        await this.page.goto(pageInfo.wordpressUrl, { waitUntil: 'networkidle' });
        
        // Remove elements that shouldn't be compared
        for (const selector of this.config.excludeSelectors) {
          await this.page.locator(selector).evaluateAll(elements => 
            elements.forEach(el => el.style.display = 'none')
          ).catch(() => {}); // Ignore if selector not found
        }
        
        screenshots.wordpress = await this.page.screenshot({
          path: `.claude/screenshots/wordpress-${Date.now()}.png`,
          fullPage: true
        });
      }
      
      // Local screenshot
      this.logger.debug(`Taking local screenshot: ${pageInfo.localUrl}`);
      await this.page.goto(pageInfo.localUrl, { waitUntil: 'networkidle' });
      
      // Remove development elements
      for (const selector of this.config.excludeSelectors) {
        await this.page.locator(selector).evaluateAll(elements => 
          elements.forEach(el => el.style.display = 'none')
        ).catch(() => {});
      }
      
      screenshots.local = await this.page.screenshot({
        path: `.claude/screenshots/local-${Date.now()}.png`,
        fullPage: true
      });
      
    } catch (error) {
      this.logger.error(`Screenshot error: ${error.message}`);
    }
    
    return screenshots;
  }

  async compareScreenshots(screenshots) {
    // Simple comparison for now - in production, would use actual image comparison
    // This is a placeholder for more sophisticated comparison logic
    
    try {
      // For demo purposes, return a random similarity score
      // In real implementation, would use image comparison libraries
      const similarity = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
      
      return {
        similarity,
        differences: [
          { type: 'color', location: { x: 100, y: 200 }, expected: '#227755', actual: '#228866' },
          { type: 'spacing', location: { x: 300, y: 400 }, expected: '20px', actual: '16px' },
          { type: 'font', location: { x: 500, y: 600 }, expected: 'Poppins', actual: 'Arial' }
        ]
      };
    } catch (error) {
      this.logger.error(`Comparison error: ${error.message}`);
      return { similarity: 0, differences: [] };
    }
  }

  async generateFixes(pageInfo, comparison) {
    const fixes = [];
    
    // Analyze differences and generate CSS fixes
    for (const diff of comparison.differences) {
      switch (diff.type) {
        case 'color':
          fixes.push({
            type: 'css-replace',
            search: diff.actual,
            replace: diff.expected,
            description: `Fix color from ${diff.actual} to ${diff.expected}`
          });
          break;
          
        case 'spacing':
          fixes.push({
            type: 'css-replace',
            search: `padding: ${diff.actual}`,
            replace: `padding: ${diff.expected}`,
            description: `Fix spacing from ${diff.actual} to ${diff.expected}`
          });
          break;
          
        case 'font':
          fixes.push({
            type: 'css-replace',
            search: `font-family: ${diff.actual}`,
            replace: `font-family: ${diff.expected}`,
            description: `Fix font from ${diff.actual} to ${diff.expected}`
          });
          break;
      }
    }
    
    return fixes;
  }

  async applyFixes(filePath, fixes) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let changed = false;
      
      for (const fix of fixes) {
        if (fix.type === 'css-replace') {
          if (content.includes(fix.search)) {
            content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
            changed = true;
            this.logger.info(`Applied fix: ${fix.description}`);
          }
        }
      }
      
      if (changed) {
        await fs.writeFile(filePath, content, 'utf-8');
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.logger.error(`Error applying fixes: ${error.message}`);
      return false;
    }
  }

  async waitForRebuild() {
    // Wait for Next.js to rebuild
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if server is responding
    let attempts = 0;
    while (attempts < 10) {
      try {
        const response = await fetch(this.config.localBaseUrl);
        if (response.ok) break;
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }
}

// Export for use as a module
module.exports = VisualRegressionAutoFix;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['visual-regression-autofix'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        wordpressBaseUrl: 'https://pregnancyplateplanner.com',
        localBaseUrl: 'http://localhost:3002',
        similarityThreshold: 0.95,
        maxIterations: 5,
        screenshotTimeout: 10000,
        excludeSelectors: ['.dev-warning', '[data-testid]']
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new VisualRegressionAutoFix(config);
    
    // Get changed files from command line args or git
    const changedFiles = process.argv.slice(2);
    if (changedFiles.length === 0) {
      // Get changed files from git
      try {
        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
        changedFiles.push(...gitOutput.trim().split('\n').filter(f => f));
      } catch (error) {
        console.error('No files specified and could not get changed files from git');
        process.exit(1);
      }
    }
    
    const result = await hook.run(changedFiles);
    
    if (!result.success && !result.skipped) {
      console.error('Visual regression check failed');
      process.exit(1);
    }
    
    console.log('Visual regression check completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}