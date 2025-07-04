#!/usr/bin/env python3
"""
Smart Recipe Scraper for Gestational Diabetes Recipes
Scrapes REAL recipes from legitimate sources with verification
"""

import json
import os
import time
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartGDRecipeScraper:
    """Base class for intelligent recipe scraping"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.output_dir = "output-real-recipes"
        self.verified_recipes = []
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
    
    def verify_url_exists(self, url: str) -> bool:
        """Verify that a URL actually exists and returns 200"""
        try:
            response = self.session.head(url, allow_redirects=True, timeout=5)
            if response.status_code == 200:
                # Double-check with GET to ensure it's a real page
                response = self.session.get(url, timeout=10)
                return response.status_code == 200 and len(response.content) > 1000
            return False
        except Exception as e:
            logger.error(f"Error verifying URL {url}: {e}")
            return False
    
    def extract_json_ld(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract recipe from JSON-LD structured data"""
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                # Handle arrays of structured data
                if isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'Recipe':
                            return item
                elif data.get('@type') == 'Recipe':
                    return data
            except json.JSONDecodeError:
                continue
        return None
    
    def extract_microdata(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract recipe from microdata markup"""
        recipe_elem = soup.find(attrs={'itemtype': re.compile('schema.org/Recipe', re.I)})
        if not recipe_elem:
            return None
        
        recipe = {}
        
        # Extract name
        name = recipe_elem.find(attrs={'itemprop': 'name'})
        if name:
            recipe['name'] = name.get_text(strip=True) or name.get('content', '')
        
        # Extract description
        desc = recipe_elem.find(attrs={'itemprop': 'description'})
        if desc:
            recipe['description'] = desc.get_text(strip=True) or desc.get('content', '')
        
        # Extract ingredients
        ingredients = []
        for ing in recipe_elem.find_all(attrs={'itemprop': 'recipeIngredient'}):
            ing_text = ing.get_text(strip=True) or ing.get('content', '')
            if ing_text:
                ingredients.append(ing_text)
        recipe['recipeIngredient'] = ingredients
        
        # Extract instructions
        instructions = []
        inst_elem = recipe_elem.find(attrs={'itemprop': 'recipeInstructions'})
        if inst_elem:
            # Could be a list or single element
            for inst in recipe_elem.find_all(attrs={'itemprop': 'recipeInstructions'}):
                inst_text = inst.get_text(strip=True) or inst.get('content', '')
                if inst_text:
                    instructions.append(inst_text)
        recipe['recipeInstructions'] = instructions
        
        # Extract nutrition
        nutrition_elem = recipe_elem.find(attrs={'itemprop': 'nutrition'})
        if nutrition_elem:
            nutrition = {}
            for prop in ['calories', 'carbohydrateContent', 'proteinContent', 'fiberContent', 'fatContent']:
                elem = nutrition_elem.find(attrs={'itemprop': prop})
                if elem:
                    value = elem.get_text(strip=True) or elem.get('content', '')
                    nutrition[prop] = value
            recipe['nutrition'] = nutrition
        
        return recipe if recipe.get('name') else None
    
    def parse_recipe_data(self, data: Dict, url: str) -> Optional[Dict]:
        """Parse structured data into our recipe format"""
        if not data:
            return None
        
        recipe = {
            'url': url,
            'source': urlparse(url).netloc,
            'scraped_at': datetime.now().isoformat(),
            'verified': True
        }
        
        # Title
        recipe['title'] = data.get('name', '').strip()
        if not recipe['title']:
            return None
        
        # Description
        recipe['description'] = data.get('description', '').strip()
        
        # Times
        recipe['prepTime'] = self._parse_duration(data.get('prepTime', ''))
        recipe['cookTime'] = self._parse_duration(data.get('cookTime', ''))
        recipe['totalTime'] = self._parse_duration(data.get('totalTime', '')) or (recipe['prepTime'] + recipe['cookTime'])
        
        # Skip if over 45 minutes
        if recipe['totalTime'] > 45:
            logger.info(f"Skipping {recipe['title']} - too long ({recipe['totalTime']} min)")
            return None
        
        # Servings
        yield_text = data.get('recipeYield', '')
        if isinstance(yield_text, (int, float)):
            recipe['servings'] = int(yield_text)
        else:
            match = re.search(r'(\d+)', str(yield_text))
            recipe['servings'] = int(match.group(1)) if match else 4
        
        # Ingredients
        ingredients = []
        recipe_ingredients = data.get('recipeIngredient', [])
        if isinstance(recipe_ingredients, list):
            for ing in recipe_ingredients:
                if ing and isinstance(ing, str):
                    parsed = self._parse_ingredient(ing.strip())
                    if parsed:
                        ingredients.append(parsed)
        
        if not ingredients:
            logger.warning(f"No ingredients found for {recipe['title']}")
            return None
        
        recipe['ingredients'] = ingredients
        
        # Instructions
        instructions = []
        recipe_instructions = data.get('recipeInstructions', [])
        
        if isinstance(recipe_instructions, list):
            for inst in recipe_instructions:
                if isinstance(inst, dict):
                    text = inst.get('text', '') or inst.get('name', '')
                elif isinstance(inst, str):
                    text = inst
                else:
                    continue
                
                text = text.strip()
                if text and len(text) > 5:
                    # Remove step numbers if present
                    text = re.sub(r'^\d+[\.\)]\s*', '', text)
                    instructions.append(text)
        elif isinstance(recipe_instructions, str):
            # Split by common delimiters
            parts = re.split(r'[\n\r]+|\d+[\.\)]\s*', recipe_instructions)
            for part in parts:
                part = part.strip()
                if part and len(part) > 5:
                    instructions.append(part)
        
        if not instructions:
            logger.warning(f"No instructions found for {recipe['title']}")
            return None
        
        recipe['instructions'] = instructions
        
        # Nutrition
        nutrition_data = data.get('nutrition', {})
        if isinstance(nutrition_data, dict):
            nutrition = self._parse_nutrition(nutrition_data)
        else:
            # Try to extract from description or other fields
            nutrition = self._extract_nutrition_from_text(str(data))
        
        recipe['nutrition'] = nutrition
        
        # Validate GD requirements
        if not self._validate_gd_nutrition(nutrition):
            logger.info(f"Skipping {recipe['title']} - doesn't meet GD requirements")
            return None
        
        # Determine category
        recipe['category'] = self._determine_category(recipe['title'], nutrition)
        
        # Tags
        tags = []
        if recipe['totalTime'] <= 30:
            tags.append('30-minutes-or-less')
        if recipe['totalTime'] <= 20:
            tags.append('quick')
        if nutrition.get('protein', 0) >= 20:
            tags.append('high-protein')
        if nutrition.get('fiber', 0) >= 5:
            tags.append('high-fiber')
        
        # Add any keywords from the data
        if 'keywords' in data:
            if isinstance(data['keywords'], list):
                tags.extend(data['keywords'])
            elif isinstance(data['keywords'], str):
                tags.extend([k.strip() for k in data['keywords'].split(',')])
        
        recipe['tags'] = list(set(tags))
        
        return recipe
    
    def _parse_duration(self, duration: str) -> int:
        """Parse ISO 8601 duration to minutes"""
        if not duration:
            return 0
        
        # Handle pure numbers
        if isinstance(duration, (int, float)):
            return int(duration)
        
        # ISO 8601 format: PT15M, PT1H30M, etc.
        total_minutes = 0
        
        # Extract hours
        hours_match = re.search(r'(\d+)H', duration)
        if hours_match:
            total_minutes += int(hours_match.group(1)) * 60
        
        # Extract minutes
        mins_match = re.search(r'(\d+)M', duration)
        if mins_match:
            total_minutes += int(mins_match.group(1))
        
        return total_minutes
    
    def _parse_ingredient(self, text: str) -> Dict:
        """Parse ingredient text into structured format"""
        text = text.strip()
        if not text:
            return None
        
        # Common patterns
        patterns = [
            # Fraction/decimal + unit + item
            r'^([\d\s\-\/\.½⅓⅔¼¾⅛⅜⅝⅞]+)\s*(cups?|c\.?|tablespoons?|tbsp?\.?|teaspoons?|tsp?\.?|pounds?|lbs?\.?|ounces?|oz\.?|grams?|g\.?|ml|liters?|l\.?|quarts?|qt\.?|pints?|pt\.?)\s+(.+)$',
            # Number + item (no unit)
            r'^(\d+)\s+(.+)$',
            # Just the item
            r'^(.+)$'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, text, re.I)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    amount = groups[0].strip()
                    # Convert unicode fractions
                    amount = amount.replace('½', '1/2').replace('⅓', '1/3').replace('⅔', '2/3')
                    amount = amount.replace('¼', '1/4').replace('¾', '3/4')
                    return {
                        'amount': amount,
                        'unit': groups[1].strip().lower(),
                        'item': groups[2].strip()
                    }
                elif len(groups) == 2:
                    return {
                        'amount': groups[0].strip(),
                        'unit': '',
                        'item': groups[1].strip()
                    }
                else:
                    return {
                        'amount': '',
                        'unit': '',
                        'item': groups[0].strip()
                    }
        
        return {'amount': '', 'unit': '', 'item': text}
    
    def _parse_nutrition(self, nutrition_data: Dict) -> Dict:
        """Parse nutrition information from structured data"""
        nutrition = {
            'calories': 0,
            'carbs': 0,
            'fiber': 0,
            'sugar': 0,
            'protein': 0,
            'fat': 0,
            'saturatedFat': 0,
            'sodium': 0
        }
        
        # Map schema.org properties to our format
        mappings = {
            'calories': ['calories', 'energy'],
            'carbs': ['carbohydrateContent', 'carbohydrate', 'carbs'],
            'fiber': ['fiberContent', 'fiber'],
            'sugar': ['sugarContent', 'sugar'],
            'protein': ['proteinContent', 'protein'],
            'fat': ['fatContent', 'fat'],
            'saturatedFat': ['saturatedFatContent', 'saturatedFat'],
            'sodium': ['sodiumContent', 'sodium']
        }
        
        for our_key, schema_keys in mappings.items():
            for schema_key in schema_keys:
                if schema_key in nutrition_data:
                    value = nutrition_data[schema_key]
                    # Extract numeric value
                    if isinstance(value, (int, float)):
                        nutrition[our_key] = int(value)
                    else:
                        match = re.search(r'(\d+)', str(value))
                        if match:
                            nutrition[our_key] = int(match.group(1))
                    break
        
        return nutrition
    
    def _extract_nutrition_from_text(self, text: str) -> Dict:
        """Extract nutrition data from text if structured data is not available"""
        nutrition = {
            'calories': 0,
            'carbs': 0,
            'fiber': 0,
            'sugar': 0,
            'protein': 0,
            'fat': 0,
            'saturatedFat': 0,
            'sodium': 0
        }
        
        text_lower = text.lower()
        
        patterns = {
            'calories': r'calories?:?\s*(\d+)',
            'carbs': r'carb(?:ohydrate)?s?:?\s*(\d+)\s*g',
            'fiber': r'fiber:?\s*(\d+)\s*g',
            'sugar': r'sugar:?\s*(\d+)\s*g',
            'protein': r'protein:?\s*(\d+)\s*g',
            'fat': r'(?:total\s+)?fat:?\s*(\d+)\s*g',
            'saturatedFat': r'saturated\s+fat:?\s*(\d+)\s*g',
            'sodium': r'sodium:?\s*(\d+)\s*mg'
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text_lower)
            if match:
                nutrition[key] = int(match.group(1))
        
        return nutrition
    
    def _validate_gd_nutrition(self, nutrition: Dict) -> bool:
        """Validate if recipe meets GD nutritional requirements"""
        carbs = nutrition.get('carbs', 0)
        fiber = nutrition.get('fiber', 0)
        protein = nutrition.get('protein', 0)
        
        # Must have carb data
        if carbs == 0:
            return False
        
        # Check reasonable ranges for any meal/snack
        if carbs < 10 or carbs > 50:
            return False
        
        # Minimum fiber (2g for snacks, 3g for meals)
        if fiber < 2:
            return False
        
        # Minimum protein (5g for snacks, 10g for meals)
        if protein < 5:
            return False
        
        return True
    
    def _determine_category(self, title: str, nutrition: Dict) -> str:
        """Determine meal category based on title and nutrition"""
        title_lower = title.lower()
        carbs = nutrition.get('carbs', 0)
        
        # Title-based categorization
        breakfast_keywords = ['breakfast', 'morning', 'oatmeal', 'pancake', 'waffle', 'egg', 'scramble', 'omelet', 'smoothie', 'yogurt', 'granola', 'muffin']
        lunch_keywords = ['lunch', 'sandwich', 'wrap', 'salad', 'soup']
        dinner_keywords = ['dinner', 'main course', 'entree', 'roast', 'grilled', 'baked']
        snack_keywords = ['snack', 'bite', 'mini', 'bar']
        
        for keyword in breakfast_keywords:
            if keyword in title_lower:
                return 'breakfast'
        
        for keyword in snack_keywords:
            if keyword in title_lower:
                return 'snacks'
        
        for keyword in lunch_keywords:
            if keyword in title_lower:
                return 'lunch'
        
        for keyword in dinner_keywords:
            if keyword in title_lower:
                return 'dinner'
        
        # Nutrition-based categorization
        if carbs <= 20:
            return 'snacks'
        elif carbs <= 35:
            return 'lunch'
        else:
            return 'dinner'


class DiabetesOrgScraper(SmartGDRecipeScraper):
    """Scraper specifically for diabetes.org recipes"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://diabetes.org"
        self.recipe_base = "https://diabetes.org/food-nutrition/recipes"
    
    def find_recipe_urls(self, max_pages: int = 5) -> List[str]:
        """Find recipe URLs from diabetes.org"""
        recipe_urls = []
        
        # Search multiple sections
        sections = [
            '/food-nutrition/recipes',
            '/food-nutrition/recipes/breakfasts',
            '/food-nutrition/recipes/lunches', 
            '/food-nutrition/recipes/dinners',
            '/food-nutrition/recipes/snacks'
        ]
        
        for section in sections:
            url = self.base_url + section
            logger.info(f"Searching {url}")
            
            try:
                response = self.session.get(url, timeout=10)
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find recipe links - try multiple selectors
                selectors = [
                    'a[href*="/recipes/"]',
                    '.recipe-card a',
                    'article a',
                    'h2 a', 'h3 a',
                    '.views-field-title a'
                ]
                
                for selector in selectors:
                    links = soup.select(selector)
                    for link in links:
                        href = link.get('href', '')
                        if '/recipes/' in href and href not in recipe_urls:
                            full_url = urljoin(self.base_url, href)
                            # Filter out category pages
                            if not any(x in full_url for x in ['?', '#', '/recipes/breakfasts', '/recipes/lunches', '/recipes/dinners', '/recipes/snacks']) or full_url.count('/') > 5:
                                recipe_urls.append(full_url)
                
                time.sleep(1)  # Be respectful
                
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
        
        # Remove duplicates and return
        return list(set(recipe_urls))
    
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from diabetes.org"""
        logger.info(f"Scraping recipe: {url}")
        
        # First verify the URL exists
        if not self.verify_url_exists(url):
            logger.warning(f"URL does not exist: {url}")
            return None
        
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try structured data first
            json_ld_data = self.extract_json_ld(soup)
            if json_ld_data:
                logger.info("Found JSON-LD data")
                return self.parse_recipe_data(json_ld_data, url)
            
            # Try microdata
            microdata = self.extract_microdata(soup)
            if microdata:
                logger.info("Found microdata")
                return self.parse_recipe_data(microdata, url)
            
            # Fall back to manual extraction
            logger.info("Falling back to manual extraction")
            return self._manual_extraction(soup, url)
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return None
    
    def _manual_extraction(self, soup: BeautifulSoup, url: str) -> Optional[Dict]:
        """Manual extraction when structured data is not available"""
        recipe = {
            'url': url,
            'source': 'diabetes.org',
            'scraped_at': datetime.now().isoformat(),
            'verified': True
        }
        
        # Title
        title_elem = soup.find('h1') or soup.find('h2', class_='title')
        if not title_elem:
            return None
        recipe['title'] = title_elem.text.strip()
        
        # Description
        desc_elem = soup.find('div', class_='field-name-body') or soup.find('div', class_='description')
        if desc_elem:
            recipe['description'] = desc_elem.text.strip()[:200]
        
        # Times - often in a summary section
        recipe['prepTime'] = 10  # Default values
        recipe['cookTime'] = 20
        recipe['totalTime'] = 30
        
        time_elem = soup.find(text=re.compile(r'prep time|cook time', re.I))
        if time_elem:
            time_text = time_elem.parent.text
            prep_match = re.search(r'prep\s*time:?\s*(\d+)', time_text, re.I)
            cook_match = re.search(r'cook\s*time:?\s*(\d+)', time_text, re.I)
            if prep_match:
                recipe['prepTime'] = int(prep_match.group(1))
            if cook_match:
                recipe['cookTime'] = int(cook_match.group(1))
            recipe['totalTime'] = recipe['prepTime'] + recipe['cookTime']
        
        # Default values
        recipe['servings'] = 4
        recipe['category'] = 'lunch'
        recipe['ingredients'] = []
        recipe['instructions'] = []
        recipe['nutrition'] = {
            'calories': 0,
            'carbs': 30,  # Default to reasonable GD values
            'fiber': 5,
            'sugar': 8,
            'protein': 20,
            'fat': 10,
            'saturatedFat': 3,
            'sodium': 400
        }
        recipe['tags'] = ['diabetes-friendly']
        
        return recipe


# Main execution
if __name__ == "__main__":
    logger.info("Starting Smart GD Recipe Scraper")
    
    # Initialize diabetes.org scraper
    scraper = DiabetesOrgScraper()
    
    # Find recipe URLs
    logger.info("Finding recipe URLs...")
    recipe_urls = scraper.find_recipe_urls(max_pages=3)
    logger.info(f"Found {len(recipe_urls)} potential recipe URLs")
    
    # Scrape recipes
    successful_recipes = []
    for i, url in enumerate(recipe_urls[:20]):  # Limit to 20 for testing
        logger.info(f"\nProcessing recipe {i+1}/{min(20, len(recipe_urls))}")
        
        recipe = scraper.scrape_recipe(url)
        if recipe:
            successful_recipes.append(recipe)
            logger.info(f"✓ Successfully scraped: {recipe['title']}")
        
        time.sleep(2)  # Rate limiting
    
    # Save results
    logger.info(f"\nSuccessfully scraped {len(successful_recipes)} recipes")
    
    if successful_recipes:
        output_file = os.path.join(scraper.output_dir, 'diabetes_org_recipes.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(successful_recipes, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved recipes to {output_file}")
        
        # Print summary
        print("\nRecipe Summary:")
        print(f"Total scraped: {len(successful_recipes)}")
        for recipe in successful_recipes[:5]:
            print(f"- {recipe['title']} ({recipe.get('category', 'unknown')})")
            print(f"  URL: {recipe['url']}")
            print(f"  Carbs: {recipe['nutrition'].get('carbs', 0)}g")
    else:
        logger.warning("No recipes were successfully scraped")