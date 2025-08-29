/**
 * AST Transformer Utility
 * 
 * Utilities for parsing and transforming JavaScript/TypeScript code
 */

const fs = require('fs').promises;

class ASTTransformer {
  constructor() {
    this.transformations = new Map();
  }

  /**
   * Register a transformation rule
   * @param {string} name - Name of the transformation
   * @param {Function} transformer - Transformation function
   */
  registerTransform(name, transformer) {
    this.transformations.set(name, transformer);
  }

  /**
   * Apply transformations to code
   * @param {string} code - Source code to transform
   * @param {Array} transforms - List of transformation names to apply
   * @returns {Promise<string>} Transformed code
   */
  async transform(code, transforms = []) {
    let transformedCode = code;
    
    for (const transformName of transforms) {
      const transformer = this.transformations.get(transformName);
      if (transformer) {
        transformedCode = await transformer(transformedCode);
      }
    }
    
    return transformedCode;
  }

  /**
   * Fix common quote escaping issues
   * @param {string} code
   * @returns {string}
   */
  fixQuoteEscaping(code) {
    return code
      .replace(/(\/w)'(\w)/g, "$1\\'$2") // Fix apostrophes in contractions
      .replace(/title="([^"]*)"/g, 'title="$1"') // Fix title attributes
      .replace(/alt="([^"]*)"/g, 'alt="$1"'); // Fix alt attributes
  }

  /**
   * Fix TypeScript import statements
   * @param {string} code
   * @returns {string}
   */
  fixImports(code) {
    return code
      .replace(/from\s+['"](.+)['"](?!\s*;)/g, "from '$1';") // Add missing semicolons
      .replace(/import\s+(.+)\s+from\s+['"](.+)['"];?/g, "import $1 from '$2';"); // Normalize quotes
  }

  /**
   * Add NextResponse imports where needed
   * @param {string} code
   * @returns {string}
   */
  addNextResponseImport(code) {
    if (code.includes('NextResponse') && !code.includes("import { NextResponse }")) {
      const lines = code.split('\n');
      const importIndex = lines.findIndex(line => line.startsWith('import'));
      
      if (importIndex >= 0) {
        lines.splice(importIndex, 0, "import { NextResponse } from 'next/server';");
      } else {
        lines.unshift("import { NextResponse } from 'next/server';", '');
      }
      
      return lines.join('\n');
    }
    
    return code;
  }

  /**
   * Extract function signatures from code
   * @param {string} code
   * @returns {Array} Array of function signatures
   */
  extractFunctions(code) {
    const functions = [];
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      functions.push({
        name: match[1],
        signature: match[0],
        isExported: match[0].includes('export'),
        isAsync: match[0].includes('async')
      });
    }
    
    return functions;
  }
}

// Register common transformations
const transformer = new ASTTransformer();

transformer.registerTransform('fix-quotes', (code) => {
  return transformer.fixQuoteEscaping(code);
});

transformer.registerTransform('fix-imports', (code) => {
  return transformer.fixImports(code);
});

transformer.registerTransform('add-nextresponse', (code) => {
  return transformer.addNextResponseImport(code);
});

module.exports = ASTTransformer;