import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Recipe Extraction API
 * Fetches and extracts recipe data from any URL to bypass CSP restrictions
 */

interface RecipeData {
  title: string;
  description: string;
  url: string;
  source: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Array<{
    text: string;
    parsed: {
      amount: string;
      unit: string;
      item: string;
    };
  }>;
  instructions: string[];
  nutrition: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
    fat: number;
    sugar: number;
  };
  category: string;
  verified: boolean;
  extracted_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`Extracting recipe from: ${url}`);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    
    // Extract recipe data
    const recipeData = extractRecipeFromHtml(html, url);
    
    if (!recipeData) {
      return NextResponse.json(
        { 
          error: 'No recipe data found on this page',
          debug: {
            hasJsonLd: html.includes('application/ld+json'),
            hasMicrodata: html.includes('itemtype') && html.includes('Recipe'),
            pageTitle: extractPageTitle(html),
            url: url
          }
        },
        { status: 404 }
      );
    }

    // Validate GD requirements
    const validation = validateGDNutrition(recipeData.nutrition);
    
    return NextResponse.json({
      success: true,
      recipe: recipeData,
      validation: validation,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recipe extraction error:', error);
    return NextResponse.json(
      { error: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function extractRecipeFromHtml(html: string, url: string): RecipeData | null {
  console.log('Starting recipe extraction...');
  
  // Try JSON-LD first
  let recipeData = extractJsonLdFromHtml(html);
  
  // Fallback to microdata
  if (!recipeData) {
    recipeData = extractMicrodataFromHtml(html);
  }
  
  if (!recipeData || !recipeData.name) {
    return null;
  }

  // Parse into our format
  const recipe: RecipeData = {
    title: recipeData.name,
    description: recipeData.description || '',
    url: url,
    source: new URL(url).hostname,
    prepTime: parseDuration(recipeData.prepTime),
    cookTime: parseDuration(recipeData.cookTime),
    totalTime: parseDuration(recipeData.totalTime),
    servings: parseInt(String(recipeData.recipeYield)) || 4,
    ingredients: [],
    instructions: [],
    nutrition: parseNutrition(recipeData.nutrition),
    category: determineCategory(recipeData.name),
    verified: true,
    extracted_at: new Date().toISOString()
  };

  // Calculate total time if not provided
  if (!recipe.totalTime) {
    recipe.totalTime = recipe.prepTime + recipe.cookTime;
  }

  // Parse ingredients
  if (Array.isArray(recipeData.recipeIngredient)) {
    recipe.ingredients = recipeData.recipeIngredient.map(ing => ({
      text: ing,
      parsed: parseIngredient(ing)
    }));
  }

  // Parse instructions
  if (recipeData.recipeInstructions) {
    const instructions = Array.isArray(recipeData.recipeInstructions) 
      ? recipeData.recipeInstructions 
      : [recipeData.recipeInstructions];
    
    recipe.instructions = instructions.map(inst => {
      if (typeof inst === 'string') return inst;
      return inst.text || inst.name || '';
    }).filter(text => text.length > 5);
  }

  return recipe;
}

function extractJsonLdFromHtml(html: string): any {
  console.log('Extracting JSON-LD...');
  
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
  const matches = [...html.matchAll(jsonLdRegex)];
  
  console.log(`Found ${matches.length} JSON-LD scripts`);
  
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        const recipe = data.find(item => item['@type'] === 'Recipe');
        if (recipe) {
          console.log('Found Recipe in JSON-LD array');
          return recipe;
        }
      } else if (data['@type'] === 'Recipe') {
        console.log('Found Recipe in JSON-LD object');
        return data;
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e);
    }
  }
  
  return null;
}

function extractMicrodataFromHtml(html: string): any {
  console.log('Extracting microdata...');
  
  // Simple microdata extraction (basic implementation)
  const recipeRegex = /itemtype="[^"]*schema\.org\/Recipe[^"]*"/;
  if (!recipeRegex.test(html)) {
    return null;
  }
  
  // Extract basic fields using regex (simplified approach)
  const extractProperty = (prop: string) => {
    const regex = new RegExp(`itemprop="${prop}"[^>]*>([^<]+)`, 'i');
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };
  
  const name = extractProperty('name');
  if (!name) return null;
  
  return {
    '@type': 'Recipe',
    name: name,
    description: extractProperty('description'),
    prepTime: extractProperty('prepTime'),
    cookTime: extractProperty('cookTime'),
    totalTime: extractProperty('totalTime'),
    recipeYield: extractProperty('recipeYield'),
    recipeIngredient: [], // Would need more complex parsing
    recipeInstructions: [],
    nutrition: {}
  };
}

function extractPageTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

function parseDuration(duration: any): number {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  
  const str = String(duration);
  const match = str.match(/PT(\d+)M/) || str.match(/(\d+)\s*min/i);
  return match ? parseInt(match[1]) : 0;
}

function parseIngredient(text: string) {
  const patterns = [
    /^([\d\s\-\/\.½⅓⅔¼¾]+)\s*(cups?|tbsp|tsp|oz|lb|g|ml|L)\s+(.+)$/i,
    /^(\d+)\s+(.+)$/,
    /^(.+)$/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 4) {
        return {
          amount: match[1].trim(),
          unit: match[2].trim(),
          item: match[3].trim()
        };
      } else if (match.length === 3) {
        return {
          amount: match[1].trim(),
          unit: '',
          item: match[2].trim()
        };
      } else {
        return {
          amount: '',
          unit: '',
          item: match[1].trim()
        };
      }
    }
  }
  
  return { amount: '', unit: '', item: text };
}

function parseNutrition(nutritionData: any) {
  const nutrition = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
    sugar: 0
  };
  
  if (!nutritionData) return nutrition;
  
  const extract = (value: any) => {
    if (typeof value === 'number') return value;
    const match = String(value).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  nutrition.calories = extract(nutritionData.calories);
  nutrition.carbs = extract(nutritionData.carbohydrateContent);
  nutrition.protein = extract(nutritionData.proteinContent);
  nutrition.fiber = extract(nutritionData.fiberContent);
  nutrition.fat = extract(nutritionData.fatContent);
  nutrition.sugar = extract(nutritionData.sugarContent);
  
  return nutrition;
}

function validateGDNutrition(nutrition: any) {
  const carbs = nutrition.carbs || 0;
  const protein = nutrition.protein || 0;
  const fiber = nutrition.fiber || 0;

  if (carbs === 0) return { valid: false, reason: 'No carbohydrate data' };
  if (carbs < 10 || carbs > 50) return { valid: false, reason: `Carbs out of range: ${carbs}g (need 10-50g)` };
  if (protein < 5) return { valid: false, reason: `Low protein: ${protein}g (need 5g+)` };
  if (fiber < 2) return { valid: false, reason: `Low fiber: ${fiber}g (need 2g+)` };

  return { valid: true, reason: 'Meets GD requirements' };
}

function determineCategory(title: string): string {
  const lower = title.toLowerCase();
  if (/breakfast|egg|pancake|oatmeal|smoothie|granola/.test(lower)) return 'breakfast';
  if (/snack|bite|energy|bar/.test(lower)) return 'snacks';
  if (/lunch|sandwich|wrap|salad|soup/.test(lower)) return 'lunch';
  return 'dinner';
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}