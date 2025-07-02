#!/usr/bin/env python3
"""
Recipe scraper for gestational diabetes-friendly recipes.
Scrapes from multiple sources and stores in Firestore format.
"""

import json
import time
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, urljoin
import hashlib

import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import firebase_admin
from firebase_admin import credentials, firestore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants for GD guidelines
MIN_CARBS_PER_MEAL = 15
MAX_CARBS_PER_MEAL = 30
REQUEST_TIMEOUT = 10
RATE_LIMIT_DELAY = 2  # seconds between requests

class RecipeScraper:
    """Base class for recipe scrapers."""
    
    def __init__(self, base_url: str, site_name: str):
        self.base_url = base_url
        self.site_name = site_name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def get_soup(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch URL and return BeautifulSoup object."""
        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
            
    def extract_time(self, time_str: str) -> int:
        """Extract time in minutes from string."""
        if not time_str:
            return 0
            
        # Look for patterns like "30 min", "1 hour", "1h 30m"
        total_minutes = 0
        
        # Extract hours
        hour_match = re.search(r'(\d+)\s*(?:hours?|hrs?|h)', time_str, re.I)
        if hour_match:
            total_minutes += int(hour_match.group(1)) * 60
            
        # Extract minutes
        min_match = re.search(r'(\d+)\s*(?:minutes?|mins?|m)', time_str, re.I)
        if min_match:
            total_minutes += int(min_match.group(1))
            
        # If no specific pattern found, try to extract any number
        if total_minutes == 0:
            num_match = re.search(r'(\d+)', time_str)
            if num_match:
                total_minutes = int(num_match.group(1))
                
        return total_minutes
        
    def extract_number(self, text: str) -> float:
        """Extract number from string."""
        if not text:
            return 0.0
            
        # Remove commas and extract first number
        text = text.replace(',', '')
        match = re.search(r'(\d+\.?\d*)', text)
        if match:
            return float(match.group(1))
        return 0.0
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        # Remove extra whitespace and newlines
        text = ' '.join(text.split())
        return text.strip()
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe. Must be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement scrape_recipe")
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from a category page."""
        raise NotImplementedError("Subclasses must implement scrape_recipe_list")


class DiabetesFoodHubScraper(RecipeScraper):
    """Scraper for diabetesfoodhub.org"""
    
    def __init__(self):
        super().__init__("https://diabetesfoodhub.org", "Diabetes Food Hub")
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from Diabetes Food Hub."""
        soup = self.get_soup(url)
        if not soup:
            return None
            
        try:
            # Extract title
            title = soup.find('h1', class_='recipe-title')
            if not title:
                title = soup.find('h1')
            title = self.clean_text(title.text) if title else "Unknown Recipe"
            
            # Extract description
            description = soup.find('div', class_='recipe-description')
            if not description:
                description = soup.find('div', class_='field-name-body')
            description = self.clean_text(description.text) if description else ""
            
            # Extract ingredients
            ingredients = []
            ingredient_section = soup.find('div', class_='ingredients')
            if not ingredient_section:
                ingredient_section = soup.find('div', class_='field-name-field-ingredients')
                
            if ingredient_section:
                for item in ingredient_section.find_all('li'):
                    text = self.clean_text(item.text)
                    if text:
                        ingredients.append(self.parse_ingredient(text))
                        
            # Extract instructions
            instructions = []
            instruction_section = soup.find('div', class_='instructions')
            if not instruction_section:
                instruction_section = soup.find('div', class_='field-name-field-instructions')
                
            if instruction_section:
                for item in instruction_section.find_all(['li', 'p']):
                    text = self.clean_text(item.text)
                    if text:
                        instructions.append(text)
                        
            # Extract times
            prep_time = 0
            cook_time = 0
            time_section = soup.find('div', class_='recipe-time')
            if time_section:
                prep_elem = time_section.find(text=re.compile('prep', re.I))
                if prep_elem:
                    prep_time = self.extract_time(prep_elem.parent.text)
                cook_elem = time_section.find(text=re.compile('cook', re.I))
                if cook_elem:
                    cook_time = self.extract_time(cook_elem.parent.text)
                    
            # Extract servings
            servings = 4  # default
            servings_elem = soup.find(text=re.compile('servings?', re.I))
            if servings_elem:
                servings = int(self.extract_number(servings_elem.parent.text)) or 4
                
            # Extract nutrition info
            nutrition = self.extract_nutrition(soup)
            
            # Extract image
            image_url = None
            image_elem = soup.find('img', class_='recipe-image')
            if not image_elem:
                image_elem = soup.find('div', class_='field-name-field-image')
                if image_elem:
                    image_elem = image_elem.find('img')
            if image_elem and image_elem.get('src'):
                image_url = urljoin(url, image_elem['src'])
                
            # Calculate estimated glycemic index
            estimated_gi = self.estimate_glycemic_index(ingredients, nutrition)
            
            # Validate carb content
            carbs_per_serving = nutrition.get('carbs', 0)
            is_gd_friendly = MIN_CARBS_PER_MEAL <= carbs_per_serving <= MAX_CARBS_PER_MEAL
            
            recipe = {
                'title': title,
                'description': description,
                'ingredients': ingredients,
                'instructions': instructions,
                'prepTime': prep_time,
                'cookTime': cook_time,
                'servings': servings,
                'nutrition': nutrition,
                'tags': self.generate_tags(title, ingredients, nutrition, is_gd_friendly),
                'imageUrl': image_url,
                'sourceUrl': url,
                'sourceSite': self.site_name,
                'estimatedGlycemicIndex': estimated_gi,
                'isGDFriendly': is_gd_friendly,
                'scrapedAt': datetime.now().isoformat()
            }
            
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def extract_nutrition(self, soup: BeautifulSoup) -> Dict[str, float]:
        """Extract nutrition information from the page."""
        nutrition = {
            'calories': 0,
            'carbs': 0,
            'protein': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'sodium': 0,
            'cholesterol': 0,
            'saturatedFat': 0,
            'transFat': 0
        }
        
        # Look for nutrition section
        nutrition_section = soup.find('div', class_='nutrition-info')
        if not nutrition_section:
            nutrition_section = soup.find('div', class_='field-name-field-nutrition')
            
        if nutrition_section:
            for key in nutrition.keys():
                # Try to find nutrition value by label
                label_pattern = re.compile(key.replace('F', ' f').replace('S', ' s'), re.I)
                elem = nutrition_section.find(text=label_pattern)
                if elem:
                    value = self.extract_number(elem.parent.text)
                    nutrition[key] = value
                    
        return nutrition
        
    def parse_ingredient(self, text: str) -> Dict[str, any]:
        """Parse ingredient text into structured format."""
        # Basic parsing - can be enhanced with more sophisticated NLP
        parts = text.split()
        
        # Try to extract amount and unit
        amount = 0
        unit = ""
        name = text
        
        # Common units
        units = ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 
                'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 
                'gram', 'grams', 'ml', 'l', 'liter', 'liters']
        
        if len(parts) >= 2:
            # Check if first part is a number
            try:
                # Handle fractions
                if '/' in parts[0]:
                    numerator, denominator = parts[0].split('/')
                    amount = float(numerator) / float(denominator)
                else:
                    amount = float(parts[0])
                    
                # Check if second part is a unit
                if parts[1].lower() in units:
                    unit = parts[1]
                    name = ' '.join(parts[2:])
                else:
                    name = ' '.join(parts[1:])
            except ValueError:
                pass
                
        return {
            'name': name,
            'amount': amount,
            'unit': unit
        }
        
    def estimate_glycemic_index(self, ingredients: List[Dict], nutrition: Dict[str, float]) -> str:
        """Estimate glycemic index based on ingredients and nutrition."""
        # Simple estimation based on fiber to carb ratio and ingredients
        carbs = nutrition.get('carbs', 0)
        fiber = nutrition.get('fiber', 0)
        
        if carbs == 0:
            return 'low'
            
        fiber_ratio = fiber / carbs if carbs > 0 else 0
        
        # Check for high GI ingredients
        high_gi_keywords = ['white rice', 'white bread', 'potato', 'sugar', 'honey']
        low_gi_keywords = ['whole grain', 'beans', 'lentils', 'quinoa', 'vegetables']
        
        ingredient_text = ' '.join([ing['name'].lower() for ing in ingredients])
        
        high_gi_count = sum(1 for keyword in high_gi_keywords if keyword in ingredient_text)
        low_gi_count = sum(1 for keyword in low_gi_keywords if keyword in ingredient_text)
        
        # Simple scoring
        if fiber_ratio > 0.3 or low_gi_count > high_gi_count:
            return 'low'
        elif fiber_ratio > 0.15 or low_gi_count == high_gi_count:
            return 'medium'
        else:
            return 'high'
            
    def generate_tags(self, title: str, ingredients: List[Dict], nutrition: Dict[str, float], is_gd_friendly: bool) -> List[str]:
        """Generate tags for the recipe."""
        tags = []
        
        # Add GD friendly tag
        if is_gd_friendly:
            tags.append('gd-friendly')
            
        # Add meal type tags based on title
        title_lower = title.lower()
        if any(word in title_lower for word in ['breakfast', 'morning', 'pancake', 'waffle', 'oatmeal']):
            tags.append('breakfast')
        elif any(word in title_lower for word in ['lunch', 'sandwich', 'salad', 'soup']):
            tags.append('lunch')
        elif any(word in title_lower for word in ['dinner', 'main', 'entree']):
            tags.append('dinner')
        elif any(word in title_lower for word in ['snack', 'appetizer']):
            tags.append('snack')
            
        # Add dietary tags
        ingredient_text = ' '.join([ing['name'].lower() for ing in ingredients])
        if not any(meat in ingredient_text for meat in ['chicken', 'beef', 'pork', 'fish', 'meat']):
            tags.append('vegetarian')
        if not any(animal in ingredient_text for animal in ['chicken', 'beef', 'pork', 'fish', 'meat', 'egg', 'milk', 'cheese', 'butter']):
            tags.append('vegan')
            
        # Add nutrition-based tags
        if nutrition.get('carbs', 0) < 20:
            tags.append('low-carb')
        if nutrition.get('calories', 0) < 300:
            tags.append('low-calorie')
        if nutrition.get('protein', 0) > 20:
            tags.append('high-protein')
            
        return tags
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from a category page."""
        recipes = []
        soup = self.get_soup(list_url)
        
        if not soup:
            return recipes
            
        # Find recipe links
        recipe_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/recipes/' in href and href not in recipe_links:
                full_url = urljoin(self.base_url, href)
                recipe_links.append(full_url)
                
        # Scrape individual recipes
        for i, recipe_url in enumerate(recipe_links[:max_recipes]):
            logger.info(f"Scraping recipe {i+1}/{min(len(recipe_links), max_recipes)}: {recipe_url}")
            
            recipe = self.scrape_recipe(recipe_url)
            if recipe:
                recipes.append(recipe)
                
            # Rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
        return recipes


class GestationalDiabetesUKScraper(RecipeScraper):
    """Scraper for gestationaldiabetes.co.uk"""
    
    def __init__(self):
        super().__init__("https://www.gestationaldiabetes.co.uk", "Gestational Diabetes UK")
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from Gestational Diabetes UK."""
        soup = self.get_soup(url)
        if not soup:
            return None
            
        try:
            # Extract title
            title = soup.find('h1', class_='entry-title')
            if not title:
                title = soup.find('h1')
            title = self.clean_text(title.text) if title else "Unknown Recipe"
            
            # Extract content
            content = soup.find('div', class_='entry-content')
            if not content:
                return None
                
            # Extract description (usually first paragraph)
            description = ""
            first_p = content.find('p')
            if first_p:
                description = self.clean_text(first_p.text)
                
            # Extract ingredients and instructions
            ingredients = []
            instructions = []
            
            # Look for lists and headers
            current_section = None
            for elem in content.find_all(['h2', 'h3', 'h4', 'ul', 'ol', 'p']):
                if elem.name in ['h2', 'h3', 'h4']:
                    header_text = elem.text.lower()
                    if 'ingredient' in header_text:
                        current_section = 'ingredients'
                    elif any(word in header_text for word in ['instruction', 'method', 'direction']):
                        current_section = 'instructions'
                elif elem.name in ['ul', 'ol'] and current_section == 'ingredients':
                    for li in elem.find_all('li'):
                        text = self.clean_text(li.text)
                        if text:
                            ingredients.append(self.parse_ingredient(text))
                elif elem.name in ['ul', 'ol', 'p'] and current_section == 'instructions':
                    if elem.name == 'p':
                        text = self.clean_text(elem.text)
                        if text and len(text) > 20:  # Avoid short snippets
                            instructions.append(text)
                    else:
                        for li in elem.find_all('li'):
                            text = self.clean_text(li.text)
                            if text:
                                instructions.append(text)
                                
            # Extract nutrition if available
            nutrition = self.extract_nutrition_from_text(content.text)
            
            # Default values
            prep_time = 15
            cook_time = 30
            servings = 4
            
            # Extract image
            image_url = None
            image_elem = content.find('img')
            if image_elem and image_elem.get('src'):
                image_url = urljoin(url, image_elem['src'])
                
            # Calculate estimated glycemic index
            estimated_gi = self.estimate_glycemic_index(ingredients, nutrition)
            
            # Validate carb content
            carbs_per_serving = nutrition.get('carbs', 0)
            is_gd_friendly = MIN_CARBS_PER_MEAL <= carbs_per_serving <= MAX_CARBS_PER_MEAL
            
            recipe = {
                'title': title,
                'description': description,
                'ingredients': ingredients,
                'instructions': instructions,
                'prepTime': prep_time,
                'cookTime': cook_time,
                'servings': servings,
                'nutrition': nutrition,
                'tags': self.generate_tags(title, ingredients, nutrition, is_gd_friendly),
                'imageUrl': image_url,
                'sourceUrl': url,
                'sourceSite': self.site_name,
                'estimatedGlycemicIndex': estimated_gi,
                'isGDFriendly': is_gd_friendly,
                'scrapedAt': datetime.now().isoformat()
            }
            
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def extract_nutrition_from_text(self, text: str) -> Dict[str, float]:
        """Extract nutrition information from text content."""
        nutrition = {
            'calories': 0,
            'carbs': 0,
            'protein': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'sodium': 0,
            'cholesterol': 0,
            'saturatedFat': 0,
            'transFat': 0
        }
        
        # Look for nutrition patterns in text
        text_lower = text.lower()
        
        # Common patterns
        patterns = {
            'calories': r'(\d+)\s*(?:cal|calories|kcal)',
            'carbs': r'(\d+\.?\d*)\s*g?\s*(?:carb|carbohydrate)',
            'protein': r'(\d+\.?\d*)\s*g?\s*protein',
            'fat': r'(\d+\.?\d*)\s*g?\s*(?:total\s*)?fat',
            'fiber': r'(\d+\.?\d*)\s*g?\s*fib[er]',
            'sugar': r'(\d+\.?\d*)\s*g?\s*sugar',
            'sodium': r'(\d+)\s*mg?\s*sodium'
        }
        
        for nutrient, pattern in patterns.items():
            match = re.search(pattern, text_lower)
            if match:
                nutrition[nutrient] = float(match.group(1))
                
        return nutrition


class ImageOptimizer:
    """Handle image downloading and optimization."""
    
    @staticmethod
    def download_and_optimize(image_url: str, max_width: int = 800, quality: int = 85) -> Optional[bytes]:
        """Download and optimize image for web use."""
        try:
            response = requests.get(image_url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            # Open image
            img = Image.open(BytesIO(response.content))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
                
            # Resize if too large
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
            # Save optimized image
            output = BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error optimizing image from {image_url}: {e}")
            return None


class RecipeValidator:
    """Validate recipes meet GD guidelines."""
    
    @staticmethod
    def validate_recipe(recipe: Dict) -> Tuple[bool, List[str]]:
        """Validate recipe meets GD guidelines and return issues."""
        issues = []
        
        # Check required fields
        required_fields = ['title', 'ingredients', 'instructions', 'nutrition']
        for field in required_fields:
            if not recipe.get(field):
                issues.append(f"Missing required field: {field}")
                
        # Check carbohydrate content
        nutrition = recipe.get('nutrition', {})
        carbs = nutrition.get('carbs', 0)
        
        if carbs < MIN_CARBS_PER_MEAL:
            issues.append(f"Carbs too low: {carbs}g (minimum {MIN_CARBS_PER_MEAL}g)")
        elif carbs > MAX_CARBS_PER_MEAL:
            issues.append(f"Carbs too high: {carbs}g (maximum {MAX_CARBS_PER_MEAL}g)")
            
        # Check if recipe has ingredients
        if not recipe.get('ingredients'):
            issues.append("No ingredients found")
            
        # Check if recipe has instructions
        if not recipe.get('instructions'):
            issues.append("No instructions found")
            
        # Check nutrition completeness
        if nutrition.get('calories', 0) == 0:
            issues.append("Missing calorie information")
            
        return len(issues) == 0, issues


class RecipeStorage:
    """Handle recipe storage in Firestore."""
    
    def __init__(self, credentials_path: Optional[str] = None):
        """Initialize Firebase connection."""
        self.db = None
        if credentials_path:
            try:
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Connected to Firestore")
            except Exception as e:
                logger.error(f"Failed to connect to Firestore: {e}")
                
    def save_recipe(self, recipe: Dict, user_id: str = "scraper") -> Optional[str]:
        """Save recipe to Firestore."""
        if not self.db:
            logger.warning("Firestore not connected, skipping save")
            return None
            
        try:
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
                'userId': user_id,
                'isPublic': True,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'sourceUrl': recipe.get('sourceUrl'),
                'sourceSite': recipe.get('sourceSite'),
                'isGDFriendly': recipe.get('isGDFriendly', False)
            }
            
            # Add to recipes collection
            doc_ref = self.db.collection('recipes').add(firestore_recipe)
            return doc_ref[1].id
            
        except Exception as e:
            logger.error(f"Error saving recipe to Firestore: {e}")
            return None
            
    def recipe_exists(self, title: str) -> bool:
        """Check if recipe already exists by title."""
        if not self.db:
            return False
            
        try:
            docs = self.db.collection('recipes').where('title', '==', title).limit(1).get()
            return len(list(docs)) > 0
        except Exception as e:
            logger.error(f"Error checking recipe existence: {e}")
            return False


class ManualReviewQueue:
    """Handle manual review queue for recipes."""
    
    def __init__(self, queue_file: str = "review_queue.json"):
        self.queue_file = queue_file
        self.queue = self.load_queue()
        
    def load_queue(self) -> List[Dict]:
        """Load review queue from file."""
        try:
            with open(self.queue_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []
            
    def save_queue(self):
        """Save review queue to file."""
        with open(self.queue_file, 'w') as f:
            json.dump(self.queue, f, indent=2)
            
    def add_to_queue(self, recipe: Dict, issues: List[str]):
        """Add recipe to review queue."""
        review_item = {
            'recipe': recipe,
            'issues': issues,
            'added_at': datetime.now().isoformat(),
            'status': 'pending'
        }
        self.queue.append(review_item)
        self.save_queue()
        
    def get_pending_reviews(self) -> List[Dict]:
        """Get all pending reviews."""
        return [item for item in self.queue if item['status'] == 'pending']
        
    def mark_reviewed(self, index: int, approved: bool):
        """Mark a recipe as reviewed."""
        if 0 <= index < len(self.queue):
            self.queue[index]['status'] = 'approved' if approved else 'rejected'
            self.queue[index]['reviewed_at'] = datetime.now().isoformat()
            self.save_queue()


def main():
    """Main function to run the scraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape GD-friendly recipes')
    parser.add_argument('--source', choices=['diabetesfoodhub', 'gduk', 'all'], 
                       default='all', help='Recipe source to scrape')
    parser.add_argument('--max-recipes', type=int, default=10, 
                       help='Maximum recipes to scrape per source')
    parser.add_argument('--firebase-creds', help='Path to Firebase credentials JSON')
    parser.add_argument('--save-json', default='scraped_recipes.json',
                       help='Save recipes to JSON file')
    parser.add_argument('--review-queue', default='review_queue.json',
                       help='Review queue file')
    parser.add_argument('--dry-run', action='store_true',
                       help='Run without saving to Firestore')
    
    args = parser.parse_args()
    
    # Initialize components
    storage = RecipeStorage(args.firebase_creds) if not args.dry_run else None
    review_queue = ManualReviewQueue(args.review_queue)
    validator = RecipeValidator()
    
    # Initialize scrapers
    scrapers = []
    if args.source in ['diabetesfoodhub', 'all']:
        scrapers.append(DiabetesFoodHubScraper())
    if args.source in ['gduk', 'all']:
        scrapers.append(GestationalDiabetesUKScraper())
        
    all_recipes = []
    
    # Run scrapers
    for scraper in scrapers:
        logger.info(f"Starting scraper for {scraper.site_name}")
        
        # Define category URLs to scrape
        if isinstance(scraper, DiabetesFoodHubScraper):
            category_urls = [
                f"{scraper.base_url}/recipes/breakfast",
                f"{scraper.base_url}/recipes/lunch",
                f"{scraper.base_url}/recipes/dinner",
                f"{scraper.base_url}/recipes/snacks"
            ]
        else:
            # For GDUK, we'll need to find recipe pages manually
            category_urls = [f"{scraper.base_url}/recipes/"]
            
        for category_url in category_urls:
            logger.info(f"Scraping category: {category_url}")
            recipes = scraper.scrape_recipe_list(category_url, args.max_recipes)
            
            for recipe in recipes:
                # Validate recipe
                is_valid, issues = validator.validate_recipe(recipe)
                
                if not is_valid:
                    logger.warning(f"Recipe '{recipe['title']}' has issues: {issues}")
                    review_queue.add_to_queue(recipe, issues)
                    continue
                    
                # Check if recipe already exists
                if storage and storage.recipe_exists(recipe['title']):
                    logger.info(f"Recipe '{recipe['title']}' already exists, skipping")
                    continue
                    
                # Save to Firestore
                if storage:
                    recipe_id = storage.save_recipe(recipe)
                    if recipe_id:
                        logger.info(f"Saved recipe '{recipe['title']}' with ID: {recipe_id}")
                        recipe['id'] = recipe_id
                        
                all_recipes.append(recipe)
                
    # Save all recipes to JSON
    with open(args.save_json, 'w') as f:
        json.dump(all_recipes, f, indent=2)
    logger.info(f"Saved {len(all_recipes)} recipes to {args.save_json}")
    
    # Print summary
    print(f"\nScraping complete!")
    print(f"Total recipes scraped: {len(all_recipes)}")
    print(f"Recipes in review queue: {len(review_queue.get_pending_reviews())}")
    print(f"Recipes saved to: {args.save_json}")
    
    if review_queue.get_pending_reviews():
        print(f"\nRecipes requiring review:")
        for i, item in enumerate(review_queue.get_pending_reviews()):
            print(f"{i+1}. {item['recipe']['title']} - Issues: {', '.join(item['issues'])}")


if __name__ == "__main__":
    main()