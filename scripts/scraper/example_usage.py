#!/usr/bin/env python3
"""
Example usage of the Enhanced Recipe Scraper
Demonstrates various features and capabilities
"""

from enhanced_recipe_scraper import EnhancedRecipeScraper
from progress_dashboard import ProgressDashboard
import json


def example_basic_scraping():
    """Example 1: Basic scraping from a single source."""
    print("\n=== Example 1: Basic Scraping ===")
    
    # Create scraper instance
    scraper = EnhancedRecipeScraper(
        output_dir="example_output",
        enable_images=True
    )
    
    # Scrape 10 recipes from DiabetesFoodHub
    recipes = scraper.scrape_source('diabetesfoodhub', max_recipes=10)
    
    print(f"Collected {len(recipes)} recipes")
    if recipes:
        print(f"First recipe: {recipes[0]['title']}")
        print(f"  - Carbs: {recipes[0]['nutrition']['carbs']}g")
        print(f"  - GI: {recipes[0]['estimatedGlycemicIndex']}")
        print(f"  - Tags: {', '.join(recipes[0]['tags'][:5])}")


def example_quality_validation():
    """Example 2: Direct quality validation of a recipe."""
    print("\n=== Example 2: Quality Validation ===")
    
    from quality_validator import RecipeQualityValidator
    
    # Sample recipe data
    sample_recipe = {
        'title': 'Quinoa Vegetable Bowl',
        'ingredients': [
            {'name': 'quinoa', 'amount': 1, 'unit': 'cup'},
            {'name': 'mixed vegetables', 'amount': 2, 'unit': 'cups'},
            {'name': 'chickpeas', 'amount': 0.5, 'unit': 'cup'},
            {'name': 'olive oil', 'amount': 2, 'unit': 'tbsp'}
        ],
        'instructions': ['Cook quinoa', 'Sauté vegetables', 'Combine and serve'],
        'nutrition': {
            'calories': 320,
            'carbs': 45,
            'protein': 12,
            'fat': 8,
            'fiber': 8,
            'sugar': 6,
            'sodium': 200
        },
        'prepTime': 10,
        'cookTime': 20,
        'servings': 4
    }
    
    validator = RecipeQualityValidator()
    is_valid, errors, warnings = validator.validate_recipe(sample_recipe)
    
    print(f"Recipe: {sample_recipe['title']}")
    print(f"Valid: {is_valid}")
    if errors:
        print(f"Errors: {', '.join(errors)}")
    if warnings:
        print(f"Warnings: {', '.join(warnings)}")


def example_recipe_enrichment():
    """Example 3: Recipe enrichment demonstration."""
    print("\n=== Example 3: Recipe Enrichment ===")
    
    from recipe_enrichment import RecipeEnricher
    
    # Sample recipe
    sample_recipe = {
        'title': 'Mediterranean Chickpea Salad',
        'description': 'A fresh summer salad with Mediterranean flavors',
        'ingredients': [
            {'name': 'chickpeas', 'amount': 2, 'unit': 'cups'},
            {'name': 'cucumber', 'amount': 1, 'unit': 'cup'},
            {'name': 'tomatoes', 'amount': 1, 'unit': 'cup'},
            {'name': 'feta cheese', 'amount': 0.5, 'unit': 'cup'},
            {'name': 'olive oil', 'amount': 3, 'unit': 'tbsp'},
            {'name': 'lemon juice', 'amount': 2, 'unit': 'tbsp'}
        ],
        'instructions': ['Combine all ingredients', 'Toss with dressing', 'Chill and serve'],
        'nutrition': {'calories': 280, 'carbs': 35, 'protein': 12, 'fat': 10, 'fiber': 8}
    }
    
    enricher = RecipeEnricher()
    enriched = enricher.enrich_recipe(sample_recipe)
    
    print(f"Recipe: {enriched['title']}")
    print(f"Cuisine: {enriched.get('cuisine', 'Not detected')}")
    print(f"Seasonal Tags: {', '.join(enriched.get('seasonalTags', []))}")
    print(f"Batch Friendly: {enriched.get('batchFriendly', False)}")
    print(f"Shopping List Categories: {list(enriched.get('shoppingList', {}).keys())}")


def example_diversity_tracking():
    """Example 4: Diversity tracking and recommendations."""
    print("\n=== Example 4: Diversity Tracking ===")
    
    from diversity_tracker import DiversityTracker
    
    tracker = DiversityTracker()
    
    # Add some sample recipes
    sample_recipes = [
        {'title': 'Greek Salad', 'cuisine': 'mediterranean', 'tags': ['lunch', 'salad']},
        {'title': 'Stir Fry Vegetables', 'cuisine': 'asian', 'tags': ['dinner', 'quick']},
        {'title': 'Bean Burrito Bowl', 'cuisine': 'latin', 'tags': ['lunch', 'vegetarian']},
        {'title': 'Overnight Oats', 'cuisine': 'american', 'tags': ['breakfast', 'make-ahead']}
    ]
    
    for recipe in sample_recipes:
        should_add, reasons = tracker.add_recipe(recipe)
        print(f"Recipe: {recipe['title']} - Add: {should_add}")
        if reasons:
            print(f"  Reasons: {', '.join(reasons)}")
    
    # Get recommendations
    priorities = tracker.get_next_priorities(limit=3)
    print("\nNext priorities:")
    for priority in priorities:
        print(f"  - {priority['priority']}: {priority['focus']}")


def example_duplicate_detection():
    """Example 5: Duplicate detection between recipes."""
    print("\n=== Example 5: Duplicate Detection ===")
    
    from duplicate_detector import DuplicateDetector
    
    # Sample recipes with potential duplicates
    recipes = [
        {
            'title': 'Quinoa Vegetable Bowl',
            'ingredients': [
                {'name': 'quinoa', 'amount': 1, 'unit': 'cup'},
                {'name': 'mixed vegetables', 'amount': 2, 'unit': 'cups'}
            ],
            'nutrition': {'calories': 320, 'carbs': 45, 'protein': 12}
        },
        {
            'title': 'Veggie Quinoa Bowl',  # Similar to first
            'ingredients': [
                {'name': 'quinoa', 'amount': 1, 'unit': 'cup'},
                {'name': 'assorted vegetables', 'amount': 2, 'unit': 'cups'}
            ],
            'nutrition': {'calories': 310, 'carbs': 43, 'protein': 11}
        },
        {
            'title': 'Chicken Stir Fry',  # Different
            'ingredients': [
                {'name': 'chicken breast', 'amount': 8, 'unit': 'oz'},
                {'name': 'vegetables', 'amount': 2, 'unit': 'cups'}
            ],
            'nutrition': {'calories': 280, 'carbs': 20, 'protein': 35}
        }
    ]
    
    detector = DuplicateDetector(recipes[:1])  # Initialize with first recipe
    
    # Check second recipe
    similarity = detector.calculate_similarity(recipes[0], recipes[1])
    print(f"Comparing '{recipes[0]['title']}' with '{recipes[1]['title']}':")
    print(f"  - Title similarity: {similarity['title_similarity']:.2f}")
    print(f"  - Ingredient similarity: {similarity['ingredient_similarity']:.2f}")
    print(f"  - Nutrition similarity: {similarity['nutrition_similarity']:.2f}")
    print(f"  - Combined score: {similarity['combined_score']:.2f}")
    print(f"  - Is duplicate: {similarity['is_duplicate']}")


def example_progress_visualization():
    """Example 6: Generate and view progress dashboard."""
    print("\n=== Example 6: Progress Dashboard ===")
    
    # This would normally use real data
    print("To view the dashboard:")
    print("  Console: python progress_dashboard.py --mode console")
    print("  HTML: python progress_dashboard.py --mode html")
    print("  Live: python progress_dashboard.py --mode live")


def main():
    """Run all examples."""
    print("Enhanced Recipe Scraper - Examples")
    print("=" * 40)
    
    # Run examples
    example_basic_scraping()
    example_quality_validation()
    example_recipe_enrichment()
    example_diversity_tracking()
    example_duplicate_detection()
    example_progress_visualization()
    
    print("\n" + "=" * 40)
    print("Examples complete! Check example_output/ for results.")


if __name__ == "__main__":
    main()