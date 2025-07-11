import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

async function testAPI() {
  console.log('Testing Spoonacular API...\n');
  
  // Test 1: Simple search
  const url1 = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=chicken&number=5&addRecipeInformation=true&addRecipeNutrition=true`;
  
  try {
    console.log('Test 1: Simple search for "chicken"');
    const response = await fetch(url1);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.results?.length || 0} recipes`);
    
    if (data.results && data.results.length > 0) {
      console.log('\nFirst recipe:');
      console.log(`- Title: ${data.results[0].title}`);
      console.log(`- ID: ${data.results[0].id}`);
      console.log(`- Ready in: ${data.results[0].readyInMinutes} minutes`);
    }
    
    // Test 2: With carb limits
    const url2 = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=breakfast&number=5&maxCarbs=35&minProtein=15&addRecipeInformation=true&addRecipeNutrition=true`;
    
    console.log('\n\nTest 2: Search for "breakfast" with carb limits (max 35g carbs, min 15g protein)');
    const response2 = await fetch(url2);
    console.log(`Response status: ${response2.status}`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`Found ${data2.results?.length || 0} recipes`);
      
      if (data2.results && data2.results.length > 0) {
        console.log('\nFirst recipe nutrition:');
        const nutrients = data2.results[0].nutrition?.nutrients;
        if (nutrients) {
          const carbs = nutrients.find(n => n.name.toLowerCase().includes('carbohydrate'));
          const protein = nutrients.find(n => n.name.toLowerCase().includes('protein'));
          console.log(`- Carbs: ${carbs?.amount || 'N/A'}g`);
          console.log(`- Protein: ${protein?.amount || 'N/A'}g`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI().catch(console.error);