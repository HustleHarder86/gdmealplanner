# Smart Recipe Scraper Plan - Finding & Extracting Real GD Recipes

## Overview
Build an intelligent scraper that can find and extract REAL recipes from multiple legitimate sources, with verification that they actually exist.

## Advantages of Custom Scraper
- ✅ Free (no API costs)
- ✅ Can target GD-specific sources
- ✅ Full control over data quality
- ✅ Can verify URLs actually work
- ✅ Can extract exactly what we need

## Target Websites for Scraping

### Tier 1: Diabetes-Specific Sites
1. **diabetes.org/recipes**
   - American Diabetes Association
   - All recipes are diabetes-friendly
   - Clear nutrition data

2. **diabetesfoodhub.org**
   - Dedicated diabetes recipe site
   - Already know structure from previous attempt
   
3. **diabetesforecast.org/recipes**
   - Diabetes Forecast magazine
   - Tested recipes with full nutrition

4. **gestationaldiabetes.co.uk/recipes**
   - GD-specific recipes
   - UK-based but applicable everywhere

### Tier 2: Major Recipe Sites with Filters
1. **allrecipes.com**
   - Has diabetic-friendly category
   - Extensive nutrition data
   - User ratings help identify good recipes

2. **eatingwell.com**
   - Has diabetes meal plans
   - Professional nutrition data
   - RD-reviewed recipes

3. **cookinglight.com**
   - Low-carb sections
   - Detailed nutrition info

4. **food.com**
   - Diabetic recipe category
   - Community-tested recipes

## Smart Scraper Architecture

```python
class SmartGDRecipeScraper:
    def __init__(self):
        self.sources = [
            DiabetesOrgScraper(),
            DiabetesFoodHubScraper(),
            AllRecipesDiabeticScraper(),
            EatingWellScraper(),
            # ... more scrapers
        ]
        
    def find_gd_recipes(self):
        """Smart search for GD-appropriate recipes"""
        search_terms = [
            "gestational diabetes recipes",
            "diabetic pregnancy meals",
            "low carb pregnancy recipes",
            "30g carb meals",
            "diabetes friendly breakfast",
            # ... more targeted searches
        ]
        
    def verify_recipe_exists(self, url):
        """Verify URL returns 200 and has recipe content"""
        
    def extract_recipe_data(self, url):
        """Extract all recipe components"""
        
    def validate_gd_requirements(self, recipe):
        """Ensure meets GD nutritional needs"""
```

## Scraping Strategy

### 1. Search Phase
```python
# Use multiple search strategies
- Site-specific searches (site:diabetes.org recipes 30g carbs)
- Google Custom Search API for finding recipes
- Browse category pages (diabetic, low-carb, etc.)
- Follow "related recipes" links
```

### 2. Extraction Phase
```python
# Smart extraction using multiple methods
- JSON-LD structured data (most reliable)
- Microdata/RDFa markup
- Pattern matching for common formats
- AI-assisted extraction for difficult cases
```

### 3. Validation Phase
```python
# Verify everything is real
- Check URL returns 200 OK
- Verify recipe elements exist
- Validate nutrition meets GD requirements
- Ensure instructions are complete
```

## Technical Implementation

### Recipe Extractor Patterns
```python
def extract_recipe(self, soup, url):
    # Try structured data first
    json_ld = soup.find('script', type='application/ld+json')
    if json_ld and '@type': 'Recipe' in json_ld:
        return self.parse_json_ld(json_ld)
    
    # Try microdata
    recipe = soup.find(attrs={'itemtype': 'http://schema.org/Recipe'})
    if recipe:
        return self.parse_microdata(recipe)
    
    # Fall back to site-specific patterns
    return self.parse_html_patterns(soup, url)
```

### GD Validation Rules
```python
def is_gd_appropriate(self, nutrition):
    carbs = nutrition.get('carbs', 0)
    fiber = nutrition.get('fiber', 0)
    protein = nutrition.get('protein', 0)
    
    # Meal categories
    if self.is_breakfast(recipe):
        return 25 <= carbs <= 35 and protein >= 15
    elif self.is_main_meal(recipe):
        return 30 <= carbs <= 45 and protein >= 20
    elif self.is_snack(recipe):
        return 15 <= carbs <= 20 and protein >= 5
```

## Scraping Workflow

1. **Discovery Phase** (Find recipe URLs)
   ```
   Search → Filter → Verify URL exists → Add to queue
   ```

2. **Extraction Phase** (Get recipe data)
   ```
   Fetch page → Extract data → Validate completeness → Store
   ```

3. **Verification Phase** (Ensure quality)
   ```
   Check nutrition → Verify GD appropriate → Test instructions → Approve
   ```

## Avoiding Common Pitfalls

### Legal/Ethical Considerations
- Respect robots.txt
- Add delays between requests
- Include proper User-Agent
- Don't overwhelm servers
- Always attribute sources

### Technical Challenges
- Handle JavaScript-rendered pages (use Selenium if needed)
- Deal with various recipe formats
- Extract from images (OCR for scanned recipes)
- Handle missing nutrition data (calculate if needed)

## Sample Code Structure

```python
# main_scraper.py
class GDRecipeCollector:
    def collect_recipes(self, target_count=300):
        recipes = []
        
        # Phase 1: Collect from diabetes-specific sites
        for scraper in self.diabetes_scrapers:
            found = scraper.find_recipes(
                max_recipes=50,
                carb_range=(15, 45),
                require_nutrition=True
            )
            recipes.extend(found)
        
        # Phase 2: Search general sites with filters
        for scraper in self.general_scrapers:
            found = scraper.search_recipes(
                queries=["gestational diabetes", "30g carb meal"],
                filters={"diet": "diabetic-friendly"}
            )
            recipes.extend(found)
        
        # Phase 3: Validate all recipes
        validated = []
        for recipe in recipes:
            if self.validate_recipe(recipe):
                validated.append(recipe)
        
        return validated[:target_count]
```

## Data Storage Format

```json
{
  "id": "diabetes-org-chicken-veggie-stir-fry",
  "source": {
    "site": "diabetes.org",
    "url": "https://diabetes.org/recipes/chicken-veggie-stir-fry",
    "verified": true,
    "scraped_date": "2024-01-15"
  },
  "title": "Chicken and Vegetable Stir-Fry",
  "description": "Original description from site",
  "ingredients": [
    // Exact as shown on site
  ],
  "instructions": [
    // Step by step from source
  ],
  "nutrition": {
    // Verified nutrition data
  },
  "validation": {
    "gd_appropriate": true,
    "carb_range": "meal",
    "verified_url": true
  }
}
```

## Success Metrics

- ✅ 300+ real recipes from legitimate sources
- ✅ 100% of URLs verified working
- ✅ All recipes have complete data
- ✅ Meet GD nutritional requirements
- ✅ Properly attributed to sources

## Next Steps

1. Build base scraper framework
2. Create site-specific scrapers for top 5 sites
3. Implement GD validation rules
4. Test with 10 recipes per site
5. Scale up to 300+ recipes

This approach gives us REAL recipes while maintaining control and avoiding API costs!