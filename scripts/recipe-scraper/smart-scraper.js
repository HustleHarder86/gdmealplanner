#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Smart Recipe Scraper for Gestational Diabetes Recipes
 * Scrapes REAL recipes from legitimate sources with verification
 */

class SmartGDRecipeScraper {
    constructor() {
        this.outputDir = path.join(__dirname, 'output-verified-recipes');
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Make HTTP request and return response
     */
    async fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                headers: this.headers
            };
            
            protocol.get(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Verify that a URL actually exists
     */
    async verifyUrlExists(url) {
        try {
            const response = await this.fetchUrl(url);
            return response.statusCode === 200;
        } catch (error) {
            console.error(`Error verifying URL ${url}:`, error.message);
            return false;
        }
    }

    /**
     * Extract JSON-LD structured data
     */
    extractJsonLd(html) {
        const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
        const matches = [...html.matchAll(jsonLdRegex)];
        
        for (const match of matches) {
            try {
                const data = JSON.parse(match[1]);
                if (Array.isArray(data)) {
                    const recipe = data.find(item => item['@type'] === 'Recipe');
                    if (recipe) return recipe;
                } else if (data['@type'] === 'Recipe') {
                    return data;
                }
            } catch (e) {
                // Invalid JSON, continue
            }
        }
        return null;
    }

    /**
     * Parse duration string to minutes
     */
    parseDuration(duration) {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;
        
        let minutes = 0;
        
        // PT30M format
        const minMatch = duration.match(/(\d+)M/);
        if (minMatch) minutes += parseInt(minMatch[1]);
        
        // PT1H30M format
        const hourMatch = duration.match(/(\d+)H/);
        if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
        
        return minutes;
    }

    /**
     * Parse ingredient text
     */
    parseIngredient(text) {
        if (!text || typeof text !== 'string') return null;
        
        text = text.trim();
        
        // Try to match: amount unit item
        const patterns = [
            /^([\d\s\-\/\.]+)\s*(cups?|tbsp|tsp|oz|lb|g|ml|L)\s+(.+)$/i,
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

    /**
     * Parse nutrition data
     */
    parseNutrition(nutritionData) {
        const nutrition = {
            calories: 0,
            carbs: 0,
            fiber: 0,
            sugar: 0,
            protein: 0,
            fat: 0,
            saturatedFat: 0,
            sodium: 0
        };
        
        if (!nutritionData) return nutrition;
        
        // Map schema.org properties
        const mappings = {
            calories: ['calories', 'energy'],
            carbs: ['carbohydrateContent', 'carbohydrate'],
            fiber: ['fiberContent', 'fiber'],
            sugar: ['sugarContent', 'sugar'],
            protein: ['proteinContent', 'protein'],
            fat: ['fatContent', 'fat'],
            saturatedFat: ['saturatedFatContent'],
            sodium: ['sodiumContent', 'sodium']
        };
        
        for (const [ourKey, schemaKeys] of Object.entries(mappings)) {
            for (const schemaKey of schemaKeys) {
                if (nutritionData[schemaKey]) {
                    const value = nutritionData[schemaKey];
                    if (typeof value === 'number') {
                        nutrition[ourKey] = value;
                    } else {
                        const match = String(value).match(/(\d+)/);
                        if (match) {
                            nutrition[ourKey] = parseInt(match[1]);
                        }
                    }
                    break;
                }
            }
        }
        
        return nutrition;
    }

    /**
     * Validate if recipe meets GD requirements
     */
    validateGDNutrition(nutrition) {
        const carbs = nutrition.carbs || 0;
        const fiber = nutrition.fiber || 0;
        const protein = nutrition.protein || 0;
        
        // Must have carb data
        if (carbs === 0) return false;
        
        // Check reasonable ranges
        if (carbs < 10 || carbs > 50) return false;
        if (fiber < 2) return false;
        if (protein < 5) return false;
        
        return true;
    }

    /**
     * Parse recipe from structured data
     */
    parseRecipeData(data, url) {
        if (!data || !data.name) return null;
        
        const recipe = {
            url: url,
            source: new URL(url).hostname,
            scraped_at: new Date().toISOString(),
            verified: true,
            title: data.name,
            description: data.description || '',
            prepTime: this.parseDuration(data.prepTime),
            cookTime: this.parseDuration(data.cookTime),
            totalTime: 0,
            servings: parseInt(data.recipeYield) || 4,
            ingredients: [],
            instructions: [],
            nutrition: {},
            tags: []
        };
        
        // Calculate total time
        recipe.totalTime = this.parseDuration(data.totalTime) || 
                          (recipe.prepTime + recipe.cookTime);
        
        // Skip if over 45 minutes
        if (recipe.totalTime > 45) {
            console.log(`Skipping ${recipe.title} - too long (${recipe.totalTime} min)`);
            return null;
        }
        
        // Parse ingredients
        if (Array.isArray(data.recipeIngredient)) {
            recipe.ingredients = data.recipeIngredient
                .map(ing => this.parseIngredient(ing))
                .filter(ing => ing !== null);
        }
        
        // Parse instructions
        if (Array.isArray(data.recipeInstructions)) {
            recipe.instructions = data.recipeInstructions.map(inst => {
                if (typeof inst === 'string') return inst;
                if (inst.text) return inst.text;
                if (inst.name) return inst.name;
                return '';
            }).filter(inst => inst.length > 5);
        }
        
        // Parse nutrition
        recipe.nutrition = this.parseNutrition(data.nutrition);
        
        // Validate GD requirements
        if (!this.validateGDNutrition(recipe.nutrition)) {
            console.log(`Skipping ${recipe.title} - doesn't meet GD requirements`);
            return null;
        }
        
        // Determine category
        recipe.category = this.determineCategory(recipe.title, recipe.nutrition);
        
        // Add tags
        if (recipe.totalTime <= 30) recipe.tags.push('30-minutes-or-less');
        if (recipe.nutrition.protein >= 20) recipe.tags.push('high-protein');
        if (recipe.nutrition.fiber >= 5) recipe.tags.push('high-fiber');
        
        return recipe;
    }

    /**
     * Determine recipe category
     */
    determineCategory(title, nutrition) {
        const titleLower = title.toLowerCase();
        const carbs = nutrition.carbs || 0;
        
        // Check title keywords
        if (/breakfast|morning|egg|oatmeal|pancake|smoothie/.test(titleLower)) {
            return 'breakfast';
        }
        if (/snack|bite|mini/.test(titleLower)) {
            return 'snacks';
        }
        if (/lunch|sandwich|wrap|salad|soup/.test(titleLower)) {
            return 'lunch';
        }
        if (/dinner|main|entree|roast/.test(titleLower)) {
            return 'dinner';
        }
        
        // Use carb content
        if (carbs <= 20) return 'snacks';
        if (carbs <= 35) return 'lunch';
        return 'dinner';
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Diabetes.org specific scraper
 */
class DiabetesOrgScraper extends SmartGDRecipeScraper {
    constructor() {
        super();
        this.baseUrl = 'https://diabetes.org';
    }

    /**
     * Find recipe URLs from diabetes.org
     */
    async findRecipeUrls() {
        console.log('Finding recipe URLs from diabetes.org...');
        const recipeUrls = new Set();
        
        // Pages to check - updated URLs
        const sections = [
            '/food-and-nutrition/recipes',
            '/recipes',
            '/healthy-living/recipes',
            '/food-nutrition/recipes'
        ];
        
        for (const section of sections) {
            try {
                console.log(`Checking ${this.baseUrl}${section}`);
                const response = await this.fetchUrl(this.baseUrl + section);
                
                if (response.statusCode === 200) {
                    // Extract recipe links - more flexible patterns
                    const linkPatterns = [
                        /href="([^"]*\/recipe[s]?\/[^"]+)"/g,
                        /href="([^"]+)" class="[^"]*recipe[^"]*"/g,
                        /<a[^>]+href="([^"]+)"[^>]*>.*?recipe.*?<\/a>/gi
                    ];
                    
                    for (const pattern of linkPatterns) {
                        const matches = [...response.body.matchAll(pattern)];
                        for (const match of matches) {
                            const url = match[1];
                            // Filter to get actual recipe pages
                            if (url && url.length > 10 && 
                                !url.includes('?') && 
                                !url.includes('#') &&
                                !url.endsWith('/recipes') &&
                                !url.endsWith('/recipes/')) {
                                const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;
                                // Only add if it looks like a recipe URL
                                if (fullUrl.includes('recipe')) {
                                    recipeUrls.add(fullUrl);
                                }
                            }
                        }
                    }
                    
                    console.log(`  Found ${recipeUrls.size} recipes so far`);
                }
                
                await this.sleep(1000); // Rate limit
            } catch (error) {
                console.error(`Error fetching ${section}:`, error.message);
            }
        }
        
        return Array.from(recipeUrls);
    }

    /**
     * Scrape a single recipe
     */
    async scrapeRecipe(url) {
        console.log(`Scraping recipe: ${url}`);
        
        // Verify URL exists
        const exists = await this.verifyUrlExists(url);
        if (!exists) {
            console.log(`URL does not exist: ${url}`);
            return null;
        }
        
        try {
            const response = await this.fetchUrl(url);
            if (response.statusCode !== 200) return null;
            
            // Extract JSON-LD
            const jsonLd = this.extractJsonLd(response.body);
            if (jsonLd) {
                console.log('Found JSON-LD data');
                return this.parseRecipeData(jsonLd, url);
            }
            
            // Fall back to manual extraction
            console.log('No structured data found, skipping manual extraction');
            return null;
            
        } catch (error) {
            console.error(`Error scraping ${url}:`, error.message);
            return null;
        }
    }
}

// Main execution
async function main() {
    console.log('Starting Smart GD Recipe Scraper\n');
    
    const scraper = new DiabetesOrgScraper();
    
    // Find recipe URLs
    const recipeUrls = await scraper.findRecipeUrls();
    console.log(`\nFound ${recipeUrls.length} potential recipe URLs\n`);
    
    // Scrape recipes (limit to 10 for testing)
    const successfulRecipes = [];
    const limit = Math.min(10, recipeUrls.length);
    
    for (let i = 0; i < limit; i++) {
        console.log(`\nProcessing recipe ${i + 1}/${limit}`);
        
        const recipe = await scraper.scrapeRecipe(recipeUrls[i]);
        if (recipe) {
            successfulRecipes.push(recipe);
            console.log(`✓ Successfully scraped: ${recipe.title}`);
            console.log(`  Carbs: ${recipe.nutrition.carbs}g, Protein: ${recipe.nutrition.protein}g`);
        }
        
        await scraper.sleep(2000); // Rate limit
    }
    
    // Save results
    console.log(`\n\nSuccessfully scraped ${successfulRecipes.length} recipes`);
    
    if (successfulRecipes.length > 0) {
        const outputFile = path.join(scraper.outputDir, 'diabetes_org_recipes.json');
        fs.writeFileSync(outputFile, JSON.stringify(successfulRecipes, null, 2));
        
        console.log(`\nSaved recipes to ${outputFile}`);
        
        // Summary
        console.log('\nRecipe Summary:');
        successfulRecipes.forEach(recipe => {
            console.log(`- ${recipe.title}`);
            console.log(`  URL: ${recipe.url}`);
            console.log(`  Category: ${recipe.category}`);
            console.log(`  Nutrition: ${recipe.nutrition.carbs}g carbs, ${recipe.nutrition.protein}g protein`);
        });
    }
}

// Run the scraper
main().catch(error => {
    console.error('Error running scraper:', error);
    process.exit(1);
});