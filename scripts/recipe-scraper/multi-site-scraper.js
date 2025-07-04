#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Multi-site Recipe Scraper
 * Targets multiple known recipe sites with GD-friendly content
 */

class MultiSiteRecipeScraper {
    constructor() {
        this.outputDir = path.join(__dirname, 'output-verified-recipes');
        this.allRecipes = [];
        
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async fetchUrl(url) {
        return new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; GDRecipeScraper/1.0)'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ 
                    status: res.statusCode, 
                    body: data 
                }));
            }).on('error', reject);
        });
    }

    extractJsonLd(html) {
        const matches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        if (!matches) return null;

        for (const match of matches) {
            try {
                const json = match.replace(/<script[^>]+type="application\/ld\+json"[^>]*>|<\/script>/gi, '');
                const data = JSON.parse(json);
                
                if (Array.isArray(data)) {
                    const recipe = data.find(item => item['@type'] === 'Recipe');
                    if (recipe) return recipe;
                } else if (data['@type'] === 'Recipe') {
                    return data;
                }
            } catch (e) {
                // Continue to next match
            }
        }
        return null;
    }

    parseNutrition(data) {
        const nutrition = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fiber: 0,
            fat: 0,
            sugar: 0
        };

        if (!data) return nutrition;

        // Handle different nutrition formats
        const extract = (key, aliases) => {
            for (const alias of aliases) {
                if (data[alias]) {
                    const val = String(data[alias]).match(/\d+/);
                    if (val) return parseInt(val[0]);
                }
            }
            return 0;
        };

        nutrition.calories = extract('calories', ['calories', 'energy']);
        nutrition.carbs = extract('carbs', ['carbohydrateContent', 'carbohydrate', 'carbs']);
        nutrition.protein = extract('protein', ['proteinContent', 'protein']);
        nutrition.fiber = extract('fiber', ['fiberContent', 'fiber']);
        nutrition.fat = extract('fat', ['fatContent', 'fat']);
        nutrition.sugar = extract('sugar', ['sugarContent', 'sugar']);

        return nutrition;
    }

    isGDAppropriate(nutrition, category) {
        const carbs = nutrition.carbs || 0;
        const protein = nutrition.protein || 0;
        const fiber = nutrition.fiber || 0;

        // Must have nutrition data
        if (carbs === 0) return false;

        // Check by meal type
        if (category === 'breakfast') {
            return carbs >= 25 && carbs <= 35 && protein >= 10;
        } else if (category === 'lunch' || category === 'dinner') {
            return carbs >= 30 && carbs <= 45 && protein >= 15;
        } else if (category === 'snacks') {
            return carbs >= 15 && carbs <= 20 && protein >= 5;
        }

        // General check
        return carbs >= 15 && carbs <= 45 && protein >= 5;
    }

    async scrapeRecipe(url, source) {
        try {
            console.log(`Fetching: ${url}`);
            const response = await this.fetchUrl(url);
            
            if (response.status !== 200) {
                console.log(`  ❌ Failed: HTTP ${response.status}`);
                return null;
            }

            const jsonLd = this.extractJsonLd(response.body);
            if (!jsonLd) {
                console.log(`  ❌ No structured data found`);
                return null;
            }

            // Parse recipe
            const recipe = {
                title: jsonLd.name || '',
                url: url,
                source: source,
                description: jsonLd.description || '',
                prepTime: this.parseDuration(jsonLd.prepTime),
                cookTime: this.parseDuration(jsonLd.cookTime),
                totalTime: this.parseDuration(jsonLd.totalTime),
                servings: parseInt(jsonLd.recipeYield) || 4,
                ingredients: [],
                instructions: [],
                nutrition: this.parseNutrition(jsonLd.nutrition),
                category: this.determineCategory(jsonLd.name || ''),
                verified: true,
                scraped_at: new Date().toISOString()
            };

            // Skip if too long
            if (recipe.totalTime > 45) {
                console.log(`  ❌ Too long: ${recipe.totalTime} minutes`);
                return null;
            }

            // Parse ingredients
            if (Array.isArray(jsonLd.recipeIngredient)) {
                recipe.ingredients = jsonLd.recipeIngredient.map(ing => ({
                    text: ing,
                    parsed: this.parseIngredient(ing)
                }));
            }

            // Parse instructions
            if (jsonLd.recipeInstructions) {
                const instructions = Array.isArray(jsonLd.recipeInstructions) 
                    ? jsonLd.recipeInstructions 
                    : [jsonLd.recipeInstructions];
                
                recipe.instructions = instructions.map(inst => {
                    if (typeof inst === 'string') return inst;
                    return inst.text || inst.name || '';
                }).filter(text => text.length > 5);
            }

            // Validate for GD
            if (!this.isGDAppropriate(recipe.nutrition, recipe.category)) {
                console.log(`  ❌ Not GD appropriate: ${recipe.nutrition.carbs}g carbs`);
                return null;
            }

            console.log(`  ✅ Success: ${recipe.title} (${recipe.nutrition.carbs}g carbs)`);
            return recipe;

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            return null;
        }
    }

    parseDuration(duration) {
        if (!duration) return 0;
        const match = duration.match(/PT(\d+)M/);
        return match ? parseInt(match[1]) : 0;
    }

    parseIngredient(text) {
        const match = text.match(/^([\d\/\s]+)\s*(cup|tbsp|tsp|oz|lb)?\s*(.+)$/i);
        if (match) {
            return {
                amount: match[1].trim(),
                unit: match[2] || '',
                item: match[3].trim()
            };
        }
        return { amount: '', unit: '', item: text };
    }

    determineCategory(title) {
        const lower = title.toLowerCase();
        if (/breakfast|egg|pancake|oatmeal|smoothie/.test(lower)) return 'breakfast';
        if (/snack|bite|energy/.test(lower)) return 'snacks';
        if (/lunch|sandwich|salad|soup/.test(lower)) return 'lunch';
        return 'dinner';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Recipe sources with known working URLs
const RECIPE_SOURCES = [
    {
        name: 'AllRecipes Diabetic',
        urls: [
            'https://www.allrecipes.com/recipe/24383/basic-chicken-salad/',
            'https://www.allrecipes.com/recipe/228823/quick-chicken-piccata/',
            'https://www.allrecipes.com/recipe/8537/chicken-stir-fry/',
            'https://www.allrecipes.com/recipe/223042/chicken-parmesan/',
            'https://www.allrecipes.com/recipe/220854/chef-johns-chicken-marsala/',
            'https://www.allrecipes.com/recipe/242352/greek-lemon-chicken-and-potatoes/',
            'https://www.allrecipes.com/recipe/228293/curry-stand-chicken-tikka-masala-sauce/',
            'https://www.allrecipes.com/recipe/70343/slow-cooker-chicken-taco-soup/',
            'https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/',
            'https://www.allrecipes.com/recipe/16167/beef-stew-vi/'
        ]
    },
    {
        name: 'Food.com Diabetic',
        urls: [
            'https://www.food.com/recipe/baked-chicken-breasts-5586',
            'https://www.food.com/recipe/oven-fried-chicken-17988',
            'https://www.food.com/recipe/honey-mustard-grilled-chicken-8720',
            'https://www.food.com/recipe/chicken-cordon-bleu-8495',
            'https://www.food.com/recipe/baked-salmon-5458'
        ]
    },
    {
        name: 'EatingWell Diabetic',
        urls: [
            'https://www.eatingwell.com/recipe/249886/hasselback-sweet-potatoes/',
            'https://www.eatingwell.com/recipe/252141/cauliflower-rice/',
            'https://www.eatingwell.com/recipe/251997/roasted-broccoli/',
            'https://www.eatingwell.com/recipe/249594/roasted-brussels-sprouts/',
            'https://www.eatingwell.com/recipe/249544/garlic-roasted-carrots/'
        ]
    }
];

async function main() {
    console.log('🍳 Multi-Site GD Recipe Scraper\n');
    console.log('Scraping real recipes from multiple sources...\n');

    const scraper = new MultiSiteRecipeScraper();
    const allRecipes = [];

    for (const source of RECIPE_SOURCES) {
        console.log(`\n📍 Scraping from ${source.name}`);
        console.log('─'.repeat(50));

        for (const url of source.urls) {
            const recipe = await scraper.scrapeRecipe(url, source.name);
            if (recipe) {
                allRecipes.push(recipe);
            }
            await scraper.sleep(1500); // Rate limit
        }
    }

    // Save results
    console.log(`\n✅ Successfully scraped ${allRecipes.length} recipes\n`);

    if (allRecipes.length > 0) {
        // Save all recipes
        const outputFile = path.join(scraper.outputDir, 'verified_recipes.json');
        fs.writeFileSync(outputFile, JSON.stringify(allRecipes, null, 2));

        // Save by category
        const categories = {};
        allRecipes.forEach(recipe => {
            if (!categories[recipe.category]) categories[recipe.category] = [];
            categories[recipe.category].push(recipe);
        });

        for (const [category, recipes] of Object.entries(categories)) {
            const catFile = path.join(scraper.outputDir, `${category}_verified.json`);
            fs.writeFileSync(catFile, JSON.stringify(recipes, null, 2));
            console.log(`📁 ${category}: ${recipes.length} recipes`);
        }

        // Summary
        console.log('\n📊 Summary:');
        console.log(`Total recipes: ${allRecipes.length}`);
        console.log(`Average carbs: ${Math.round(allRecipes.reduce((sum, r) => sum + r.nutrition.carbs, 0) / allRecipes.length)}g`);
        console.log(`Average protein: ${Math.round(allRecipes.reduce((sum, r) => sum + r.nutrition.protein, 0) / allRecipes.length)}g`);
        
        console.log('\n🎯 Sample recipes:');
        allRecipes.slice(0, 5).forEach(recipe => {
            console.log(`- ${recipe.title}`);
            console.log(`  ${recipe.nutrition.carbs}g carbs, ${recipe.nutrition.protein}g protein`);
            console.log(`  ${recipe.url}`);
        });
    }
}

main().catch(console.error);