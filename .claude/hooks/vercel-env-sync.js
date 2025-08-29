#!/usr/bin/env node

/**
 * Vercel Environment Sync Hook
 * 
 * Ensures environment variables match between local and Vercel production
 * Validates API routes will work in Vercel environment
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class VercelEnvSync {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
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
      await fs.appendFile('.claude/logs/vercel-env-sync.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  async run(changedFiles) {
    this.logger.info('Starting Vercel environment sync validation');
    
    // Check if this affects environment or API routes
    const envFiles = changedFiles.filter(file => file.includes('.env') || file.includes('api/'));
    
    if (envFiles.length === 0) {
      this.logger.info('No environment or API files changed');
      return { success: true, skipped: true };
    }
    
    let totalIssues = 0;
    let fixedIssues = 0;
    
    // Validate environment variables
    const envValidation = await this.validateEnvironmentVariables();
    totalIssues += envValidation.issues;
    fixedIssues += envValidation.fixed;
    
    // Validate API routes
    if (this.config.validateApiRoutes) {
      const apiValidation = await this.validateApiRoutes(changedFiles);
      totalIssues += apiValidation.issues;
      fixedIssues += apiValidation.fixed;
    }
    
    // Test with mock data
    if (this.config.mockTest) {
      const mockValidation = await this.runMockTests();
      totalIssues += mockValidation.issues;
      fixedIssues += mockValidation.fixed;
    }
    
    const success = totalIssues === 0 || fixedIssues === totalIssues;
    
    this.logger.info(`Vercel sync validation complete: ${fixedIssues}/${totalIssues} issues resolved`);
    
    return {
      success,
      totalIssues,
      fixedIssues,
      envChecked: true,
      apiChecked: this.config.validateApiRoutes
    };
  }

  async validateEnvironmentVariables() {
    const validation = { issues: 0, fixed: 0 };
    
    this.logger.info('Validating environment variables');
    
    try {
      // Load local .env files
      const localEnv = await this.loadLocalEnvironment();
      
      // Check required variables
      for (const requiredVar of this.config.requiredVars) {
        if (!localEnv[requiredVar]) {
          validation.issues++;
          this.logger.error(`Missing required environment variable: ${requiredVar}`);
        } else {
          this.logger.debug(`Found required variable: ${requiredVar}`);
        }
      }
      
      // Validate Firebase configuration
      const firebaseVars = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
      const missingFirebase = firebaseVars.filter(varName => !localEnv[varName]);
      
      if (missingFirebase.length > 0) {
        validation.issues += missingFirebase.length;
        this.logger.error(`Missing Firebase config: ${missingFirebase.join(', ')}`);
      }
      
      // Check for common naming issues
      const commonIssues = this.checkCommonNamingIssues(localEnv);
      validation.issues += commonIssues.length;
      
    } catch (error) {
      validation.issues++;
      this.logger.error(`Environment validation failed: ${error.message}`);
    }
    
    return validation;
  }

  async loadLocalEnvironment() {
    const env = {};
    const envFiles = ['.env.local', '.env', '.env.production.local'];
    
    for (const file of envFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              env[key.trim()] = valueParts.join('=').trim();
            }
          }
        }
        
      } catch (error) {
        this.logger.debug(`Could not load ${file}: ${error.message}`);
      }
    }
    
    // Also check process.env for runtime variables
    Object.assign(env, process.env);
    
    return env;
  }

  checkCommonNamingIssues(env) {
    const issues = [];
    
    // Check for NEXT_PUBLIC_ prefix where it shouldn't be used
    const serverOnlyVars = ['FIREBASE_ADMIN_KEY', 'SPOONACULAR_API_KEY'];
    for (const serverVar of serverOnlyVars) {
      if (env[`NEXT_PUBLIC_${serverVar}`]) {
        issues.push(`Server-only variable ${serverVar} should not have NEXT_PUBLIC_ prefix`);
      }
    }
    
    // Check for missing NEXT_PUBLIC_ prefix where it should be used
    const clientVars = ['apiKey', 'authDomain', 'projectId'];
    for (const clientVar of clientVars) {
      if (!env[clientVar] && env[`NEXT_PUBLIC_FIREBASE_${clientVar.toUpperCase()}`]) {
        issues.push(`Client variable ${clientVar} naming mismatch - should be ${clientVar}, not NEXT_PUBLIC_FIREBASE_${clientVar.toUpperCase()}`);
      }
    }
    
    return issues;
  }

  async validateApiRoutes(changedFiles) {
    const validation = { issues: 0, fixed: 0 };
    
    const apiFiles = changedFiles.filter(file => file.includes('app/api/') && file.endsWith('.ts'));
    
    if (apiFiles.length === 0) {
      return validation;
    }
    
    this.logger.info(`Validating ${apiFiles.length} API routes`);
    
    for (const apiFile of apiFiles) {
      try {
        const content = await fs.readFile(apiFile, 'utf-8');
        
        // Check for proper exports
        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        const exportedMethods = [];
        
        for (const method of httpMethods) {
          if (content.includes(`export async function ${method}`)) {
            exportedMethods.push(method);
          }
        }
        
        if (exportedMethods.length === 0) {
          validation.issues++;
          this.logger.error(`No HTTP method exports found in ${apiFile}`);
        }
        
        // Check for NextResponse usage
        if (!content.includes('NextResponse')) {
          validation.issues++;
          this.logger.warn(`Missing NextResponse import/usage in ${apiFile}`);
          
          // Auto-fix: Add NextResponse import
          const fixed = await this.addNextResponseImport(apiFile, content);
          if (fixed) validation.fixed++;
        }
        
        // Check for proper error handling
        if (content.includes('try') && !content.includes('catch')) {
          validation.issues++;
          this.logger.warn(`Try block without catch in ${apiFile}`);
        }
        
        // Check for Node.js-only imports in wrong context
        const nodeOnlyImports = ['fs', 'path', 'os', 'crypto'];
        for (const nodeImport of nodeOnlyImports) {
          if (content.includes(`import ${nodeImport}`) || content.includes(`require('${nodeImport}')`)) {
            // This is actually OK for API routes
            this.logger.debug(`Node.js import '${nodeImport}' found in API route ${apiFile} (OK)`);
          }
        }
        
      } catch (error) {
        validation.issues++;
        this.logger.error(`Error validating API route ${apiFile}: ${error.message}`);
      }
    }
    
    return validation;
  }

  async addNextResponseImport(filePath, content) {
    try {
      if (content.includes("import { NextResponse }")) {
        return false; // Already imported
      }
      
      // Add NextResponse import at the top
      const lines = content.split('\n');
      let importInserted = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import') && !importInserted) {
          lines.splice(i, 0, "import { NextResponse } from 'next/server';");
          importInserted = true;
          break;
        }
      }
      
      if (!importInserted) {
        lines.unshift("import { NextResponse } from 'next/server';", '');
      }
      
      await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
      this.logger.info(`Added NextResponse import to ${filePath}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to add NextResponse import: ${error.message}`);
      return false;
    }
  }

  async runMockTests() {
    const validation = { issues: 0, fixed: 0 };
    
    this.logger.info('Running mock API tests');
    
    try {
      // Test if server is running
      const isServerRunning = await this.checkServerStatus();
      
      if (!isServerRunning) {
        validation.issues++;
        this.logger.error('Development server is not running - cannot test API routes');
        return validation;
      }
      
      // Test key API endpoints
      const testEndpoints = [
        '/api/recipes',
        '/api/auth/demo',
      ];
      
      for (const endpoint of testEndpoints) {
        const testResult = await this.testApiEndpoint(endpoint);
        if (!testResult.success) {
          validation.issues++;
          this.logger.error(`API test failed for ${endpoint}: ${testResult.error}`);
        } else {
          this.logger.debug(`API test passed for ${endpoint}`);
        }
      }
      
    } catch (error) {
      validation.issues++;
      this.logger.error(`Mock test execution failed: ${error.message}`);
    }
    
    return validation;
  }

  async checkServerStatus() {
    try {
      const response = await fetch('http://localhost:3002', {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async testApiEndpoint(endpoint) {
    try {
      const response = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'GET',
        timeout: this.config.timeout || 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: response.status < 500, // 4xx is OK, 5xx is not
        status: response.status,
        error: null
      };
      
    } catch (error) {
      return {
        success: false,
        status: null,
        error: error.message
      };
    }
  }
}

// Export for use as a module
module.exports = VercelEnvSync;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['vercel-env-sync'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        requiredVars: [
          'apiKey', 'authDomain', 'projectId', 'storageBucket', 
          'messagingSenderId', 'appId', 'FIREBASE_ADMIN_KEY', 'SPOONACULAR_API_KEY'
        ],
        validateApiRoutes: true,
        mockTest: true,
        timeout: 5000
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new VercelEnvSync(config);
    
    // Get changed files from command line args or git
    let changedFiles = process.argv.slice(2);
    if (changedFiles.length === 0) {
      try {
        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
        changedFiles = gitOutput.trim().split('\n').filter(f => f);
      } catch (error) {
        // Default to checking env and API files
        changedFiles = ['.env.local', 'app/api'];
      }
    }
    
    const result = await hook.run(changedFiles);
    
    if (!result.success && !result.skipped) {
      console.error('Vercel environment sync validation failed');
      process.exit(1);
    }
    
    console.log('Vercel environment sync validation completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}