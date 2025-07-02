#!/usr/bin/env python3
"""
Test script for the GD Recipe Scraper.
Demonstrates basic functionality without requiring external connections.
"""

import json
from recipe_scraper import RecipeValidator, ManualReviewQueue


def test_validator():
    """Test recipe validation."""
    print("Testing Recipe Validator...")
    print("-" * 40)
    
    validator = RecipeValidator()
    
    # Test valid recipe
    valid_recipe = {
        "title": "Test Recipe",
        "ingredients": [{"name": "test", "amount": 1, "unit": "cup"}],
        "instructions": ["Step 1"],
        "nutrition": {"calories": 200, "carbs": 25}
    }
    
    is_valid, issues = validator.validate_recipe(valid_recipe)
    print(f"Valid recipe test: {'PASS' if is_valid else 'FAIL'}")
    if issues:
        print(f"  Issues: {issues}")
        
    # Test recipe with too many carbs
    high_carb_recipe = valid_recipe.copy()
    high_carb_recipe["nutrition"]["carbs"] = 45
    
    is_valid, issues = validator.validate_recipe(high_carb_recipe)
    print(f"High carb recipe test: {'PASS' if not is_valid else 'FAIL'}")
    if issues:
        print(f"  Issues: {issues}")
        
    # Test recipe with missing fields
    incomplete_recipe = {"title": "Incomplete"}
    
    is_valid, issues = validator.validate_recipe(incomplete_recipe)
    print(f"Incomplete recipe test: {'PASS' if not is_valid else 'FAIL'}")
    if issues:
        print(f"  Issues: {issues}")
        
    print()


def test_review_queue():
    """Test review queue functionality."""
    print("Testing Review Queue...")
    print("-" * 40)
    
    queue = ManualReviewQueue("test_review_queue.json")
    
    # Add test recipe to queue
    test_recipe = {
        "title": "Test Recipe for Review",
        "nutrition": {"carbs": 35}
    }
    issues = ["Carbs too high: 35g (maximum 30g)"]
    
    queue.add_to_queue(test_recipe, issues)
    print(f"Added recipe to queue")
    
    # Get pending reviews
    pending = queue.get_pending_reviews()
    print(f"Pending reviews: {len(pending)}")
    
    # Clean up
    import os
    if os.path.exists("test_review_queue.json"):
        os.remove("test_review_queue.json")
        
    print()


def test_sample_recipes():
    """Test loading and validating sample recipes."""
    print("Testing Sample Recipes...")
    print("-" * 40)
    
    try:
        with open("sample_recipes.json", "r") as f:
            recipes = json.load(f)
            
        print(f"Loaded {len(recipes)} sample recipes")
        
        validator = RecipeValidator()
        valid_count = 0
        
        for recipe in recipes:
            is_valid, issues = validator.validate_recipe(recipe)
            if is_valid:
                valid_count += 1
            else:
                print(f"  {recipe['title']}: {issues}")
                
        print(f"Valid recipes: {valid_count}/{len(recipes)}")
        
        # Show nutrition summary
        print("\nNutrition Summary:")
        for recipe in recipes[:3]:  # First 3 recipes
            nutrition = recipe.get('nutrition', {})
            print(f"  {recipe['title']}:")
            print(f"    Carbs: {nutrition.get('carbs', 0)}g")
            print(f"    Protein: {nutrition.get('protein', 0)}g")
            print(f"    Fiber: {nutrition.get('fiber', 0)}g")
            
    except FileNotFoundError:
        print("sample_recipes.json not found")
        
    print()


def test_ingredient_parsing():
    """Test ingredient parsing."""
    print("Testing Ingredient Parsing...")
    print("-" * 40)
    
    from recipe_scraper import DiabetesFoodHubScraper
    
    scraper = DiabetesFoodHubScraper()
    
    test_ingredients = [
        "1 cup flour",
        "2 tablespoons olive oil",
        "1/2 teaspoon salt",
        "3 eggs",
        "Fresh spinach leaves"
    ]
    
    for ing_text in test_ingredients:
        parsed = scraper.parse_ingredient(ing_text)
        print(f"{ing_text} -> {parsed}")
        
    print()


def test_glycemic_index_estimation():
    """Test GI estimation."""
    print("Testing Glycemic Index Estimation...")
    print("-" * 40)
    
    from recipe_scraper import DiabetesFoodHubScraper
    
    scraper = DiabetesFoodHubScraper()
    
    # High fiber recipe
    high_fiber = {
        "ingredients": [
            {"name": "quinoa"},
            {"name": "black beans"},
            {"name": "vegetables"}
        ],
        "nutrition": {"carbs": 30, "fiber": 10}
    }
    
    gi = scraper.estimate_glycemic_index(
        high_fiber["ingredients"], 
        high_fiber["nutrition"]
    )
    print(f"High fiber recipe GI: {gi}")
    
    # Low fiber recipe
    low_fiber = {
        "ingredients": [
            {"name": "white rice"},
            {"name": "sugar"}
        ],
        "nutrition": {"carbs": 30, "fiber": 2}
    }
    
    gi = scraper.estimate_glycemic_index(
        low_fiber["ingredients"], 
        low_fiber["nutrition"]
    )
    print(f"Low fiber recipe GI: {gi}")
    
    print()


def main():
    """Run all tests."""
    print("\n🧪 GD Recipe Scraper Test Suite\n")
    
    test_validator()
    test_review_queue()
    test_sample_recipes()
    test_ingredient_parsing()
    test_glycemic_index_estimation()
    
    print("✅ All tests completed!\n")


if __name__ == "__main__":
    main()