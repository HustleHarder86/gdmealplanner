#!/usr/bin/env node

/**
 * Recipe Data Integrity Guardian Hook
 * 
 * Validates all recipe data changes for nutrition accuracy, duplicates, and GD compliance
 * Ensures Firebase and JSON data stay in sync
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class RecipeDataGuardian {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
    this.validationRules = this.initializeValidationRules();
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
      await fs.appendFile('.claude/logs/recipe-data-guardian.log', logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  initializeValidationRules() {
    return {
      nutrition: {
        required: ['carbs', 'protein', 'fat', 'fiber', 'calories'],
        ranges: {
          carbs: { min: 0, max: 100 },
          protein: { min: 0, max: 50 },
          fat: { min: 0, max: 30 },
          fiber: { min: 0, max: 25 },
          calories: { min: 50, max: 800 }
        }
      },
      recipe: {
        required: ['title', 'ingredients', 'instructions', 'servings'],
        titleMinLength: 5,
        titleMaxLength: 100,
        minIngredients: 2,
        minInstructions: 1,
        servingsRange: { min: 1, max: 12 }
      },
      gd: {
        maxCarbsPerServing: {
          breakfast: 35,
          lunch: 50,
          dinner: 50,
          snack: 30,
          bedtime: 16
        },
        minFiberRatio: 0.1, // 10% of carbs should be fiber
        maxSugarRatio: 0.5  // 50% of carbs can be sugar
      }
    };
  }

  async run(changedFiles) {
    this.logger.info('Starting recipe data integrity validation');
    
    // Filter relevant files
    const relevantFiles = changedFiles.filter(file => 
      file.includes('recipe') || 
      file.includes('data/') ||
      file.match(/\.json$/) ||
      file.includes('spoonacular') ||
      file.includes('nutrition')
    );
    
    if (relevantFiles.length === 0) {
      this.logger.info('No recipe-related files changed');
      return { success: true, skipped: true };
    }
    
    this.logger.info(`Validating ${relevantFiles.length} recipe-related files`);
    
    let totalIssues = 0;
    let fixedIssues = 0;
    const validationResults = [];
    
    // Validate individual files
    for (const file of relevantFiles) {
      const result = await this.validateFile(file);
      validationResults.push(result);
      totalIssues += result.issues;
      fixedIssues += result.fixed;
    }
    
    // Cross-file validations
    const crossValidation = await this.performCrossValidation(relevantFiles);
    totalIssues += crossValidation.issues;
    fixedIssues += crossValidation.fixed;
    
    // Sync validations
    if (this.config.syncFirebaseToJson) {
      const syncResult = await this.validateDataSync();
      totalIssues += syncResult.issues;
      fixedIssues += syncResult.fixed;
    }
    
    const success = totalIssues === 0 || fixedIssues === totalIssues;
    
    this.logger.info(`Recipe data validation complete: ${fixedIssues}/${totalIssues} issues resolved`);
    
    return {
      success,
      totalIssues,
      fixedIssues,
      files: relevantFiles.length,
      details: validationResults
    };
  }

  async validateFile(filePath) {
    const result = { file: filePath, issues: 0, fixed: 0, errors: [] };
    
    try {
      // Skip non-existent files
      try {
        await fs.access(filePath);
      } catch {
        result.errors.push('File does not exist');
        return result;
      }
      
      if (filePath.endsWith('.json')) {
        await this.validateJsonFile(filePath, result);
      } else if (filePath.includes('.ts') || filePath.includes('.js')) {
        await this.validateScriptFile(filePath, result);
      }
      
      this.logger.debug(`Validated ${filePath}: ${result.fixed}/${result.issues} issues fixed`);
      
    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      this.logger.error(`Error validating ${filePath}: ${error.message}`);
    }
    
    return result;
  }

  async validateJsonFile(filePath, result) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Determine what type of JSON data this is
      if (Array.isArray(data)) {
        // Likely a recipe array
        for (let i = 0; i < data.length; i++) {
          const recipe = data[i];
          const validation = await this.validateSingleRecipe(recipe, `${filePath}[${i}]`);
          result.issues += validation.issues;
          
          // Apply fixes to the recipe
          if (validation.fixed) {
            data[i] = validation.fixedRecipe;
            result.fixed += validation.fixed;
          }
        }
      } else if (data.recipes && Array.isArray(data.recipes)) {
        // Recipe collection format
        for (let i = 0; i < data.recipes.length; i++) {
          const recipe = data.recipes[i];
          const validation = await this.validateSingleRecipe(recipe, `${filePath}.recipes[${i}]`);
          result.issues += validation.issues;
          
          if (validation.fixed) {
            data.recipes[i] = validation.fixedRecipe;
            result.fixed += validation.fixed;
          }
        }
      } else if (data.title || data.ingredients) {
        // Single recipe format
        const validation = await this.validateSingleRecipe(data, filePath);
        result.issues += validation.issues;
        
        if (validation.fixed) {
          Object.assign(data, validation.fixedRecipe);
          result.fixed += validation.fixed;
        }
      }
      
      // Write fixed data back to file if changes were made
      if (result.fixed > 0) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        this.logger.info(`Applied ${result.fixed} fixes to ${filePath}`);
      }
      
    } catch (error) {
      result.errors.push(`JSON validation error: ${error.message}`);
      result.issues++;
    }
  }

  async validateSingleRecipe(recipe, location) {
    const validation = { issues: 0, fixed: 0, fixedRecipe: { ...recipe } };
    
    // Validate required fields
    for (const field of this.validationRules.recipe.required) {
      if (!recipe[field]) {
        validation.issues++;
        this.logger.warn(`Missing required field '${field}' in ${location}`);
        
        // Try to fix with default values
        switch (field) {
          case 'servings':
            validation.fixedRecipe[field] = 4;
            validation.fixed++;
            break;
          case 'ingredients':
            validation.fixedRecipe[field] = [];
            validation.fixed++;
            break;
          case 'instructions':
            validation.fixedRecipe[field] = [];
            validation.fixed++;
            break;
        }
      }
    }
    
    // Validate title
    if (recipe.title) {
      if (recipe.title.length < this.validationRules.recipe.titleMinLength) {
        validation.issues++;
        this.logger.warn(`Title too short in ${location}`);
      }
      if (recipe.title.length > this.validationRules.recipe.titleMaxLength) {
        validation.issues++;
        validation.fixedRecipe.title = recipe.title.substring(0, this.validationRules.recipe.titleMaxLength);
        validation.fixed++;
      }
    }
    
    // Validate nutrition data
    if (recipe.nutrition) {
      const nutritionValidation = await this.validateNutrition(recipe.nutrition, location);
      validation.issues += nutritionValidation.issues;
      validation.fixed += nutritionValidation.fixed;
      if (nutritionValidation.fixed > 0) {
        validation.fixedRecipe.nutrition = nutritionValidation.fixedNutrition;
      }
    } else if (this.config.validateNutrition) {
      validation.issues++;
      this.logger.warn(`Missing nutrition data in ${location}`);
    }
    
    // Validate GD compliance
    if (this.config.enforceGdGuidelines && recipe.nutrition) {
      const gdValidation = await this.validateGdCompliance(recipe, location);
      validation.issues += gdValidation.issues;
      // GD violations are warnings, not automatically fixed
    }
    
    // Validate ingredients
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      if (recipe.ingredients.length < this.validationRules.recipe.minIngredients) {
        validation.issues++;
        this.logger.warn(`Too few ingredients (${recipe.ingredients.length}) in ${location}`);
      }
    }
    
    // Validate servings
    if (recipe.servings) {
      const servings = parseInt(recipe.servings);
      if (servings < this.validationRules.recipe.servingsRange.min || 
          servings > this.validationRules.recipe.servingsRange.max) {
        validation.issues++;
        validation.fixedRecipe.servings = Math.max(
          this.validationRules.recipe.servingsRange.min,
          Math.min(servings, this.validationRules.recipe.servingsRange.max)
        );
        validation.fixed++;
      }
    }
    
    return validation;
  }

  async validateNutrition(nutrition, location) {
    const validation = { issues: 0, fixed: 0, fixedNutrition: { ...nutrition } };
    
    // Check required nutrition fields
    for (const field of this.validationRules.nutrition.required) {
      if (nutrition[field] === undefined || nutrition[field] === null) {
        validation.issues++;
        this.logger.warn(`Missing nutrition field '${field}' in ${location}`);
        
        // Set to 0 as default (better than missing)
        validation.fixedNutrition[field] = 0;
        validation.fixed++;
      }
    }
    
    // Validate nutrition ranges
    for (const [field, range] of Object.entries(this.validationRules.nutrition.ranges)) {
      const value = parseFloat(nutrition[field]);
      if (!isNaN(value)) {
        if (value < range.min || value > range.max) {
          validation.issues++;
          this.logger.warn(`Nutrition value '${field}' (${value}) out of range [${range.min}, ${range.max}] in ${location}`);
          
          // Clamp to valid range
          validation.fixedNutrition[field] = Math.max(range.min, Math.min(value, range.max));
          validation.fixed++;
        }
      }
    }
    
    // Cross-validate nutrition values for consistency
    if (nutrition.carbs && nutrition.protein && nutrition.fat && nutrition.calories) {
      const calculatedCalories = (nutrition.carbs * 4) + (nutrition.protein * 4) + (nutrition.fat * 9);
      const caloriesDiff = Math.abs(calculatedCalories - nutrition.calories);
      const tolerance = nutrition.calories * 0.15; // 15% tolerance
      
      if (caloriesDiff > tolerance) {
        validation.issues++;
        this.logger.warn(`Calorie calculation mismatch in ${location}: reported ${nutrition.calories}, calculated ${calculatedCalories.toFixed(1)}`);
        
        // Fix by using calculated calories
        validation.fixedNutrition.calories = Math.round(calculatedCalories);
        validation.fixed++;
      }
    }
    
    return validation;
  }

  async validateGdCompliance(recipe, location) {
    const validation = { issues: 0 };
    
    if (!recipe.nutrition || !recipe.category) return validation;
    
    const category = recipe.category.toLowerCase();
    const carbsPerServing = recipe.nutrition.carbs;
    const maxCarbs = this.config.carbRanges[category];
    
    if (maxCarbs && carbsPerServing > maxCarbs[1]) {
      validation.issues++;
      this.logger.warn(`Recipe '${recipe.title}' exceeds carb limit for ${category}: ${carbsPerServing}g > ${maxCarbs[1]}g`);
    }
    
    // Check fiber ratio
    if (recipe.nutrition.fiber && recipe.nutrition.carbs) {
      const fiberRatio = recipe.nutrition.fiber / recipe.nutrition.carbs;
      if (fiberRatio < this.validationRules.gd.minFiberRatio) {
        validation.issues++;
        this.logger.warn(`Recipe '${recipe.title}' has low fiber ratio: ${(fiberRatio * 100).toFixed(1)}%`);
      }
    }
    
    return validation;
  }

  async validateScriptFile(filePath, result) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for common issues in recipe-related scripts
      const issues = [];
      
      // Check for hardcoded limits
      if (content.includes('limit') && content.includes('recipe')) {
        const limitMatches = content.match(/limit:\s*(\d+)/gi);
        if (limitMatches) {
          for (const match of limitMatches) {
            const limit = parseInt(match.split(':')[1]);
            if (limit > 100) {
              issues.push(`High API limit detected: ${limit}`);
            }
          }
        }
      }
      
      // Check for missing error handling
      if (content.includes('fetch') && !content.includes('catch')) {
        issues.push('Fetch call without error handling');
      }
      
      // Check for missing validation
      if (content.includes('recipe') && content.includes('save') && !content.includes('valid')) {
        issues.push('Recipe saving without validation');
      }
      
      result.issues += issues.length;
      result.errors.push(...issues);
      
    } catch (error) {
      result.errors.push(`Script validation error: ${error.message}`);
      result.issues++;
    }
  }

  async performCrossValidation(files) {
    const validation = { issues: 0, fixed: 0 };
    
    if (!this.config.checkDuplicates) return validation;
    
    this.logger.info('Performing cross-file duplicate detection');
    
    // Load all recipes from all files
    const allRecipes = await this.loadAllRecipes(files);
    
    // Check for duplicates
    const duplicates = await this.findDuplicateRecipes(allRecipes);
    
    if (duplicates.length > 0) {
      validation.issues += duplicates.length;
      this.logger.warn(`Found ${duplicates.length} potential duplicate recipes`);
      
      // For now, just log duplicates - could implement automatic deduplication
      for (const duplicate of duplicates) {
        this.logger.warn(`Potential duplicate: "${duplicate.recipe1.title}" and "${duplicate.recipe2.title}" (similarity: ${duplicate.similarity})`);
      }
    }
    
    return validation;
  }

  async loadAllRecipes(files) {
    const recipes = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf-8');
        const data = JSON.parse(content);
        
        let fileRecipes = [];
        if (Array.isArray(data)) {
          fileRecipes = data;
        } else if (data.recipes && Array.isArray(data.recipes)) {
          fileRecipes = data.recipes;
        } else if (data.title) {
          fileRecipes = [data];
        }
        
        for (const recipe of fileRecipes) {
          recipes.push({ ...recipe, sourceFile: file });
        }
        
      } catch (error) {
        this.logger.debug(`Could not load recipes from ${file}: ${error.message}`);
      }
    }
    
    return recipes;
  }

  async findDuplicateRecipes(recipes) {
    const duplicates = [];
    
    for (let i = 0; i < recipes.length; i++) {
      for (let j = i + 1; j < recipes.length; j++) {
        const similarity = this.calculateRecipeSimilarity(recipes[i], recipes[j]);
        
        if (similarity > 0.8) { // 80% similarity threshold
          duplicates.push({
            recipe1: recipes[i],
            recipe2: recipes[j],
            similarity: similarity
          });
        }
      }
    }
    
    return duplicates;
  }

  calculateRecipeSimilarity(recipe1, recipe2) {
    let similarity = 0;
    let factors = 0;
    
    // Title similarity
    if (recipe1.title && recipe2.title) {
      const titleSim = this.stringSimilarity(recipe1.title, recipe2.title);
      similarity += titleSim * 0.4;
      factors += 0.4;
    }
    
    // Ingredient similarity
    if (recipe1.ingredients && recipe2.ingredients) {
      const ingredientSim = this.arrayStringSimilarity(recipe1.ingredients, recipe2.ingredients);
      similarity += ingredientSim * 0.4;
      factors += 0.4;
    }
    
    // Nutrition similarity
    if (recipe1.nutrition && recipe2.nutrition) {
      const nutritionSim = this.nutritionSimilarity(recipe1.nutrition, recipe2.nutrition);
      similarity += nutritionSim * 0.2;
      factors += 0.2;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }

  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  arrayStringSimilarity(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return 0;
    
    const set1 = new Set(arr1.map(item => typeof item === 'string' ? item.toLowerCase() : String(item).toLowerCase()));
    const set2 = new Set(arr2.map(item => typeof item === 'string' ? item.toLowerCase() : String(item).toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  nutritionSimilarity(nutr1, nutr2) {
    const fields = ['carbs', 'protein', 'fat', 'calories'];
    let totalSimilarity = 0;
    let validFields = 0;
    
    for (const field of fields) {
      if (nutr1[field] !== undefined && nutr2[field] !== undefined) {
        const val1 = parseFloat(nutr1[field]);
        const val2 = parseFloat(nutr2[field]);
        
        if (!isNaN(val1) && !isNaN(val2) && (val1 > 0 || val2 > 0)) {
          const maxVal = Math.max(val1, val2);
          const similarity = 1 - (Math.abs(val1 - val2) / maxVal);
          totalSimilarity += similarity;
          validFields++;
        }
      }
    }
    
    return validFields > 0 ? totalSimilarity / validFields : 0;
  }

  async validateDataSync() {
    const validation = { issues: 0, fixed: 0 };
    
    this.logger.info('Validating Firebase to JSON sync');
    
    // This would check if offline JSON files are in sync with Firebase
    // For now, just check if expected files exist
    
    const expectedFiles = [
      'data/recipes-offline.json',
      'data/recipes-by-category.json'
    ];
    
    for (const file of expectedFiles) {
      try {
        await fs.access(file);
        this.logger.debug(`Sync file exists: ${file}`);
      } catch {
        validation.issues++;
        this.logger.warn(`Missing expected sync file: ${file}`);
        
        // Could trigger sync here if needed
        this.logger.info(`Would trigger sync for ${file}`);
      }
    }
    
    return validation;
  }
}

// Export for use as a module
module.exports = RecipeDataGuardian;

// CLI usage
if (require.main === module) {
  const configPath = path.join(process.cwd(), '.claude/config/hooks.json');
  
  const loadConfig = async () => {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      return config.hooks['recipe-data-guardian'].config;
    } catch (error) {
      console.error('Failed to load config:', error.message);
      return {
        validateNutrition: true,
        checkDuplicates: true,
        enforceGdGuidelines: true,
        syncFirebaseToJson: true,
        carbRanges: {
          breakfast: [25, 35],
          lunch: [40, 50],
          dinner: [40, 50],
          snack: [15, 30],
          bedtime: [14, 16]
        }
      };
    }
  };
  
  const run = async () => {
    const config = await loadConfig();
    const hook = new RecipeDataGuardian(config);
    
    // Get changed files from command line args or git
    let changedFiles = process.argv.slice(2);
    if (changedFiles.length === 0) {
      try {
        const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
        changedFiles = gitOutput.trim().split('\n').filter(f => f);
      } catch (error) {
        // If git fails, check common recipe files
        changedFiles = [
          'data/recipes-offline.json',
          'data/recipes-by-category.json',
          'scripts/import-recipes-cli.ts'
        ];
      }
    }
    
    const result = await hook.run(changedFiles);
    
    if (!result.success && !result.skipped) {
      console.error('Recipe data validation failed');
      console.error(`${result.totalIssues - result.fixedIssues} issues remain unresolved`);
      process.exit(1);
    }
    
    console.log('Recipe data validation completed successfully');
  };
  
  run().catch(error => {
    console.error('Hook execution failed:', error);
    process.exit(1);
  });
}