# Recipe Scraping Implementation Plan

## Current Situation
We've built a smart scraper framework that can:
- ✅ Verify URLs actually exist 
- ✅ Extract recipes from JSON-LD structured data
- ✅ Validate nutrition for GD requirements
- ✅ Parse ingredients and instructions
- ✅ Categorize recipes automatically

However, the test runs showed that:
- Many recipe sites have changed their URL structures
- Sites are using JavaScript rendering (need headless browser)
- Some sites block automated scraping

## Working Solution Options

### Option 1: Use Recipe APIs (Fastest)
Instead of scraping, use legitimate APIs:

```javascript
// Example: Edamam API (free tier)
const EDAMAM_APP_ID = 'your-app-id';
const EDAMAM_APP_KEY = 'your-app-key';

async function searchRecipes(query, filters) {
    const url = new URL('https://api.edamam.com/api/recipes/v2');
    url.searchParams.append('q', query);
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    url.searchParams.append('diet', 'balanced');
    url.searchParams.append('health', 'sugar-conscious');
    
    // Filter for GD-appropriate carb ranges
    url.searchParams.append('nutrients[CHOCDF]', '15-45'); // 15-45g carbs
    url.searchParams.append('nutrients[PROCNT]', '10+');    // 10g+ protein
    
    const response = await fetch(url);
    return response.json();
}
```

### Option 2: Manual Recipe Collection
1. Find recipes manually from trusted sources
2. Use browser extensions to extract recipe data
3. Verify each recipe meets GD requirements
4. Build collection over time

### Option 3: Enhanced Scraper with Puppeteer
For sites with JavaScript rendering:

```javascript
const puppeteer = require('puppeteer');

async function scrapeWithPuppeteer(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract JSON-LD
    const jsonLd = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'Recipe') return data;
            } catch (e) {}
        }
        return null;
    });
    
    await browser.close();
    return jsonLd;
}
```

### Option 4: Partner with Recipe Bloggers
1. Contact GD-friendly recipe bloggers
2. Get permission to use their recipes
3. They provide recipe data in exchange for attribution
4. Quality assured by actual people with GD

## Recommended Approach

### Phase 1: Quick Start (1 week)
1. Sign up for Edamam API (free tier = 10,000 calls/month)
2. Search for recipes with these filters:
   - Carbs: 15-45g
   - Protein: 10g+
   - Fiber: 3g+
   - Max time: 45 minutes
3. Import 100-200 recipes quickly

### Phase 2: Quality Enhancement (2-3 weeks)
1. Partner with 3-5 GD recipe bloggers
2. Get permission for their best recipes
3. Manually verify nutrition data
4. Add these as "featured" or "verified" recipes

### Phase 3: Long-term Growth (ongoing)
1. Build relationships with more bloggers
2. Create original recipes with dietitian
3. User-submitted recipes (with verification)

## Sample Implementation

```javascript
class RecipeImporter {
    constructor() {
        this.sources = {
            edamam: new EdamamAPI(),
            manual: new ManualImporter(),
            partnerships: new PartnershipManager()
        };
    }
    
    async importRecipes() {
        const recipes = [];
        
        // Get from API
        const apiRecipes = await this.sources.edamam.search({
            query: 'gestational diabetes friendly',
            filters: {
                carbs: [15, 45],
                protein: [10, null],
                fiber: [3, null],
                time: [0, 45]
            }
        });
        
        // Validate each recipe
        for (const recipe of apiRecipes) {
            if (this.validateForGD(recipe)) {
                recipes.push(this.formatRecipe(recipe));
            }
        }
        
        return recipes;
    }
    
    validateForGD(recipe) {
        const { carbs, protein, fiber } = recipe.nutrition;
        
        // Breakfast: 25-35g carbs
        // Lunch/Dinner: 30-45g carbs  
        // Snacks: 15-20g carbs
        
        return carbs >= 15 && carbs <= 45 && 
               protein >= 10 && 
               fiber >= 3;
    }
}
```

## Next Steps

1. **Immediate Action**: Sign up for Edamam API
2. **This Week**: Import 100 recipes via API
3. **Next Week**: Contact 5 GD bloggers for partnerships
4. **This Month**: Launch with 200+ verified recipes

## Cost Analysis

- Edamam API: Free (10K calls) or $500/month (unlimited)
- Spoonacular: Free (150/day) or $299/month
- Manual collection: Time only
- Partnerships: Usually free with attribution

## Success Metrics

- 300+ real recipes within 30 days
- All recipes verified to exist at source
- 100% meet GD nutritional requirements
- Average user rating 4.5+ stars