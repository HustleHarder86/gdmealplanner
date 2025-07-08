import { Recipe } from '@/src/types/recipe';
import { adminDb } from '@/src/lib/firebase/admin';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface UpdateResult {
  success: boolean;
  recipesUpdated: number;
  filesCreated: string[];
  errors: string[];
  timestamp: string;
}

interface RecipeExport {
  exportDate: string;
  source: string;
  recipeCount: number;
  recipes: Recipe[];
}

export class OfflineUpdater {
  private static readonly DATA_DIR = path.join(process.cwd(), 'public', 'data');
  private static readonly BACKUP_DIR = path.join(process.cwd(), 'backups', 'recipes');
  
  /**
   * Fetch all recipes from Firebase and update offline files
   */
  static async updateOfflineRecipes(): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: false,
      recipesUpdated: 0,
      filesCreated: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Create backup before updating
      await this.createBackup();

      // Fetch all recipes from Firebase
      console.log('Fetching recipes from Firebase...');
      const recipesSnapshot = await adminDb().collection('recipes').get();
      const recipes: Recipe[] = [];

      recipesSnapshot.forEach(doc => {
        const data = doc.data();
        recipes.push({
          id: doc.id,
          ...data
        } as Recipe);
      });

      console.log(`Fetched ${recipes.length} recipes from Firebase`);
      result.recipesUpdated = recipes.length;

      // Create the export object
      const recipeExport: RecipeExport = {
        exportDate: result.timestamp,
        source: process.env.NEXT_PUBLIC_APP_URL || 'gdmealplanner',
        recipeCount: recipes.length,
        recipes
      };

      // Save full JSON file
      const fullPath = path.join(this.DATA_DIR, 'production-recipes.json');
      await fs.writeFile(fullPath, JSON.stringify(recipeExport, null, 2));
      result.filesCreated.push('production-recipes.json');

      // Save minified JSON file
      const minPath = path.join(this.DATA_DIR, 'production-recipes.min.json');
      await fs.writeFile(minPath, JSON.stringify(recipeExport));
      result.filesCreated.push('production-recipes.min.json');

      // Create compressed version
      const compressedPath = path.join(this.DATA_DIR, 'production-recipes.json.gz');
      const compressed = await gzip(JSON.stringify(recipeExport));
      await fs.writeFile(compressedPath, compressed);
      result.filesCreated.push('production-recipes.json.gz');

      // Create metadata file
      const metadata = {
        lastUpdate: result.timestamp,
        recipeCount: recipes.length,
        fileSize: {
          full: (await fs.stat(fullPath)).size,
          minified: (await fs.stat(minPath)).size,
          compressed: compressed.length
        },
        categories: this.getCategoryStats(recipes),
        compressionRatio: (compressed.length / (await fs.stat(fullPath)).size * 100).toFixed(2) + '%'
      };

      const metadataPath = path.join(this.DATA_DIR, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      result.filesCreated.push('metadata.json');

      result.success = true;
      console.log('Offline recipe update completed successfully');

    } catch (error) {
      console.error('Error updating offline recipes:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Create incremental update with only changed recipes
   */
  static async createIncrementalUpdate(since: Date): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: false,
      recipesUpdated: 0,
      filesCreated: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Query only recipes updated since the given date
      const recipesSnapshot = await adminDb()
        .collection('recipes')
        .where('updatedAt', '>=', since)
        .get();

      const updatedRecipes: Recipe[] = [];
      recipesSnapshot.forEach(doc => {
        const data = doc.data();
        updatedRecipes.push({
          id: doc.id,
          ...data
        } as Recipe);
      });

      if (updatedRecipes.length === 0) {
        console.log('No recipes updated since', since);
        result.success = true;
        return result;
      }

      result.recipesUpdated = updatedRecipes.length;

      // Save incremental update file
      const incrementalPath = path.join(
        this.DATA_DIR, 
        `incremental-${since.getTime()}-${Date.now()}.json`
      );
      
      await fs.writeFile(incrementalPath, JSON.stringify({
        updateDate: result.timestamp,
        since: since.toISOString(),
        recipeCount: updatedRecipes.length,
        recipes: updatedRecipes
      }, null, 2));

      result.filesCreated.push(path.basename(incrementalPath));
      result.success = true;

    } catch (error) {
      console.error('Error creating incremental update:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Ensure required directories exist
   */
  private static async ensureDirectories() {
    await fs.mkdir(this.DATA_DIR, { recursive: true });
    await fs.mkdir(this.BACKUP_DIR, { recursive: true });
  }

  /**
   * Create backup of current recipe files
   */
  private static async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.BACKUP_DIR, timestamp);
    await fs.mkdir(backupDir, { recursive: true });

    try {
      // Copy current production files to backup
      const files = ['production-recipes.json', 'production-recipes.min.json', 'metadata.json'];
      
      for (const file of files) {
        const srcPath = path.join(this.DATA_DIR, file);
        const destPath = path.join(backupDir, file);
        
        try {
          await fs.copyFile(srcPath, destPath);
          console.log(`Backed up ${file}`);
        } catch (err) {
          // File might not exist on first run
          console.log(`Could not backup ${file} (may not exist yet)`);
        }
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      // Don't fail the update if backup fails
    }
  }

  /**
   * Get category statistics
   */
  private static getCategoryStats(recipes: Recipe[]): Record<string, number> {
    return recipes.reduce((acc, recipe) => {
      acc[recipe.category] = (acc[recipe.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Clean up old backup files
   */
  static async cleanupOldBackups(daysToKeep: number = 7) {
    try {
      const backups = await fs.readdir(this.BACKUP_DIR);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const backup of backups) {
        const backupPath = path.join(this.BACKUP_DIR, backup);
        const stats = await fs.stat(backupPath);
        
        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          await fs.rm(backupPath, { recursive: true });
          console.log(`Removed old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  /**
   * Validate offline files
   */
  static async validateOfflineFiles(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if main recipe file exists
      const mainFilePath = path.join(this.DATA_DIR, 'production-recipes.json');
      const mainFile = await fs.readFile(mainFilePath, 'utf-8');
      const data = JSON.parse(mainFile) as RecipeExport;

      // Validate structure
      if (!data.exportDate || !data.recipes || !Array.isArray(data.recipes)) {
        issues.push('Invalid file structure');
      }

      // Check recipe count
      if (data.recipeCount !== data.recipes.length) {
        issues.push(`Recipe count mismatch: expected ${data.recipeCount}, found ${data.recipes.length}`);
      }

      // Validate each recipe has required fields
      const requiredFields = ['id', 'title', 'category', 'ingredients', 'nutrition'];
      for (const recipe of data.recipes) {
        for (const field of requiredFields) {
          if (!(field in recipe)) {
            issues.push(`Recipe ${recipe.id || 'unknown'} missing required field: ${field}`);
            break;
          }
        }
      }

      // Check metadata file
      const metadataPath = path.join(this.DATA_DIR, 'metadata.json');
      try {
        await fs.readFile(metadataPath, 'utf-8');
      } catch {
        issues.push('Metadata file missing');
      }

    } catch (error) {
      issues.push(`File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}