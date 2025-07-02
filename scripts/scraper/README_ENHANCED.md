# Enhanced Recipe Scraper for Gestational Diabetes

A comprehensive Python-based recipe scraping system designed to collect, validate, and enrich gestational diabetes-friendly recipes from multiple reputable sources.

## Features

### 🔍 Multi-Source Scraping
- **DiabetesFoodHub.org** - ADA-approved recipes (highest priority)
- **EatingWell.com** - Diabetic diet sections
- **Healthline.com** - Gestational diabetes specific recipes
- **AllRecipes.com** - With diabetic-friendly filters

### 🖼️ Advanced Image Processing
- Automatic image downloading and validation
- WebP conversion for optimal web performance
- Thumbnail generation (300x225)
- Quality validation (minimum 400x300)
- Proper attribution storage

### ✅ Quality Validation
- **Carbohydrate limits**: 15-30g for snacks, 30-45g for meals
- **Minimum fiber**: 3g per serving
- **Glycemic index estimation** based on ingredients
- **Prep time validation**: Maximum 45 minutes
- **Common ingredient verification**

### 🌟 Recipe Enrichment
- **Seasonal tagging** based on ingredients
- **Cuisine classification** (Mediterranean, Asian, Latin, etc.)
- **Pregnancy trimester suitability**
- **Batch/freezer friendly flags**
- **Smart shopping list generation**
- **Cooking method extraction**

### 📊 Diversity Tracking
- Ensures cultural variety (60 Mediterranean, 60 Asian, 50 Latin, etc.)
- Seasonal distribution tracking
- Progress monitoring by category
- Automatic gap identification
- Prioritized collection recommendations

### 🔄 Duplicate Detection
- Fuzzy title matching (85% threshold)
- Ingredient similarity scoring
- Nutrition profile comparison
- Combined similarity metrics

### 🤖 Ethical Scraping
- Robots.txt compliance
- Rate limiting (2-second delays)
- Daily limits (50-60 recipes/day)
- Progress saving for resumability
- Respectful crawling practices

### 📈 Progress Dashboard
- Real-time collection statistics
- Interactive HTML dashboard
- Console-based progress viewer
- Visual charts and metrics
- Actionable recommendations

## Installation

1. Clone the repository:
```bash
cd /home/amy/dev/gdmealplanner/scripts/scraper
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. For NLP features, download spaCy model:
```bash
python -m spacy download en_core_web_sm
```

## Usage

### Basic Usage

Run a standard collection session:
```bash
python enhanced_recipe_scraper.py
```

### Advanced Options

```bash
# Scrape from specific sources
python enhanced_recipe_scraper.py --sources diabetesfoodhub eatingwell

# Set collection limits
python enhanced_recipe_scraper.py --max-per-source 100 --total-target 360

# Use Firebase for storage
python enhanced_recipe_scraper.py --firebase-creds path/to/credentials.json

# Skip image processing
python enhanced_recipe_scraper.py --no-images

# Custom output directory
python enhanced_recipe_scraper.py --output-dir custom_output
```

### View Progress Dashboard

```bash
# Console dashboard
python progress_dashboard.py --mode console

# Generate HTML dashboard
python progress_dashboard.py --mode html --output dashboard.html

# Live updating dashboard
python progress_dashboard.py --mode live
```

## Project Structure

```
/scripts/scraper/
├── enhanced_recipe_scraper.py    # Main orchestrator
├── scrapers/                      # Source-specific scrapers
│   ├── __init__.py
│   ├── base.py                   # Base scraper class
│   ├── diabetesfoodhub.py        # Diabetes Food Hub scraper
│   ├── eatingwell.py             # EatingWell scraper
│   ├── healthline.py             # Healthline scraper
│   └── allrecipes.py             # AllRecipes scraper
├── image_processor.py            # Image handling with WebP support
├── quality_validator.py          # Recipe quality validation
├── recipe_enrichment.py          # Metadata enrichment
├── diversity_tracker.py          # Collection diversity tracking
├── duplicate_detector.py         # Duplicate detection system
├── scraping_ethics.py            # Ethical scraping controls
├── progress_dashboard.py         # Progress visualization
└── requirements.txt              # Python dependencies
```

## Output Structure

```
scraped_data/
├── recipes/                      # JSON recipe files
│   ├── mediterranean_*.json
│   ├── asian_*.json
│   └── ...
├── images/                       # Processed images
│   ├── original/                # Original downloads
│   ├── optimized/               # WebP optimized versions
│   └── thumbnails/              # Generated thumbnails
└── reports/                      # Analytics and reports
    ├── diversity_report.json
    ├── validation_report.json
    ├── duplicate_report.json
    ├── scraping_progress.json
    ├── summary_report.json
    └── dashboard.html
```

## Recipe Schema

Each recipe includes:
```json
{
  "title": "Recipe Name",
  "description": "Brief description",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1.5,
      "unit": "cups"
    }
  ],
  "instructions": ["Step 1", "Step 2"],
  "nutrition": {
    "calories": 250,
    "carbs": 35,
    "protein": 15,
    "fat": 8,
    "fiber": 5,
    "sugar": 8,
    "sodium": 300
  },
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["gd-friendly", "mediterranean", "quick-meals"],
  "cuisine": "mediterranean",
  "seasonalTags": ["summer", "fall"],
  "estimatedGlycemicIndex": "low",
  "isGDFriendly": true,
  "trimesterSuitability": ["second_trimester", "third_trimester"],
  "batchFriendly": true,
  "freezerFriendly": false,
  "imageUrl": "/images/optimized/recipe_abc123.webp",
  "thumbnailUrl": "/images/thumbnails/recipe_abc123_thumb.webp",
  "sourceUrl": "https://...",
  "sourceSite": "Diabetes Food Hub",
  "processedAt": "2024-01-15T10:30:00",
  "validationStatus": {
    "valid": true,
    "warnings": []
  }
}
```

## Collection Guidelines

### Daily Workflow

1. **Morning Session** (50-60 recipes)
   - Focus on high-priority sources (DiabetesFoodHub)
   - Target underrepresented meal types

2. **Afternoon Review**
   - Check dashboard for progress
   - Review validation warnings
   - Address any duplicates

3. **Evening Planning**
   - Analyze diversity gaps
   - Plan next day's priorities

### Quality Targets

- **Minimum per category**: 90 recipes each (breakfast, lunch, dinner, snacks)
- **Cuisine diversity**: At least 6 different cuisines
- **Seasonal coverage**: Recipes for all seasons
- **Validation pass rate**: >85%
- **Duplicate rate**: <5%

## Monitoring & Analytics

### Real-time Metrics
- Collection progress by category
- Validation success rates
- Duplicate detection rates
- Source performance
- Daily collection trends

### Reports Generated
1. **Diversity Report** - Cultural and seasonal distribution
2. **Validation Report** - Quality metrics and issues
3. **Duplicate Report** - Similar recipes identified
4. **Progress Report** - Daily collection statistics
5. **Summary Report** - Overall project status

## Best Practices

1. **Start with high-quality sources** - Prioritize DiabetesFoodHub
2. **Monitor diversity early** - Ensure balanced collection
3. **Review validation failures** - Adjust criteria if needed
4. **Check duplicates regularly** - Maintain collection quality
5. **Respect rate limits** - Sustainable scraping practices

## Troubleshooting

### Common Issues

1. **Rate limiting errors**
   - Solution: Reduce `--max-per-source` parameter
   - Check `scraping_progress.json` for daily limits

2. **Low validation pass rate**
   - Review failed recipes in `validation_report.json`
   - Adjust source selection or validation criteria

3. **High duplicate rate**
   - Check `duplicate_report.json` for patterns
   - Consider adjusting similarity thresholds

4. **Image processing failures**
   - Verify image URLs are accessible
   - Check disk space for image storage
   - Use `--no-images` flag if needed

## Future Enhancements

- [ ] Machine learning for better GI prediction
- [ ] Automated recipe testing/scoring
- [ ] User feedback integration
- [ ] Multi-language support
- [ ] API endpoint for real-time access
- [ ] Mobile app integration

## License

This scraper is designed for educational and research purposes. Always respect website terms of service and robots.txt files.

## Support

For issues or questions, check the logs in `scraping.log` or review the generated reports in the `reports/` directory.