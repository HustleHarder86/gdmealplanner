#!/usr/bin/env python3
"""
Command-line interface for the GD Recipe Scraper.
Provides easy access to scraping, validation, and review functions.
"""

import json
import sys
from datetime import datetime
from typing import List, Dict, Optional
import argparse
from recipe_scraper import (
    RecipeScraper, DiabetesFoodHubScraper, GestationalDiabetesUKScraper,
    RecipeValidator, RecipeStorage, ManualReviewQueue, ImageOptimizer
)


class RecipeScraperCLI:
    """Command-line interface for recipe scraper."""
    
    def __init__(self):
        self.validator = RecipeValidator()
        self.storage = None
        self.review_queue = None
        
    def setup_storage(self, firebase_creds: Optional[str]):
        """Setup Firebase storage if credentials provided."""
        if firebase_creds:
            self.storage = RecipeStorage(firebase_creds)
            
    def setup_review_queue(self, queue_file: str):
        """Setup review queue."""
        self.review_queue = ManualReviewQueue(queue_file)
        
    def scrape_recipes(self, source: str, max_recipes: int, save_json: str) -> List[Dict]:
        """Scrape recipes from specified source."""
        scrapers = []
        
        if source in ['diabetesfoodhub', 'all']:
            scrapers.append(DiabetesFoodHubScraper())
        if source in ['gduk', 'all']:
            scrapers.append(GestationalDiabetesUKScraper())
            
        all_recipes = []
        
        for scraper in scrapers:
            print(f"\n🔍 Scraping {scraper.site_name}...")
            
            # Define URLs based on scraper type
            if isinstance(scraper, DiabetesFoodHubScraper):
                urls = [
                    f"{scraper.base_url}/recipes/breakfast",
                    f"{scraper.base_url}/recipes/lunch",
                    f"{scraper.base_url}/recipes/dinner"
                ]
            else:
                urls = [f"{scraper.base_url}/recipes/"]
                
            for url in urls:
                print(f"  📁 Category: {url}")
                recipes = scraper.scrape_recipe_list(url, max_recipes)
                all_recipes.extend(recipes)
                
        # Save to JSON
        with open(save_json, 'w') as f:
            json.dump(all_recipes, f, indent=2)
            
        return all_recipes
        
    def validate_recipes(self, recipes: List[Dict]) -> tuple:
        """Validate all recipes and return valid/invalid lists."""
        valid_recipes = []
        invalid_recipes = []
        
        for recipe in recipes:
            is_valid, issues = self.validator.validate_recipe(recipe)
            
            if is_valid:
                valid_recipes.append(recipe)
            else:
                invalid_recipes.append((recipe, issues))
                if self.review_queue:
                    self.review_queue.add_to_queue(recipe, issues)
                    
        return valid_recipes, invalid_recipes
        
    def save_to_firestore(self, recipes: List[Dict], user_id: str = "scraper"):
        """Save recipes to Firestore."""
        if not self.storage:
            print("❌ Firestore storage not configured")
            return
            
        saved_count = 0
        for recipe in recipes:
            if not self.storage.recipe_exists(recipe['title']):
                recipe_id = self.storage.save_recipe(recipe, user_id)
                if recipe_id:
                    saved_count += 1
                    print(f"  ✅ Saved: {recipe['title']}")
            else:
                print(f"  ⏭️  Skipped (exists): {recipe['title']}")
                
        return saved_count
        
    def review_pending_recipes(self):
        """Interactive review of pending recipes."""
        if not self.review_queue:
            print("❌ Review queue not configured")
            return
            
        pending = self.review_queue.get_pending_reviews()
        
        if not pending:
            print("✅ No recipes pending review")
            return
            
        print(f"\n📋 {len(pending)} recipes pending review\n")
        
        for i, item in enumerate(pending):
            recipe = item['recipe']
            issues = item['issues']
            
            print(f"\n{'='*60}")
            print(f"Recipe {i+1}/{len(pending)}: {recipe['title']}")
            print(f"Source: {recipe.get('sourceSite', 'Unknown')}")
            print(f"Issues: {', '.join(issues)}")
            
            # Show nutrition info
            nutrition = recipe.get('nutrition', {})
            print(f"\nNutrition per serving:")
            print(f"  Calories: {nutrition.get('calories', 0)}")
            print(f"  Carbs: {nutrition.get('carbs', 0)}g")
            print(f"  Protein: {nutrition.get('protein', 0)}g")
            print(f"  Fat: {nutrition.get('fat', 0)}g")
            print(f"  Fiber: {nutrition.get('fiber', 0)}g")
            
            # Get user decision
            while True:
                decision = input("\nApprove? (y/n/s=skip/q=quit): ").lower()
                if decision in ['y', 'n', 's', 'q']:
                    break
                    
            if decision == 'q':
                break
            elif decision == 'y':
                self.review_queue.mark_reviewed(i, True)
                print("✅ Approved")
            elif decision == 'n':
                self.review_queue.mark_reviewed(i, False)
                print("❌ Rejected")
            else:
                print("⏭️  Skipped")
                
    def import_from_json(self, json_file: str):
        """Import recipes from JSON file."""
        try:
            with open(json_file, 'r') as f:
                recipes = json.load(f)
                
            print(f"\n📥 Loaded {len(recipes)} recipes from {json_file}")
            
            # Validate recipes
            valid, invalid = self.validate_recipes(recipes)
            
            print(f"\n✅ Valid recipes: {len(valid)}")
            print(f"❌ Invalid recipes: {len(invalid)}")
            
            if invalid:
                print("\nInvalid recipes:")
                for recipe, issues in invalid[:5]:  # Show first 5
                    print(f"  - {recipe['title']}: {', '.join(issues)}")
                if len(invalid) > 5:
                    print(f"  ... and {len(invalid) - 5} more")
                    
            # Save valid recipes
            if valid and self.storage:
                print("\n💾 Saving to Firestore...")
                saved = self.save_to_firestore(valid)
                print(f"✅ Saved {saved} new recipes")
                
            return valid, invalid
            
        except Exception as e:
            print(f"❌ Error importing from JSON: {e}")
            return [], []
            
    def show_stats(self, recipes: List[Dict]):
        """Show statistics about recipes."""
        if not recipes:
            print("No recipes to analyze")
            return
            
        print(f"\n📊 Recipe Statistics")
        print(f"{'='*40}")
        print(f"Total recipes: {len(recipes)}")
        
        # GD friendly count
        gd_friendly = sum(1 for r in recipes if r.get('isGDFriendly', False))
        print(f"GD friendly: {gd_friendly} ({gd_friendly/len(recipes)*100:.1f}%)")
        
        # Meal type distribution
        meal_types = {}
        for recipe in recipes:
            for tag in recipe.get('tags', []):
                if tag in ['breakfast', 'lunch', 'dinner', 'snack']:
                    meal_types[tag] = meal_types.get(tag, 0) + 1
                    
        print("\nMeal types:")
        for meal_type, count in meal_types.items():
            print(f"  {meal_type.capitalize()}: {count}")
            
        # Average nutrition
        total_nutrition = {
            'calories': 0, 'carbs': 0, 'protein': 0, 'fat': 0, 'fiber': 0
        }
        
        for recipe in recipes:
            nutrition = recipe.get('nutrition', {})
            for key in total_nutrition:
                total_nutrition[key] += nutrition.get(key, 0)
                
        print("\nAverage nutrition per serving:")
        for key, value in total_nutrition.items():
            avg = value / len(recipes) if recipes else 0
            print(f"  {key.capitalize()}: {avg:.1f}{'g' if key != 'calories' else ''}")


def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description='GD Recipe Scraper CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape recipes from all sources
  python cli.py scrape --source all --max-recipes 5
  
  # Import recipes from JSON file
  python cli.py import --json-file sample_recipes.json
  
  # Review pending recipes
  python cli.py review
  
  # Show statistics for scraped recipes
  python cli.py stats --json-file scraped_recipes.json
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Scrape command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape recipes from websites')
    scrape_parser.add_argument('--source', choices=['diabetesfoodhub', 'gduk', 'all'], 
                              default='all', help='Recipe source')
    scrape_parser.add_argument('--max-recipes', type=int, default=10,
                              help='Max recipes per source')
    scrape_parser.add_argument('--save-json', default='scraped_recipes.json',
                              help='Output JSON file')
    scrape_parser.add_argument('--firebase-creds', help='Firebase credentials file')
    scrape_parser.add_argument('--no-save', action='store_true',
                              help='Don\'t save to Firestore')
    
    # Import command
    import_parser = subparsers.add_parser('import', help='Import recipes from JSON')
    import_parser.add_argument('--json-file', required=True, help='JSON file to import')
    import_parser.add_argument('--firebase-creds', help='Firebase credentials file')
    
    # Review command
    review_parser = subparsers.add_parser('review', help='Review pending recipes')
    review_parser.add_argument('--queue-file', default='review_queue.json',
                              help='Review queue file')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show recipe statistics')
    stats_parser.add_argument('--json-file', required=True, help='JSON file to analyze')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    # Initialize CLI
    cli = RecipeScraperCLI()
    
    if args.command == 'scrape':
        print("🚀 Starting recipe scraper...")
        
        # Setup storage
        if not args.no_save and args.firebase_creds:
            cli.setup_storage(args.firebase_creds)
            
        # Setup review queue
        cli.setup_review_queue('review_queue.json')
        
        # Scrape recipes
        recipes = cli.scrape_recipes(args.source, args.max_recipes, args.save_json)
        
        # Validate and save
        valid, invalid = cli.validate_recipes(recipes)
        
        print(f"\n📊 Scraping complete!")
        print(f"✅ Valid recipes: {len(valid)}")
        print(f"❌ Invalid recipes: {len(invalid)}")
        
        if valid and not args.no_save and cli.storage:
            saved = cli.save_to_firestore(valid)
            print(f"💾 Saved {saved} recipes to Firestore")
            
        cli.show_stats(recipes)
        
    elif args.command == 'import':
        print(f"📥 Importing recipes from {args.json_file}...")
        
        if args.firebase_creds:
            cli.setup_storage(args.firebase_creds)
            
        cli.setup_review_queue('review_queue.json')
        valid, invalid = cli.import_from_json(args.json_file)
        
    elif args.command == 'review':
        print("📋 Starting recipe review...")
        cli.setup_review_queue(args.queue_file)
        cli.review_pending_recipes()
        
    elif args.command == 'stats':
        print(f"📊 Analyzing {args.json_file}...")
        
        try:
            with open(args.json_file, 'r') as f:
                recipes = json.load(f)
            cli.show_stats(recipes)
        except Exception as e:
            print(f"❌ Error loading file: {e}")


if __name__ == "__main__":
    main()