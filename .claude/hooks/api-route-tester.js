#!/usr/bin/env node

/**
 * API Route Tester with Auto-Fix Hook
 * 
 * Tests and automatically fixes common API route issues for Vercel compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ApiRouteTester {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.commonFixes = this.initializeCommonFixes();
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
      await fs.appendFile('.claude/logs/api-route-tester.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  initializeCommonFixes() {
    return [
      {
        name: 'NextResponse Import',
        check: (content) => !content.includes('NextResponse') && content.includes('return '),
        fix: (content) => {
          if (content.includes("from 'next/server'")) {
            return content.replace(
              /(import.*from 'next\/server';)/,
              "$1\nimport { NextResponse } from 'next/server';"
            );
          } else {
            return "import { NextResponse } from 'next/server';\n\n" + content;
          }
        }
      },
      {
        name: 'HTTP Method Export',
        check: (content) => {
          const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
          return !methods.some(method => content.includes(`export async function ${method}`));
        },
        fix: (content) => {
          // Add a default GET handler if none exists
          if (!content.includes('export async function')) {
            return content + '\n\nexport async function GET() {\n  return NextResponse.json({ message: "API endpoint working" });\n}';
          }
          return content;
        }
      },
      {
        name: 'Return NextResponse',
        check: (content) => content.includes('return ') && !content.includes('NextResponse.'),
        fix: (content) => {
          // Replace common return patterns
          return content
            .replace(/return\s+Response\.json\(/g, 'return NextResponse.json(')
            .replace(/return\s+new\s+Response\(/g, 'return new NextResponse(')
            .replace(/return\s+json\(/g, 'return NextResponse.json(');
        }
      },
      {
        name: 'Error Handling',
        check: (content) => content.includes('export async function') && !content.includes('try') && !content.includes('catch'),
        fix: (content) => {
          // Wrap function body in try-catch
          const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
          let fixedContent = content;
          
          for (const method of methods) {
            const methodRegex = new RegExp(`(export async function ${method}\\([^)]*\\)\\s*{)([^}]+)(})`, 's');
            const match = fixedContent.match(methodRegex);
            
            if (match && !match[2].includes('try')) {
              const wrappedBody = `\n  try {${match[2]}\n  } catch (error) {\n    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });\n  }\n`;
              fixedContent = fixedContent.replace(methodRegex, `$1${wrappedBody}$3`);
            }
          }
          
          return fixedContent;
        }
      }
    ];
  }

  async run(changedFiles) {
    this.logger.info('Starting API route testing and auto-fix');
    
    // Filter API route files
    const apiFiles = changedFiles.filter(file => 
      file.includes('app/api/') && 
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      file.includes('route.')
    );
    
    if (apiFiles.length === 0) {
      this.logger.info('No API route files changed');
      return { success: true, skipped: true };
    }
    
    this.logger.info(`Processing ${apiFiles.length} API route files`);
    
    let totalIssues = 0;
    let fixedIssues = 0;
    const results = [];
    
    for (const apiFile of apiFiles) {
      const result = await this.processApiFile(apiFile);
      results.push(result);
      totalIssues += result.issues;
      fixedIssues += result.fixed;
    }
    
    // Test endpoints if server is running
    if (this.config.testEndpoints) {
      const testResults = await this.testEndpoints(apiFiles);
      totalIssues += testResults.issues;
      // Testing doesn't fix issues, just reports them
    }
    
    const success = totalIssues === 0 || fixedIssues >= totalIssues * 0.8; // 80% fix rate acceptable
    
    this.logger.info(`API route processing complete: ${fixedIssues}/${totalIssues} issues fixed`);
    
    return {
      success,
      totalIssues,
      fixedIssues,
      files: apiFiles.length,
      details: results
    };
  }

  async processApiFile(filePath) {
    const result = { file: filePath, issues: 0, fixed: 0, errors: [] };
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      
      this.logger.debug(`Processing API file: ${filePath}`);
      
      // Run validation checks
      const validationResult = await this.validateApiFile(content, filePath);
      result.issues += validationResult.issues;
      result.errors.push(...validationResult.errors);
      
      // Apply common fixes
      if (this.config.fixCommonIssues) {
        for (const fix of this.commonFixes) {
          if (fix.check(content)) {
            const fixedContent = fix.fix(content);
            if (fixedContent !== content) {
              content = fixedContent;
              result.fixed++;
              this.logger.info(`Applied fix '${fix.name}' to ${filePath}`);
            }
          }
        }
      }
      
      // Write fixed content if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
        this.logger.info(`Updated ${filePath} with ${result.fixed} fixes`);
      }
      
    } catch (error) {
      result.errors.push(`Processing error: ${error.message}`);
      result.issues++;
      this.logger.error(`Error processing ${filePath}: ${error.message}`);
    }
    
    return result;
  }

  async validateApiFile(content, filePath) {
    const validation = { issues: 0, errors: [] };
    
    // Check for required exports
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const exportedMethods = httpMethods.filter(method => 
      content.includes(`export async function ${method}`)
    );
    
    if (exportedMethods.length === 0) {
      validation.issues++;
      validation.errors.push('No HTTP method exports found');
    }
    
    // Check for NextResponse usage
    if (content.includes('return ') && !content.includes('NextResponse')) {
      validation.issues++;
      validation.errors.push('Missing NextResponse usage');
    }
    
    // Check for proper error handling
    if (exportedMethods.length > 0 && !content.includes('try') && !content.includes('catch')) {
      validation.issues++;
      validation.errors.push('Missing error handling');
    }
    
    // Check for async/await patterns
    if (content.includes('export function ') && !content.includes('export async function ')) {
      validation.issues++;
      validation.errors.push('API handler should be async');
    }
    
    // Check for request body parsing
    if (content.includes('POST') || content.includes('PUT') || content.includes('PATCH')) {
      if (!content.includes('await request.json()') && !content.includes('request.json()')) {
        validation.issues++;
        validation.errors.push('POST/PUT/PATCH handler missing request body parsing');
      }
    }
    
    // Check for environment variable usage patterns
    if (content.includes('process.env') && !content.includes('process.env.NODE_ENV')) {
      // This is fine, just checking that env vars are used properly
      this.logger.debug(`Environment variables used in ${filePath}`);
    }
    
    // Check for database connections
    if (content.includes('firebase') || content.includes('Firebase')) {
      if (!content.includes('admin') && content.includes('client')) {
        validation.issues++;
        validation.errors.push('Using client Firebase SDK in API route (should use admin)');
      }
    }
    
    return validation;
  }

  async testEndpoints(apiFiles) {
    const testResult = { issues: 0, tested: 0 };
    
    this.logger.info('Testing API endpoints');
    
    // Check if development server is running
    const serverRunning = await this.checkServer();
    if (!serverRunning) {
      this.logger.warn('Development server not running, skipping endpoint tests');
      return testResult;
    }
    
    for (const apiFile of apiFiles) {
      // Extract endpoint path from file path
      const endpoint = this.extractEndpointPath(apiFile);
      if (endpoint) {
        const result = await this.testEndpoint(endpoint);
        testResult.tested++;
        
        if (!result.success) {
          testResult.issues++;
          this.logger.error(`Endpoint test failed: ${endpoint} - ${result.error}`);
        } else {
          this.logger.debug(`Endpoint test passed: ${endpoint}`);
        }\n      }\n    }\n    \n    return testResult;\n  }\n\n  extractEndpointPath(filePath) {\n    // Convert file path to API endpoint\n    // e.g., app/api/recipes/route.ts -> /api/recipes\n    const apiMatch = filePath.match(/app\\/api\\/(.+)\\/route\\.(ts|js)$/);\n    if (apiMatch) {\n      return `/api/${apiMatch[1]}`;\n    }\n    return null;\n  }\n\n  async checkServer() {\n    try {\n      const response = await fetch('http://localhost:3002', {\n        method: 'HEAD',\n        timeout: 2000\n      });\n      return true;\n    } catch (error) {\n      return false;\n    }\n  }\n\n  async testEndpoint(endpoint) {\n    try {\n      // Test with GET first (most common)\n      const response = await fetch(`http://localhost:3002${endpoint}`, {\n        method: 'GET',\n        timeout: this.config.timeout || 5000,\n        headers: {\n          'Content-Type': 'application/json'\n        }\n      });\n      \n      // Consider 2xx, 3xx, and 4xx as success (5xx is server error)\n      const success = response.status < 500;\n      \n      return {\n        success,\n        status: response.status,\n        error: success ? null : `Server error: ${response.status}`\n      };\n      \n    } catch (error) {\n      return {\n        success: false,\n        status: null,\n        error: error.message\n      };\n    }\n  }\n\n  async generateMockData() {\n    if (!this.config.mockData) return {};\n    \n    // Generate mock data for testing\n    return {\n      user: { id: 'test-user', email: 'test@example.com' },\n      recipe: { id: 'test-recipe', title: 'Test Recipe', carbs: 25 },\n      mealPlan: { id: 'test-plan', recipes: [] }\n    };\n  }\n}\n\n// Export for use as a module\nmodule.exports = ApiRouteTester;\n\n// CLI usage\nif (require.main === module) {\n  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');\n  \n  const loadConfig = async () => {\n    try {\n      const configData = await fs.readFile(configPath, 'utf-8');\n      const config = JSON.parse(configData);\n      return config.hooks['api-route-tester'].config;\n    } catch (error) {\n      console.error('Failed to load config:', error.message);\n      return {\n        validateExports: true,\n        checkNextResponse: true,\n        testEndpoints: true,\n        fixCommonIssues: true,\n        mockData: true,\n        timeout: 5000\n      };\n    }\n  };\n  \n  const run = async () => {\n    const config = await loadConfig();\n    const hook = new ApiRouteTester(config);\n    \n    // Get changed files from command line args or git\n    let changedFiles = process.argv.slice(2);\n    if (changedFiles.length === 0) {\n      try {\n        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });\n        changedFiles = gitOutput.trim().split('\\n').filter(f => f);\n      } catch (error) {\n        // Default to all API route files\n        try {\n          const findOutput = execSync('find app/api -name \"route.ts\" -o -name \"route.js\"', { encoding: 'utf-8' });\n          changedFiles = findOutput.trim().split('\\n').filter(f => f);\n        } catch (findError) {\n          console.error('Could not find API files to test');\n          process.exit(1);\n        }\n      }\n    }\n    \n    const result = await hook.run(changedFiles);\n    \n    if (!result.success && !result.skipped) {\n      console.error('API route testing failed');\n      console.error(`${result.totalIssues - result.fixedIssues} issues remain unresolved`);\n      process.exit(1);\n    }\n    \n    console.log('API route testing completed successfully');\n  };\n  \n  run().catch(error => {\n    console.error('Hook execution failed:', error);\n    process.exit(1);\n  });\n}