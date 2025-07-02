# GD Recipe Scraper

A Python-based recipe scraper specifically designed for gestational diabetes-friendly recipes. The scraper extracts recipes from multiple sources, validates them against GD guidelines, and stores them in a format compatible with the GD Meal Planner Firebase backend.

## Features

- **Multi-source scraping**: Supports diabetesfoodhub.org and gestationaldiabetes.co.uk
- **GD validation**: Ensures recipes meet the 15-30g carbohydrate per meal guideline
- **Nutritional analysis**: Extracts and calculates comprehensive nutrition information
- **Glycemic index estimation**: Estimates GI based on ingredients and fiber content
- **Rate limiting**: Respectful scraping with configurable delays
- **Image optimization**: Downloads and optimizes recipe images
- **Manual review queue**: Quality control system for recipes that need human review
- **Firebase integration**: Direct storage to Firestore database
- **Flexible CLI**: Command-line interface for easy operation

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. (Optional) Set up Firebase credentials:
   - Download your Firebase service account credentials JSON file
   - Keep it secure and don't commit to version control

## Usage

### Basic Commands

1. **Scrape recipes from all sources**:
```bash
python cli.py scrape --source all --max-recipes 10
```

2. **Import sample recipes** (for testing):
```bash
python cli.py import --json-file sample_recipes.json
```

3. **Review pending recipes**:
```bash
python cli.py review
```

4. **Show statistics**:
```bash
python cli.py stats --json-file scraped_recipes.json
```

### Advanced Usage

**Scrape with Firebase storage**:
```bash
python cli.py scrape \
  --source diabetesfoodhub \
  --max-recipes 20 \
  --firebase-creds path/to/credentials.json \
  --save-json recipes.json
```

**Dry run (no Firebase saves)**:
```bash
python cli.py scrape --source all --no-save
```

### Direct Script Usage

You can also use the scraper directly:

```bash
python recipe_scraper.py \
  --source all \
  --max-recipes 5 \
  --firebase-creds credentials.json \
  --save-json output.json
```

## Recipe Validation

Recipes are validated against the following criteria:

1. **Carbohydrate content**: 15-30g per serving (GD guideline)
2. **Required fields**: Title, ingredients, instructions, nutrition
3. **Nutritional completeness**: Calories must be present
4. **Instruction clarity**: At least one instruction step

Recipes failing validation are added to the review queue.

## Data Format

Scraped recipes follow the TypeScript Recipe interface structure:

```python
{
  "title": "Recipe Name",
  "description": "Recipe description",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1.0,
      "unit": "cup"
    }
  ],
  "instructions": ["Step 1", "Step 2"],
  "prepTime": 10,  # minutes
  "cookTime": 20,  # minutes
  "servings": 4,
  "nutrition": {
    "calories": 250,
    "carbs": 25,
    "protein": 20,
    "fat": 10,
    "fiber": 5,
    "sugar": 5,
    "sodium": 300,
    "cholesterol": 50,
    "saturatedFat": 3,
    "transFat": 0
  },
  "tags": ["gd-friendly", "dinner", "high-protein"],
  "imageUrl": "https://...",
  "sourceUrl": "https://...",
  "sourceSite": "Diabetes Food Hub",
  "estimatedGlycemicIndex": "low",
  "isGDFriendly": true,
  "scrapedAt": "2024-01-15T10:00:00"
}
```

## Review Queue

The review queue (`review_queue.json`) stores recipes that need manual verification:

- Recipes with validation issues
- Recipes with missing or questionable nutrition data
- Recipes at the carb limit boundaries

Use `python cli.py review` to interactively review and approve/reject recipes.

## Rate Limiting

The scraper implements polite scraping practices:

- 2-second delay between requests (configurable)
- 10-second timeout for each request
- User-Agent header to identify the bot
- Respects robots.txt (when implemented)

## Extending the Scraper

To add a new recipe source:

1. Create a new class inheriting from `RecipeScraper`
2. Implement the `scrape_recipe()` method
3. Implement the `scrape_recipe_list()` method
4. Add the scraper to the CLI in `cli.py`

Example:
```python
class NewSiteScraper(RecipeScraper):
    def __init__(self):
        super().__init__("https://newsite.com", "New Site")
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        # Implementation here
        pass
```

## Troubleshooting

1. **Import errors**: Ensure all dependencies are installed
2. **Firebase errors**: Check credentials file path and permissions
3. **Scraping errors**: Some sites may change their HTML structure
4. **Validation errors**: Review the nutrition data extraction logic

## Notes

- Always respect website terms of service
- Consider implementing caching for development
- Monitor scraping performance and adjust delays as needed
- Regularly review the manual queue for quality control