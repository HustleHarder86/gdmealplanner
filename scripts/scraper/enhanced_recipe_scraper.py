#!/usr/bin/env python3
"""
Enhanced recipe scraper for gestational diabetes-friendly recipes.
Integrates all modules for comprehensive recipe collection with quality controls.
"""

import json
import logging
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import os

# Import all our modules
from scrapers import (
    DiabetesFoodHubScraper,
    EatingWellScraper,
    HealthlineScraper,
    AllRecipesScraper
)
from image_processor import ImageProcessor
from quality_validator import RecipeQualityValidator
from recipe_enrichment import RecipeEnricher
from diversity_tracker import DiversityTracker
from duplicate_detector import DuplicateDetector
from scraping_ethics import EthicalScraper
from progress_dashboard import ProgressDashboard

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logging.warning("Firebase not available - will save to JSON only")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraping.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class EnhancedRecipeScraper:
    """Main orchestrator for enhanced recipe scraping."""
    
    def __init__(self, 
                 output_dir: str = "scraped_data",
                 firebase_creds: Optional[str] = None,
                 enable_images: bool = True):
        """
        Initialize the enhanced scraper.
        
        Args:
            output_dir: Directory for output files
            firebase_creds: Path to Firebase credentials
            enable_images: Whether to download and process images
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / "recipes").mkdir(exist_ok=True)
        (self.output_dir / "images").mkdir(exist_ok=True)
        (self.output_dir / "reports").mkdir(exist_ok=True)
        
        # Initialize components
        self.scrapers = {
            'diabetesfoodhub': DiabetesFoodHubScraper(),
            'eatingwell': EatingWellScraper(),
            'healthline': HealthlineScraper(),
            'allrecipes': AllRecipesScraper()
        }
        
        self.image_processor = ImageProcessor(
            str(self.output_dir / "images")
        ) if enable_images else None
        
        self.quality_validator = RecipeQualityValidator()
        self.recipe_enricher = RecipeEnricher()
        self.diversity_tracker = DiversityTracker(
            str(self.output_dir / "reports" / "diversity_report.json")
        )
        self.duplicate_detector = DuplicateDetector()
        self.ethical_scraper = EthicalScraper()
        
        # Initialize Firebase if available
        self.db = None
        if FIREBASE_AVAILABLE and firebase_creds and os.path.exists(firebase_creds):
            try:
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Connected to Firebase")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}")
                
        # Load existing recipes for duplicate detection
        self._load_existing_recipes()
        
        # Statistics
        self.stats = {
            'total_scraped': 0,
            'passed_validation': 0,
            'failed_validation': 0,
            'duplicates_found': 0,
            'saved_to_firebase': 0,
            'errors': 0
        }
        
    def _load_existing_recipes(self):
        """Load existing recipes from JSON files."""
        existing_recipes = []
        recipes_dir = self.output_dir / "recipes"
        
        for json_file in recipes_dir.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        existing_recipes.extend(data)
                    else:
                        existing_recipes.append(data)
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")
                
        if existing_recipes:
            self.duplicate_detector = DuplicateDetector(existing_recipes)
            logger.info(f"Loaded {len(existing_recipes)} existing recipes")
            
    def process_recipe(self, recipe: Dict, source: str) -> Optional[Dict]:
        """
        Process a single recipe through the entire pipeline.
        
        Args:
            recipe: Raw recipe data
            source: Source scraper name
            
        Returns:
            Processed recipe or None if rejected
        """
        try:
            # 1. Quality validation
            is_valid, errors, warnings = self.quality_validator.validate_recipe(recipe)
            
            if not is_valid:
                logger.warning(f"Recipe '{recipe.get('title')}' failed validation: {errors}")
                self.stats['failed_validation'] += 1
                return None
                
            if warnings:
                logger.info(f"Recipe '{recipe.get('title')}' has warnings: {warnings}")
                
            # 2. Duplicate detection
            duplicates = self.duplicate_detector.find_duplicates(recipe)
            if duplicates:
                logger.warning(f"Recipe '{recipe.get('title')}' appears to be a duplicate")
                self.stats['duplicates_found'] += 1
                # Still process but mark as potential duplicate
                recipe['potentialDuplicate'] = True
                recipe['duplicateOf'] = duplicates[0]['recipe']['title']
                
            # 3. Recipe enrichment
            enriched_recipe = self.recipe_enricher.enrich_recipe(recipe)
            
            # 4. Diversity tracking
            should_add, reasons = self.diversity_tracker.add_recipe(enriched_recipe)
            if not should_add:
                logger.info(f"Recipe '{recipe.get('title')}' not needed: {reasons}")
                # Still save but mark as surplus
                enriched_recipe['surplus'] = True
                enriched_recipe['surplusReasons'] = reasons
                
            # 5. Image processing
            if self.image_processor and enriched_recipe.get('imageUrl'):
                image_result = self.image_processor.process_recipe_image(
                    enriched_recipe['imageUrl'],
                    enriched_recipe.get('id', enriched_recipe['title'].replace(' ', '_'))
                )
                if image_result:
                    enriched_recipe['processedImages'] = image_result
                    enriched_recipe['imageUrl'] = image_result['optimized_url']
                    enriched_recipe['thumbnailUrl'] = image_result['thumbnail_url']
                    
            # 6. Add metadata
            enriched_recipe['processedAt'] = datetime.now().isoformat()
            enriched_recipe['scraper'] = source
            enriched_recipe['validationStatus'] = {
                'valid': is_valid,
                'warnings': warnings
            }
            
            self.stats['passed_validation'] += 1
            
            # Add to duplicate detector for future checks
            self.duplicate_detector.add_recipe(enriched_recipe)
            
            return enriched_recipe
            
        except Exception as e:
            logger.error(f"Error processing recipe '{recipe.get('title', 'Unknown')}': {e}")
            self.stats['errors'] += 1
            return None
            
    def save_recipe(self, recipe: Dict) -> bool:
        """
        Save recipe to Firebase and/or JSON.
        
        Args:
            recipe: Processed recipe data
            
        Returns:
            Success status
        """
        try:
            # Save to Firebase if available
            if self.db and not recipe.get('surplus', False):
                # Convert to Firestore format
                firestore_recipe = {
                    'title': recipe['title'],
                    'description': recipe.get('description', ''),
                    'ingredients': recipe['ingredients'],
                    'instructions': recipe['instructions'],
                    'prepTime': recipe['prepTime'],
                    'cookTime': recipe['cookTime'],
                    'servings': recipe['servings'],
                    'nutrition': recipe['nutrition'],
                    'tags': recipe['tags'],
                    'imageUrl': recipe.get('imageUrl'),
                    'thumbnailUrl': recipe.get('thumbnailUrl'),
                    'userId': 'scraper',
                    'isPublic': True,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                    'sourceUrl': recipe.get('sourceUrl'),
                    'sourceSite': recipe.get('sourceSite'),
                    'isGDFriendly': recipe.get('isGDFriendly', True),
                    'cuisine': recipe.get('cuisine'),
                    'seasonalTags': recipe.get('seasonalTags', []),
                    'estimatedGlycemicIndex': recipe.get('estimatedGlycemicIndex'),
                    'trimesterSuitability': recipe.get('trimesterSuitability', []),
                    'batchFriendly': recipe.get('batchFriendly', False),
                    'freezerFriendly': recipe.get('freezerFriendly', False)
                }
                
                doc_ref = self.db.collection('recipes').add(firestore_recipe)
                recipe['firebaseId'] = doc_ref[1].id
                self.stats['saved_to_firebase'] += 1
                logger.info(f"Saved to Firebase: {recipe['title']} ({doc_ref[1].id})")
                
            # Always save to JSON
            filename = f"{recipe.get('cuisine', 'other')}_{recipe.get('title', 'recipe').replace(' ', '_')[:50]}.json"
            filepath = self.output_dir / "recipes" / filename
            
            with open(filepath, 'w') as f:
                json.dump(recipe, f, indent=2)
                
            return True
            
        except Exception as e:
            logger.error(f"Error saving recipe '{recipe.get('title', 'Unknown')}': {e}")
            return False
            
    def scrape_source(self, source_name: str, max_recipes: int = 50) -> List[Dict]:
        """
        Scrape recipes from a specific source.
        
        Args:
            source_name: Name of the source scraper
            max_recipes: Maximum recipes to scrape
            
        Returns:
            List of processed recipes
        """
        if source_name not in self.scrapers:
            logger.error(f"Unknown source: {source_name}")
            return []
            
        scraper = self.scrapers[source_name]
        processed_recipes = []
        
        # Get URLs based on diversity needs
        priorities = self.diversity_tracker.get_next_priorities(limit=5)
        urls_to_scrape = []
        
        if source_name == 'diabetesfoodhub':
            category_urls = scraper.get_category_urls()
            # Prioritize based on needs
            for priority in priorities:
                if 'breakfast' in priority['search_terms'][0]:
                    urls_to_scrape.extend(category_urls['breakfast'][:2])
                elif 'lunch' in priority['search_terms'][0]:
                    urls_to_scrape.extend(category_urls['lunch'][:2])
                elif 'dinner' in priority['search_terms'][0]:
                    urls_to_scrape.extend(category_urls['dinner'][:2])
                elif 'snack' in priority['search_terms'][0]:
                    urls_to_scrape.extend(category_urls['snacks'][:2])
                    
        elif source_name == 'eatingwell':
            urls_to_scrape = scraper.get_diabetic_recipe_urls()[:5]
            
        elif source_name == 'healthline':
            urls_to_scrape = scraper.get_gestational_diabetes_urls()[:5]
            
        elif source_name == 'allrecipes':
            urls_to_scrape = scraper.get_diabetic_search_urls()[:5]
            
        # Scrape recipes from URLs
        for list_url in urls_to_scrape:
            logger.info(f"Scraping from {list_url}")
            
            # Use ethical scraper for the list page
            can_scrape, reason = self.ethical_scraper.can_scrape(list_url)
            if not can_scrape:
                logger.warning(f"Skipping {list_url}: {reason}")
                continue
                
            # Get recipe list
            recipes = scraper.scrape_recipe_list(list_url, max_recipes=min(max_recipes, 20))
            
            for recipe in recipes:
                if len(processed_recipes) >= max_recipes:
                    break
                    
                # Process recipe
                processed = self.process_recipe(recipe, source_name)
                if processed:
                    # Save recipe
                    if self.save_recipe(processed):
                        processed_recipes.append(processed)
                        self.stats['total_scraped'] += 1
                        
            if len(processed_recipes) >= max_recipes:
                break
                
        return processed_recipes
        
    def generate_reports(self):
        """Generate all reports and dashboards."""
        reports_dir = self.output_dir / "reports"
        
        # 1. Diversity report
        self.diversity_tracker.save_report(str(reports_dir / "diversity_report.json"))
        
        # 2. Validation report
        validation_report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': self.quality_validator.get_validation_report(),
            'detailed_stats': self.stats
        }
        with open(reports_dir / "validation_report.json", 'w') as f:
            json.dump(validation_report, f, indent=2)
            
        # 3. Duplicate report
        recipes_dir = self.output_dir / "recipes"
        all_recipes = []
        for json_file in recipes_dir.glob("*.json"):
            with open(json_file, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    all_recipes.append(data)
                    
        if all_recipes:
            dedup_report = self.duplicate_detector.get_deduplication_report(all_recipes)
            with open(reports_dir / "duplicate_report.json", 'w') as f:
                json.dump(dedup_report, f, indent=2)
                
        # 4. Scraping ethics report
        self.ethical_scraper.export_progress_report(
            str(reports_dir / "scraping_progress.json")
        )
        
        # 5. Generate HTML dashboard
        dashboard = ProgressDashboard(str(self.output_dir))
        dashboard.generate_html_dashboard(str(reports_dir / "dashboard.html"))
        
        # 6. Summary report
        summary = {
            'generated_at': datetime.now().isoformat(),
            'total_recipes': self.stats['total_scraped'],
            'validation_pass_rate': (
                self.stats['passed_validation'] / 
                (self.stats['passed_validation'] + self.stats['failed_validation'])
                * 100 if self.stats['passed_validation'] + self.stats['failed_validation'] > 0 else 0
            ),
            'duplicate_rate': (
                self.stats['duplicates_found'] / self.stats['total_scraped'] * 100
                if self.stats['total_scraped'] > 0 else 0
            ),
            'firebase_sync_rate': (
                self.stats['saved_to_firebase'] / self.stats['total_scraped'] * 100
                if self.stats['total_scraped'] > 0 else 0
            ),
            'error_rate': (
                self.stats['errors'] / self.stats['total_scraped'] * 100
                if self.stats['total_scraped'] > 0 else 0
            ),
            'next_priorities': self.diversity_tracker.get_next_priorities(limit=10)
        }
        
        with open(reports_dir / "summary_report.json", 'w') as f:
            json.dump(summary, f, indent=2)
            
        logger.info("Generated all reports")
        
    def run_collection_session(self, 
                              sources: List[str] = None,
                              max_per_source: int = 50,
                              total_target: int = None):
        """
        Run a complete collection session.
        
        Args:
            sources: List of sources to scrape (None for all)
            max_per_source: Maximum recipes per source
            total_target: Total target recipes (None for no limit)
        """
        sources = sources or list(self.scrapers.keys())
        session_start = datetime.now()
        
        logger.info(f"Starting collection session with sources: {sources}")
        logger.info(f"Max per source: {max_per_source}, Total target: {total_target}")
        
        total_collected = 0
        
        for source in sources:
            # Check if we've reached target
            if total_target and total_collected >= total_target:
                break
                
            # Calculate remaining
            remaining = max_per_source
            if total_target:
                remaining = min(remaining, total_target - total_collected)
                
            logger.info(f"\nScraping from {source} (target: {remaining} recipes)")
            
            # Scrape from source
            recipes = self.scrape_source(source, remaining)
            total_collected += len(recipes)
            
            logger.info(f"Collected {len(recipes)} recipes from {source}")
            
            # Generate intermediate reports
            if total_collected % 50 == 0:
                self.generate_reports()
                
        # Final reports
        self.generate_reports()
        
        # Session summary
        session_duration = (datetime.now() - session_start).total_seconds() / 60
        logger.info(f"\nSession complete!")
        logger.info(f"Total collected: {total_collected} recipes")
        logger.info(f"Duration: {session_duration:.1f} minutes")
        logger.info(f"Stats: {self.stats}")
        
        # Print recommendations
        dashboard = ProgressDashboard(str(self.output_dir))
        recommendations = dashboard.get_recommendations()
        if recommendations:
            logger.info("\nRecommendations for next session:")
            for rec in recommendations:
                logger.info(f"  - {rec}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Enhanced Recipe Scraper for Gestational Diabetes'
    )
    parser.add_argument(
        '--sources',
        nargs='+',
        choices=['diabetesfoodhub', 'eatingwell', 'healthline', 'allrecipes'],
        help='Sources to scrape (default: all)'
    )
    parser.add_argument(
        '--max-per-source',
        type=int,
        default=50,
        help='Maximum recipes per source (default: 50)'
    )
    parser.add_argument(
        '--total-target',
        type=int,
        help='Total target recipes'
    )
    parser.add_argument(
        '--output-dir',
        default='scraped_data',
        help='Output directory (default: scraped_data)'
    )
    parser.add_argument(
        '--firebase-creds',
        help='Path to Firebase credentials JSON'
    )
    parser.add_argument(
        '--no-images',
        action='store_true',
        help='Skip image downloading and processing'
    )
    parser.add_argument(
        '--resume',
        action='store_true',
        help='Resume from previous session'
    )
    
    args = parser.parse_args()
    
    # Create scraper
    scraper = EnhancedRecipeScraper(
        output_dir=args.output_dir,
        firebase_creds=args.firebase_creds,
        enable_images=not args.no_images
    )
    
    # Run collection
    scraper.run_collection_session(
        sources=args.sources,
        max_per_source=args.max_per_source,
        total_target=args.total_target
    )


if __name__ == "__main__":
    main()