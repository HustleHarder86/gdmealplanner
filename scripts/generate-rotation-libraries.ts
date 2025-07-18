/**
 * Generate Rotation Libraries Script
 * 
 * This script generates the weekly rotation libraries for all tracks.
 * Run this script to populate the Firebase database with pre-generated meal plans.
 * 
 * Usage:
 * npm run generate-rotations
 * or
 * npx tsx scripts/generate-rotation-libraries.ts
 */

import { WeeklyPlanGenerator } from '@/src/services/weekly-plan-generator';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { ROTATION_TRACKS } from '@/src/types/weekly-rotation';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 Starting rotation library generation...');
  console.log('=====================================');
  
  try {
    // Initialize recipe service
    console.log('📚 Initializing recipe service...');
    await LocalRecipeService.initialize();
    const recipeCount = LocalRecipeService.getAllRecipes().length;
    console.log(`✅ Loaded ${recipeCount} recipes`);
    
    if (recipeCount === 0) {
      console.error('❌ No recipes found! Make sure recipe data is available.');
      process.exit(1);
    }
    
    // Generate libraries for all tracks
    console.log('\n🔄 Generating rotation libraries...');
    const totalWeeks = process.env.ROTATION_WEEKS ? parseInt(process.env.ROTATION_WEEKS) : 52;
    console.log(`📅 Generating ${totalWeeks} weeks per track`);
    
    const libraries = await WeeklyPlanGenerator.generateAllRotations(totalWeeks);
    
    if (libraries.length === 0) {
      console.error('❌ Failed to generate any rotation libraries');
      process.exit(1);
    }
    
    console.log(`✅ Generated ${libraries.length} rotation libraries`);
    
    // Display generation results
    console.log('\n📊 Generation Results:');
    console.log('=====================');
    libraries.forEach((library) => {
      const trackConfig = ROTATION_TRACKS.find(t => t.track === library.track);
      console.log(`${trackConfig?.icon} ${trackConfig?.name}: ${library.plans.length} weeks`);
      
      // Show variety analysis
      const analysis = WeeklyPlanGenerator.analyzeRotationVariety(library);
      console.log(`  └─ ${analysis.uniqueRecipes} unique recipes, avg ${analysis.averageRepeats} uses each`);
      console.log(`  └─ Max gap between repeats: ${analysis.maxGapBetweenRepeats} weeks`);
    });
    
    // Save to local files for inspection
    console.log('\n💾 Saving libraries to local files...');
    const outputDir = './rotation-libraries-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    libraries.forEach((library) => {
      const filename = path.join(outputDir, `${library.track}-rotation.json`);
      fs.writeFileSync(filename, JSON.stringify(library, null, 2));
      console.log(`✅ Saved ${library.track} track to ${filename}`);
    });
    
    // Create summary file
    const summary = {
      generated: new Date().toISOString(),
      totalLibraries: libraries.length,
      libraries: libraries.map(lib => ({
        track: lib.track,
        totalWeeks: lib.totalWeeks,
        planCount: lib.plans.length,
        variety: WeeklyPlanGenerator.analyzeRotationVariety(lib)
      }))
    };
    
    fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(`✅ Saved generation summary to ${outputDir}/summary.json`);
    
    console.log('\n🎉 Rotation library generation complete!');
    console.log('Users can now access weekly meal plans with infinite variety.');
    
  } catch (error) {
    console.error('\n❌ Error generating rotation libraries:', error);
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔄 Rotation Library Generator

Usage:
  npm run generate-rotations
  npx tsx scripts/generate-rotation-libraries.ts

Options:
  --help, -h          Show this help message
  
Environment Variables:
  ROTATION_WEEKS      Number of weeks to generate (default: 52)
  
Examples:
  ROTATION_WEEKS=104 npm run generate-rotations  # Generate 2 years worth
  ROTATION_WEEKS=26 npm run generate-rotations   # Generate 6 months worth
  `);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as generateRotationLibraries };