#!/usr/bin/env node

/**
 * Build Error Auto-Remediation Hook
 * 
 * Automatically fixes common build errors before commits
 * Handles apostrophes, quotes, TypeScript issues, and import problems
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class BuildErrorRemediation {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.fixPatterns = this.initializeFixPatterns();
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
      await fs.appendFile('.claude/logs/build-error-remediation.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  initializeFixPatterns() {
    return {
      apostrophe: [
        // Common apostrophe issues
        { 
          pattern: /Don't/g, 
          replacement: "Don\\'t",
          description: "Escape apostrophe in Don't"
        },
        { 
          pattern: /Can't/g, 
          replacement: "Can\\'t",
          description: "Escape apostrophe in Can't"
        },
        { 
          pattern: /Won't/g, 
          replacement: "Won\\'t",
          description: "Escape apostrophe in Won't"
        },
        {
          pattern: /(\w)'(\w)/g,
          replacement: "$1\\'$2",
          description: "Escape apostrophes in contractions"
        }
      ],
      quotes: [
        // Quote escaping issues
        {
          pattern: /title="([^"]*)"([^>]*>)/g,
          replacement: 'title=\\"$1\\"$2',
          description: "Escape quotes in title attributes"
        },
        {
          pattern: /alt="([^"]*)"([^>]*>)/g,
          replacement: 'alt=\\"$1\\"$2',
          description: "Escape quotes in alt attributes"
        },
        {
          pattern: /placeholder="([^"]*)"([^>]*>)/g,
          replacement: 'placeholder=\\"$1\\"$2',
          description: "Escape quotes in placeholder attributes"
        }
      ],
      typescript: [
        // Common TypeScript issues
        {
          pattern: /interface\s+(\w+)\s*{/g,
          replacement: "interface $1 {",
          description: "Fix interface spacing"
        },
        {
          pattern: /:\s*any\s*;/g,
          replacement: ": unknown;",
          description: "Replace any with unknown for better type safety"
        },
        {
          pattern: /React\.FC</g,
          replacement: "React.FunctionComponent<",
          description: "Use full FunctionComponent instead of FC"
        }
      ],
      imports: [
        // Import/export issues
        {
          pattern: /from\s+['"](.+)['"](?!\s*;)/g,
          replacement: "from '$1';",
          description: "Add missing semicolon to import statement"
        },
        {
          pattern: /export\s+default\s+function\s+(\w+)/g,
          replacement: "export default function $1",
          description: "Fix default export function syntax"
        }
      ]
    };
  }

  async run(changedFiles) {
    this.logger.info('Starting build error remediation');
    
    // Filter relevant files
    const relevantFiles = changedFiles.filter(file => 
      file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('node_modules')
    );
    
    if (relevantFiles.length === 0) {
      this.logger.info('No relevant files to check');
      return { success: true, skipped: true };
    }
    
    let iteration = 0;
    let totalIssuesFixed = 0;
    
    while (iteration < this.config.maxIterations) {
      iteration++;
      this.logger.info(`Build remediation iteration ${iteration}`);
      
      // First, try to build and capture errors
      const buildResult = await this.runBuildCommands();
      
      if (buildResult.success) {
        this.logger.info(`Build successful after ${iteration} iteration(s), ${totalIssuesFixed} issues fixed`);
        return { 
          success: true, 
          iterations: iteration,
          issuesFixed: totalIssuesFixed,
          files: relevantFiles.length
        };
      }
      
      this.logger.warn(`Build failed, attempting to fix errors`);
      
      // Parse errors and apply fixes
      const fixesApplied = await this.parseAndFixErrors(buildResult.errors, relevantFiles);
      totalIssuesFixed += fixesApplied;
      
      if (fixesApplied === 0) {
        this.logger.error('No fixes could be applied, manual intervention needed');
        return {
          success: false,
          iterations: iteration,
          issuesFixed: totalIssuesFixed,
          errors: buildResult.errors,
          needsManualFix: true
        };
      }
      
      this.logger.info(`Applied ${fixesApplied} fixes, retrying build...`);
    }
    
    this.logger.error(`Max iterations (${this.config.maxIterations}) reached`);
    return {
      success: false,
      iterations: iteration,
      issuesFixed: totalIssuesFixed,
      maxIterationsReached: true
    };
  }

  async runBuildCommands() {
    const results = {
      success: false,
      errors: []
    };
    
    for (const command of this.config.buildCommands) {
      this.logger.debug(`Running: ${command}`);
      
      try {
        const output = execSync(command, {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 60000 // 1 minute timeout
        });
        
        this.logger.debug(`${command} completed successfully`);
        
      } catch (error) {
        this.logger.error(`${command} failed: ${error.message}`);
        
        results.errors.push({
          command,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          message: error.message
        });
        
        return results; // Return on first failure
      }
    }
    
    results.success = true;
    return results;
  }

  async parseAndFixErrors(errors, files) {
    let fixesApplied = 0;
    
    for (const error of errors) {
      const errorText = error.stderr + error.stdout;
      
      // Extract file paths and line numbers from error messages
      const fileErrors = this.extractFileErrors(errorText);
      
      for (const fileError of fileErrors) {
        if (files.includes(fileError.file)) {
          const applied = await this.fixFileErrors(fileError);
          fixesApplied += applied;
        }
      }
      
      // Apply pattern-based fixes to all files
      for (const file of files) {
        const applied = await this.applyPatternFixes(file, errorText);
        fixesApplied += applied;
      }
    }
    
    return fixesApplied;
  }

  extractFileErrors(errorText) {
    const fileErrors = [];
    const lines = errorText.split('\n');
    
    for (const line of lines) {
      // Match TypeScript error format: file.ts(line,col): error message
      const tsMatch = line.match(/([^(]+)\((\d+),(\d+)\):\s*error\s*(.*)/);
      if (tsMatch) {
        fileErrors.push({
          file: tsMatch[1],
          line: parseInt(tsMatch[2]),
          column: parseInt(tsMatch[3]),
          message: tsMatch[4],
          type: 'typescript'
        });
        continue;
      }
      
      // Match ESLint error format: file.ts:line:col error message
      const eslintMatch = line.match(/([^:]+):(\d+):(\d+):\s*(error|warning)\s*(.*)/);
      if (eslintMatch) {
        fileErrors.push({
          file: eslintMatch[1],
          line: parseInt(eslintMatch[2]),
          column: parseInt(eslintMatch[3]),
          message: eslintMatch[5],
          type: 'eslint'
        });
      }
    }
    
    return fileErrors;
  }

  async fixFileErrors(fileError) {
    let fixesApplied = 0;
    
    try {
      const content = await fs.readFile(fileError.file, 'utf-8');
      const lines = content.split('\n');
      
      // Get the problematic line
      if (fileError.line > 0 && fileError.line <= lines.length) {
        const problematicLine = lines[fileError.line - 1];
        
        // Apply specific fixes based on error message
        const fixedLine = this.fixSpecificError(problematicLine, fileError.message);
        
        if (fixedLine !== problematicLine) {
          lines[fileError.line - 1] = fixedLine;
          await fs.writeFile(fileError.file, lines.join('\n'), 'utf-8');
          
          this.logger.info(`Fixed error in ${fileError.file}:${fileError.line} - ${fileError.message}`);
          fixesApplied++;
        }
      }
      
    } catch (error) {
      this.logger.error(`Error fixing file ${fileError.file}: ${error.message}`);
    }
    
    return fixesApplied;
  }

  fixSpecificError(line, errorMessage) {
    // Apostrophe/quote escaping
    if (errorMessage.includes('unexpected token') || errorMessage.includes('unterminated string')) {
      // Fix unescaped apostrophes
      line = line.replace(/(\w)'(\w)/g, "$1\\'$2");
      
      // Fix unescaped quotes in attributes
      line = line.replace(/"([^"]*)"(?=\s*[>}])/g, '\\"$1\\"');
    }
    
    // Missing semicolons
    if (errorMessage.includes('missing semicolon') || errorMessage.includes('Expected ;')) {
      if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        line = line.replace(/\s*$/, ';');
      }
    }
    
    // TypeScript type issues
    if (errorMessage.includes('Type \'any\'') && line.includes(': any')) {
      line = line.replace(/:\s*any\s*;/g, ': unknown;');
    }
    
    // Import/export issues
    if (errorMessage.includes('import') && !line.includes(';')) {
      line = line.replace(/(from\s+['"][^'"]*['"])(?!\s*;)/, '$1;');
    }
    
    return line;
  }

  async applyPatternFixes(filePath, errorContext) {
    let fixesApplied = 0;
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      
      // Apply enabled pattern fixes
      for (const [category, patterns] of Object.entries(this.fixPatterns)) {
        if (!this.config.fixPatterns[category]) continue;
        
        for (const pattern of patterns) {
          const matches = content.match(pattern.pattern);
          if (matches) {
            content = content.replace(pattern.pattern, pattern.replacement);
            this.logger.debug(`Applied ${pattern.description} in ${filePath}`);
            fixesApplied++;
          }
        }
      }
      
      // Write file if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
        this.logger.info(`Applied ${fixesApplied} pattern fixes to ${filePath}`);
      }
      
    } catch (error) {
      this.logger.error(`Error applying pattern fixes to ${filePath}: ${error.message}`);
    }
    
    return fixesApplied;
  }
}

// Export for use as a module
module.exports = BuildErrorRemediation;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['build-error-remediation'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        maxIterations: 3,
        fixPatterns: {
          apostrophe: true,
          quotes: true,
          typescript: true,
          imports: true
        },
        buildCommands: ['npm run build', 'npm run typecheck', 'npm run lint']
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new BuildErrorRemediation(config);
    
    // Get changed files from command line args or git
    let changedFiles = process.argv.slice(2);
    if (changedFiles.length === 0) {
      try {
        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
        changedFiles = gitOutput.trim().split('\n').filter(f => f);
      } catch (error) {
        // If git fails, check all TypeScript files
        try {
          const allFiles = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules', { encoding: 'utf-8' });
          changedFiles = allFiles.trim().split('\n').filter(f => f);
        } catch (findError) {
          console.error('Could not determine files to check');
          process.exit(1);
        }
      }
    }
    
    const result = await hook.run(changedFiles);
    
    if (!result.success && !result.skipped) {
      console.error('Build error remediation failed');
      if (result.needsManualFix) {
        console.error('Manual fixes required - check the errors above');
      }
      process.exit(1);
    }
    
    console.log('Build error remediation completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}