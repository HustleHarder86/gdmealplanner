#!/usr/bin/env tsx
/**
 * Sync Firebase recipes to local production-recipes.json
 * This script fetches all recipes from Firebase and updates the local offline file
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Recipe } from '../src/types/recipe';
import * as dotenv from 'dotenv';

dotenv.config();

async function syncRecipesToLocal() {
  console.log('🔄 Syncing recipes from Firebase to local file...\n');

  try {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gdmealplanner',
      storageBucket: process.env.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    console.log('🔥 Initializing Firebase...');
    console.log('   Project ID:', firebaseConfig.projectId);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Fetch all recipes from Firebase
    console.log('📥 Fetching recipes from Firebase...');
    const recipesSnapshot = await getDocs(collection(db, 'recipes'));
    const recipes: Recipe[] = [];

    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push({
        id: doc.id,
        ...data,
      } as Recipe);
    });

    console.log(`   ✅ Fetched ${recipes.length} recipes from Firebase\n`);

    // Sort recipes by category and title for consistency
    recipes.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

    // Count by category
    const categoryCount: Record<string, number> = {};
    recipes.forEach(r => {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
    });

    console.log('📊 Recipe breakdown by category:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} recipes`);
    });
    console.log(`   Total: ${recipes.length} recipes\n`);

    // Create the export object
    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'https://gdmealplanner.vercel.app',
      recipeCount: recipes.length,
      categoryBreakdown: categoryCount,
      recipes: recipes
    };

    // Save to file
    const outputPath = path.join(process.cwd(), 'data', 'production-recipes.json');
    console.log('💾 Saving to local file...');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write the file
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    
    // Get file stats
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`   ✅ Saved to: ${outputPath}`);
    console.log(`   📁 File size: ${fileSizeMB} MB\n`);

    // Compare with previous version if it exists
    try {
      const gitStatus = await fs.readFile(outputPath, 'utf-8');
      const previousData = JSON.parse(gitStatus);
      const previousCount = previousData.recipeCount || 0;
      const difference = recipes.length - previousCount;
      
      if (difference !== 0) {
        console.log(`📈 Change from previous version: ${difference > 0 ? '+' : ''}${difference} recipes`);
      }
    } catch (error) {
      // Previous file might not exist
    }

    console.log('✅ Sync completed successfully!');
    console.log('\n🎉 Your offline recipe library has been updated with all recipes from Firebase.');
    
  } catch (error) {
    console.error('\n❌ Error syncing recipes:', error);
    if (error instanceof Error && error.message.includes('projectId')) {
      console.error('\n💡 Tip: Make sure your Firebase project ID is set in the environment variables or update the script with your project ID.');
    }
    process.exit(1);
  }
}

// Run the sync
syncRecipesToLocal().catch(console.error);