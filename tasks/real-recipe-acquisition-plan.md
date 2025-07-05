# Real Recipe Acquisition Plan - 300+ Exact Recipes

## Goal

Replace all generated recipes with 300+ REAL, medically-appropriate gestational diabetes recipes from legitimate sources.

## Challenge Analysis

- Need 300+ recipes that meet GD nutritional requirements
- Must have exact ingredients, instructions, and verified nutrition data
- Cannot use fake URLs or made-up recipes
- Need proper licensing/permission to use recipes

## Proposed Solution Strategy

### Option 1: Official API Partnerships (Recommended)

**Pros**: Legal, accurate, updated regularly
**Cons**: May require payment or partnership agreements

1. **Diabetic Living / Diabetic Gourmet Magazine**
   - Contact for API access or content partnership
   - Already focused on diabetes-friendly recipes
2. **American Diabetes Association**
   - diabetes.org has extensive recipe database
   - May offer API for healthcare apps
3. **Edamam Recipe API**
   - 2.3M+ recipes with full nutrition data
   - Has diet filters (low-carb, high-fiber)
   - $0-$500/month depending on usage
   - https://developer.edamam.com/
4. **Spoonacular API**
   - 365K+ recipes with instructions
   - Nutrition data included
   - Diet filters available
   - https://spoonacular.com/food-api

### Option 2: Manual Curation with Permission

**Pros**: Quality control, GD-specific
**Cons**: Time-intensive, need permissions

1. **Recipe Blog Partnerships**
   - Contact GD-focused food bloggers
   - Examples:
     - gestationaldiabetes.co.uk
     - thegdkitchen.com
     - gestationaldiabetesrecipes.com
   - Offer attribution/backlinks in exchange

2. **Dietitian Collaboration**
   - Partner with registered dietitians specializing in GD
   - Create original recipes specifically for your app
   - Ensures medical accuracy

### Option 3: Web Scraping with Verification

**Pros**: Large volume possible
**Cons**: Legal concerns, quality varies

1. **Scraping Strategy**
   - Only scrape sites that allow it (check robots.txt)
   - Always attribute sources
   - Verify nutritional data meets GD requirements
   - Sites to consider:
     - Public recipe databases
     - Government nutrition sites
     - Open recipe platforms

### Option 4: Hybrid Approach (Most Realistic)

Combine multiple strategies for best results:

1. **Phase 1: Core Recipes (50-100)**
   - Partner with 1-2 dietitians to create original GD recipes
   - These become your "premium" verified recipes
2. **Phase 2: API Integration (200-250)**
   - Use Edamam or Spoonacular API
   - Filter for GD-appropriate recipes:
     - Carbs: 15-45g per meal
     - High fiber (3g+ per meal)
     - Balanced protein
3. **Phase 3: Curated Collection (50-100)**
   - Partner with GD recipe blogs
   - Get permission for specific recipes
   - Manually verify all nutrition data

## Implementation Steps

### 1. Legal Foundation

- [ ] Create recipe attribution policy
- [ ] Draft partnership agreements
- [ ] Set up API accounts with usage limits
- [ ] Consult lawyer about recipe copyright

### 2. Technical Infrastructure

- [ ] Build recipe import system that preserves source data
- [ ] Create validation system for GD requirements
- [ ] Set up automated nutrition verification
- [ ] Implement source tracking for every recipe

### 3. Data Collection Pipeline

```
Source Recipe → Validation → Nutrition Check → GD Approval → Import
```

### 4. Quality Assurance

- [ ] Every recipe must have:
  - Verified source URL or attribution
  - Complete ingredients with exact measurements
  - Step-by-step instructions
  - Accurate nutrition data
  - Prep/cook times
  - Serving sizes

## Recipe Requirements Checklist

### Nutritional Requirements (per serving)

- **Breakfast**: 25-35g carbs, 15-20g protein, 5g+ fiber
- **Lunch/Dinner**: 30-45g carbs, 20g+ protein, 5g+ fiber
- **Snacks**: 15-20g carbs, 5-10g protein, 2g+ fiber
- **All**: Under 45 minutes total time

### Data Requirements

- [ ] Original source URL (working link)
- [ ] Recipe title (exact from source)
- [ ] Ingredients (exact measurements)
- [ ] Instructions (complete steps)
- [ ] Nutrition facts (verified)
- [ ] Allergen information
- [ ] Dietary tags (vegetarian, etc.)

## Recommended Tools

### Recipe Validation Script

```python
def validate_gd_recipe(recipe):
    # Check carb ranges
    # Verify protein minimums
    # Ensure fiber content
    # Validate cooking time
    # Check for complete data
    return is_valid, issues
```

### Source Tracking Database

```json
{
  "recipe_id": "...",
  "source": {
    "type": "api|partner|original",
    "name": "Edamam API",
    "url": "https://...",
    "license": "attribution required",
    "fetched_date": "2024-01-15"
  }
}
```

## Cost Estimates

### API Costs (Monthly)

- Edamam: $0-500 (free tier: 10,000 calls)
- Spoonacular: $0-299 (free tier: 150 calls/day)
- Custom development: $2,000-5,000

### Partnership Costs

- Dietitian recipes: $50-100 per recipe
- Blog partnerships: Often free with attribution
- Content licensing: Varies widely

## Timeline

### Month 1

- Set up legal framework
- Build import/validation system
- Create 25 original recipes with dietitian

### Month 2

- Integrate recipe API
- Import and validate 150 recipes
- Begin blog partnerships

### Month 3

- Complete 300+ recipe collection
- Quality assurance testing
- Launch with verified recipes

## Success Metrics

- 300+ real recipes with verified sources
- 100% pass GD nutritional requirements
- 0 fake or generated recipes
- Proper attribution for all content
- Average user rating 4.5+ stars

## Next Steps

1. Choose primary strategy (API vs. partnerships)
2. Set budget for recipe acquisition
3. Build validation/import system
4. Begin reaching out to partners
5. Start with 10-recipe pilot to test process
