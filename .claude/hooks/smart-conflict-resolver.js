#!/usr/bin/env node

/**
 * Smart Conflict Resolution Hook
 * 
 * Prevents layout and routing conflicts in Next.js App Router
 * Detects 404 issues, layout inheritance problems, and route conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SmartConflictResolver {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.routeMap = new Map();
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
      await fs.appendFile('.claude/logs/smart-conflict-resolver.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  async run(changedFiles) {
    this.logger.info('Starting smart conflict resolution');
    
    // Filter relevant files (layouts and pages)
    const relevantFiles = changedFiles.filter(file => 
      (file.includes('layout.tsx') || file.includes('page.tsx') || file.includes('app/')) &&
      !file.includes('node_modules')
    );
    
    if (relevantFiles.length === 0) {
      this.logger.info('No layout or page files changed');
      return { success: true, skipped: true };
    }
    
    this.logger.info(`Analyzing ${relevantFiles.length} files for conflicts`);
    
    let totalIssues = 0;
    let fixedIssues = 0;
    
    // Build route map
    await this.buildRouteMap();
    
    // Check for route conflicts
    const routeConflicts = await this.checkRouteConflicts();
    totalIssues += routeConflicts.issues;
    fixedIssues += routeConflicts.fixed;
    
    // Check layout hierarchy
    const layoutIssues = await this.checkLayoutHierarchy(relevantFiles);
    totalIssues += layoutIssues.issues;
    fixedIssues += layoutIssues.fixed;
    
    // Test routes
    if (this.config.testAllRoutes) {
      const routeTests = await this.testAllRoutes();
      totalIssues += routeTests.issues;
      // Route tests don't fix issues, just detect them
    }
    
    const success = totalIssues === 0 || fixedIssues >= totalIssues * 0.8;
    
    this.logger.info(`Conflict resolution complete: ${fixedIssues}/${totalIssues} issues resolved`);
    
    return {
      success,
      totalIssues,
      fixedIssues,
      files: relevantFiles.length,
      routesTested: this.routeMap.size
    };
  }

  async buildRouteMap() {
    this.logger.info('Building route map');
    
    try {
      // Find all page and layout files
      const findOutput = execSync('find app -name "page.tsx" -o -name "layout.tsx" -o -name "page.js" -o -name "layout.js"', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      
      const files = findOutput.trim().split('\n').filter(f => f);
      
      for (const file of files) {
        const route = this.filePathToRoute(file);
        const type = file.includes('layout.') ? 'layout' : 'page';
        
        if (!this.routeMap.has(route)) {
          this.routeMap.set(route, { layouts: [], pages: [] });
        }
        
        this.routeMap.get(route)[type + 's'].push(file);
      }
      
      this.logger.debug(`Built route map with ${this.routeMap.size} routes`);
      
    } catch (error) {
      this.logger.error(`Failed to build route map: ${error.message}`);
    }
  }

  filePathToRoute(filePath) {
    // Convert file path to route
    // app/page.tsx -> /
    // app/about/page.tsx -> /about
    // app/(marketing)/homepage-v2/page.tsx -> /homepage-v2
    
    let route = filePath
      .replace(/^app/, '')
      .replace(/\/(page|layout)\.(tsx|ts|jsx|js)$/, '')
      .replace(/\/\([^)]+\)/g, '') // Remove route groups
      .replace(/\/$/, '') || '/';
    
    return route === '' ? '/' : route;
  }

  async checkRouteConflicts() {
    const result = { issues: 0, fixed: 0 };
    
    this.logger.info('Checking for route conflicts');
    
    for (const [route, files] of this.routeMap.entries()) {
      // Check for multiple pages at same route
      if (files.pages.length > 1) {
        result.issues++;
        this.logger.error(`Multiple pages found for route ${route}: ${files.pages.join(', ')}`);
        
        // Could implement automatic resolution here
        // For now, just report the conflict
      }
      
      // Check for conflicting route patterns
      const conflictingRoutes = this.findConflictingRoutes(route);
      if (conflictingRoutes.length > 0) {
        result.issues++;
        this.logger.warn(`Potential route conflicts for ${route}: ${conflictingRoutes.join(', ')}`);
      }
    }
    
    return result;
  }

  findConflictingRoutes(targetRoute) {
    const conflicts = [];
    
    for (const route of this.routeMap.keys()) {
      if (route !== targetRoute) {
        // Check for dynamic route conflicts
        // e.g., /user/[id] conflicts with /user/profile
        if (this.routesConflict(targetRoute, route)) {
          conflicts.push(route);
        }
      }
    }
    
    return conflicts;
  }

  routesConflict(route1, route2) {
    const segments1 = route1.split('/').filter(s => s);
    const segments2 = route2.split('/').filter(s => s);
    
    if (segments1.length !== segments2.length) {
      return false;
    }
    
    for (let i = 0; i < segments1.length; i++) {
      const seg1 = segments1[i];
      const seg2 = segments2[i];
      
      // If both are static and different, no conflict
      if (!seg1.startsWith('[') && !seg2.startsWith('[') && seg1 !== seg2) {
        return false;
      }
      
      // If one is dynamic and one is static, potential conflict
      if ((seg1.startsWith('[') && !seg2.startsWith('[')) ||
          (!seg1.startsWith('[') && seg2.startsWith('['))) {
        return true;
      }
    }
    
    return false;
  }

  async checkLayoutHierarchy(changedFiles) {
    const result = { issues: 0, fixed: 0 };
    
    this.logger.info('Checking layout hierarchy');
    
    for (const file of changedFiles) {
      if (!file.includes('layout.tsx')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf-8');
        const layoutIssues = await this.analyzeLayoutFile(file, content);
        
        result.issues += layoutIssues.issues;
        
        // Apply fixes if needed
        if (layoutIssues.fixes.length > 0) {
          const fixedContent = await this.applyLayoutFixes(content, layoutIssues.fixes);
          if (fixedContent !== content) {
            await fs.writeFile(file, fixedContent, 'utf-8');
            result.fixed += layoutIssues.fixes.length;
            this.logger.info(`Applied ${layoutIssues.fixes.length} layout fixes to ${file}`);
          }
        }
        
      } catch (error) {
        result.issues++;
        this.logger.error(`Error analyzing layout ${file}: ${error.message}`);
      }
    }
    
    return result;
  }

  async analyzeLayoutFile(filePath, content) {
    const analysis = { issues: 0, fixes: [] };
    
    // Check for fragment wrapper pattern
    if (this.shouldUseFragmentWrapper(filePath, content)) {
      analysis.issues++;
      analysis.fixes.push({
        type: 'fragment-wrapper',
        description: 'Use fragment wrapper to avoid layout conflicts'
      });
    }
    
    // Check for conflicting layout elements
    const conflicts = this.findLayoutConflicts(content);
    if (conflicts.length > 0) {
      analysis.issues += conflicts.length;
      analysis.fixes.push(...conflicts);
    }
    
    // Check for proper children rendering
    if (!content.includes('{children}')) {
      analysis.issues++;
      analysis.fixes.push({
        type: 'missing-children',
        description: 'Layout must render children'
      });
    }
    
    return analysis;
  }

  shouldUseFragmentWrapper(filePath, content) {
    // Check if this is a standalone page that conflicts with root layout
    const isStandalonePage = filePath.includes('homepage-v2') || 
                           filePath.includes('marketing') ||
                           content.includes('standalone') ||
                           content.includes('isolated');
    
    const hasComplexRootLayout = content.includes('SidebarNavigation') ||
                               content.includes('MainContent') ||
                               content.includes('DashboardLayout');
    
    return isStandalonePage && hasComplexRootLayout && !content.includes('<>');
  }

  findLayoutConflicts(content) {
    const conflicts = [];
    
    // Check for conflicting wrapper elements
    const wrappers = ['<main>', '<div className="app">', '<div className="layout">'];
    let wrapperCount = 0;
    
    for (const wrapper of wrappers) {
      if (content.includes(wrapper)) {
        wrapperCount++;
      }
    }
    
    if (wrapperCount > 1) {
      conflicts.push({
        type: 'multiple-wrappers',
        description: 'Multiple layout wrappers detected'
      });
    }
    
    // Check for style conflicts
    if (content.includes('className') && content.includes('style=')) {
      conflicts.push({
        type: 'style-conflicts',
        description: 'Both className and style attributes used'
      });
    }
    
    return conflicts;
  }

  async applyLayoutFixes(content, fixes) {
    let fixedContent = content;
    
    for (const fix of fixes) {
      switch (fix.type) {
        case 'fragment-wrapper':
          fixedContent = this.applyFragmentWrapper(fixedContent);
          break;
          
        case 'missing-children':
          fixedContent = this.addChildrenRendering(fixedContent);
          break;
          
        case 'multiple-wrappers':
          fixedContent = this.removeExtraWrappers(fixedContent);
          break;
      }
    }
    
    return fixedContent;
  }

  applyFragmentWrapper(content) {
    // Replace complex layout with fragment
    const layoutFunctionMatch = content.match(/(export default function \w+Layout[^{]*{)([^}]+)(})/s);
    
    if (layoutFunctionMatch) {
      const newBody = '\n  return <>{children}</>;\n';
      return content.replace(layoutFunctionMatch[0], 
        layoutFunctionMatch[1] + newBody + layoutFunctionMatch[3]);
    }
    
    return content;
  }

  addChildrenRendering(content) {
    // Add {children} if missing
    if (!content.includes('{children}')) {
      return content.replace(
        /(return\s*\([^)]*)(;|\))/s,
        '$1{children}$2'
      );
    }
    
    return content;
  }

  removeExtraWrappers(content) {
    // Remove redundant wrapper elements
    // This is a simplified version - would need more sophisticated logic
    return content
      .replace(/<div className="layout">\s*<main>/g, '<main>')
      .replace(/<\/main>\s*<\/div>/g, '</main>');
  }

  async testAllRoutes() {
    const result = { issues: 0, tested: 0 };
    
    if (!this.config.testAllRoutes) {
      return result;
    }
    
    this.logger.info('Testing all routes for 404 errors');
    
    // Check if server is running
    const serverRunning = await this.checkServer();
    if (!serverRunning) {
      this.logger.warn('Development server not running, skipping route tests');
      return result;
    }
    
    for (const route of this.routeMap.keys()) {
      const testResult = await this.testRoute(route);
      result.tested++;
      
      if (!testResult.success) {
        result.issues++;
        this.logger.error(`Route test failed: ${route} - ${testResult.error}`);
      } else {
        this.logger.debug(`Route test passed: ${route}`);
      }
    }
    
    return result;
  }

  async checkServer() {
    try {
      const response = await fetch('http://localhost:3002', {
        method: 'HEAD',
        timeout: 2000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async testRoute(route) {
    try {
      const response = await fetch(`http://localhost:3002${route}`, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'Claude-Code-Hook-Test'
        }
      });
      
      const success = response.status !== 404;
      
      return {
        success,
        status: response.status,
        error: success ? null : `Route returns 404: ${route}`
      };
      
    } catch (error) {
      return {
        success: false,
        status: null,
        error: `Network error: ${error.message}`
      };
    }
  }

  async suggestRouteGroups() {
    if (!this.config.suggestRouteGroups) return;
    
    // Analyze routes and suggest groupings
    const suggestions = [];
    const routes = Array.from(this.routeMap.keys());
    
    // Group marketing pages
    const marketingRoutes = routes.filter(route => 
      route.includes('homepage') || 
      route.includes('landing') ||
      route.includes('about')
    );
    
    if (marketingRoutes.length > 1) {
      suggestions.push({
        type: 'route-group',
        name: '(marketing)',
        routes: marketingRoutes,
        reason: 'Marketing pages should be grouped together'
      });
    }
    
    // Group dashboard pages
    const dashboardRoutes = routes.filter(route =>
      route.includes('dashboard') ||
      route.includes('profile') ||
      route.includes('settings')
    );
    
    if (dashboardRoutes.length > 1) {
      suggestions.push({
        type: 'route-group',
        name: '(app)',
        routes: dashboardRoutes,
        reason: 'Application pages should be grouped together'
      });
    }
    
    if (suggestions.length > 0) {
      this.logger.info('Route grouping suggestions:');
      for (const suggestion of suggestions) {
        this.logger.info(`  - Create ${suggestion.name} for: ${suggestion.routes.join(', ')}`);
        this.logger.info(`    Reason: ${suggestion.reason}`);
      }
    }
  }
}

// Export for use as a module
module.exports = SmartConflictResolver;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['smart-conflict-resolver'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        checkRouteConflicts: true,
        validateLayoutHierarchy: true,
        suggestRouteGroups: true,
        testAllRoutes: true,
        fragmentWrapper: true
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new SmartConflictResolver(config);
    
    // Get changed files from command line args or git
    let changedFiles = process.argv.slice(2);
    if (changedFiles.length === 0) {
      try {
        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
        changedFiles = gitOutput.trim().split('\n').filter(f => f);
      } catch (error) {
        // Default to all layout and page files
        try {
          const findOutput = execSync('find app -name "*.tsx" | grep -E "(page|layout)"', { encoding: 'utf-8' });
          changedFiles = findOutput.trim().split('\n').filter(f => f);
        } catch (findError) {
          console.error('Could not find layout/page files');
          process.exit(1);
        }
      }
    }
    
    const result = await hook.run(changedFiles);
    
    if (!result.success && !result.skipped) {
      console.error('Smart conflict resolution failed');
      process.exit(1);
    }
    
    console.log('Smart conflict resolution completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}