#!/usr/bin/env python3
"""
Real Recipe Scraper for Diabetes Food Hub
This scraper fetches ACTUAL recipes from diabetesfoodhub.org
and verifies they exist before saving them.
"""

import json
import os
import time
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, quote
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RealRecipeScraper:
    def __init__(self):
        self.base_url = "https://diabetesfoodhub.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.output_dir = "output-real"
        self.images_dir = os.path.join(self.output_dir, "images")
        self.verified_recipes = []
        
        # Create output directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
    
    def search_recipes(self, query: str, filters: Dict = None) -> List[str]:
        """Search for recipes on diabetesfoodhub.org"""
        search_urls = []
        
        # Try different search patterns
        search_patterns = [
            f"/recipes?search={quote(query)}",
            f"/recipes?keywords={quote(query)}",
            f"/recipes?q={quote(query)}",
        ]
        
        if filters:
            if 'meal_type' in filters:
                search_patterns.append(f"/recipes?meal_type={filters['meal_type']}")
            if 'max_time' in filters:
                search_patterns.append(f"/recipes?max_cook_time={filters['max_time']}")
        
        for pattern in search_patterns:
            url = self.base_url + pattern
            logger.info(f"Searching: {url}")
            
            try:
                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find recipe links - try multiple selectors
                    recipe_links = []
                    
                    # Common patterns for recipe links
                    selectors = [
                        'a[href*="/recipes/"]',
                        '.recipe-card a',
                        '.recipe-item a',
                        'article a[href*="recipe"]',
                        '.recipe-link',
                        'h2 a', 'h3 a', 'h4 a'
                    ]
                    
                    for selector in selectors:
                        links = soup.select(selector)
                        for link in links:
                            href = link.get('href', '')
                            if '/recipes/' in href and href not in search_urls:
                                full_url = urljoin(self.base_url, href)
                                # Skip search/filter pages
                                if not any(x in full_url for x in ['?', 'search', 'filter', 'page=']):
                                    search_urls.append(full_url)
                    
                    if search_urls:
                        logger.info(f"Found {len(search_urls)} recipes for query: {query}")
                        break
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error searching recipes: {e}")
        
        return list(set(search_urls))  # Remove duplicates
    
    def verify_url(self, url: str) -> bool:
        """Verify that a URL actually exists"""
        try:
            response = self.session.head(url, allow_redirects=True, timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def parse_recipe_page(self, url: str) -> Optional[Dict]:
        """Parse a real recipe page and extract accurate data"""
        try:
            logger.info(f"Parsing recipe: {url}")
            
            # First verify the URL exists
            if not self.verify_url(url):
                logger.warning(f"URL does not exist: {url}")
                return None
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            recipe = {
                'url': url,
                'source': 'diabetesfoodhub.org',
                'scraped_at': datetime.now().isoformat(),
                'verified': True
            }
            
            # Extract title - try multiple selectors
            title = None
            title_selectors = ['h1', '.recipe-title', '.recipe-name', '[itemprop="name"]']
            for selector in title_selectors:
                elem = soup.select_one(selector)
                if elem and elem.text.strip():
                    title = elem.text.strip()
                    break
            
            if not title:
                logger.warning(f"No title found for {url}")
                return None
            
            recipe['title'] = title
            
            # Extract description
            desc_selectors = ['.recipe-description', '.recipe-intro', '[itemprop="description"]', '.summary']
            for selector in desc_selectors:
                elem = soup.select_one(selector)
                if elem:
                    recipe['description'] = elem.text.strip()
                    break
            
            # Extract prep and cook times
            recipe['prepTime'] = self._extract_time(soup, ['prep', 'preparation'])
            recipe['cookTime'] = self._extract_time(soup, ['cook', 'cooking'])
            recipe['totalTime'] = recipe['prepTime'] + recipe['cookTime']
            
            # Skip if over 45 minutes
            if recipe['totalTime'] > 45:
                logger.info(f"Skipping {title} - too long ({recipe['totalTime']} min)")
                return None
            
            # Extract servings
            servings = 4  # default
            servings_selectors = ['[itemprop="recipeYield"]', '.servings', '.recipe-yield']
            for selector in servings_selectors:
                elem = soup.select_one(selector)
                if elem:
                    match = re.search(r'(\d+)', elem.text)
                    if match:
                        servings = int(match.group(1))
                        break
            recipe['servings'] = servings
            
            # Extract ingredients - this is critical for accuracy
            ingredients = []
            ing_selectors = [
                '[itemprop="recipeIngredient"]',
                '.recipe-ingredient',
                '.ingredient',
                '.ingredients li',
                '.ingredient-list li'
            ]
            
            for selector in ing_selectors:
                elems = soup.select(selector)
                if elems:
                    for elem in elems:
                        text = elem.text.strip()
                        if text and len(text) > 2:
                            parsed = self._parse_ingredient_accurately(text)
                            if parsed:
                                ingredients.append(parsed)
                    break
            
            if not ingredients:
                logger.warning(f"No ingredients found for {url}")
                return None
            
            recipe['ingredients'] = ingredients
            
            # Extract instructions - get exact text
            instructions = []
            inst_selectors = [
                '[itemprop="recipeInstructions"]',
                '.recipe-instruction',
                '.instruction',
                '.directions li',
                '.instructions ol li',
                '.method li'
            ]
            
            for selector in inst_selectors:
                elems = soup.select(selector)
                if elems:
                    for elem in elems:
                        text = elem.text.strip()
                        if text and len(text) > 10:
                            instructions.append(text)
                    break
            
            if not instructions:
                logger.warning(f"No instructions found for {url}")
                return None
            
            recipe['instructions'] = instructions
            
            # Extract nutrition - must be accurate
            nutrition = self._extract_accurate_nutrition(soup)
            if not self._validate_gd_nutrition(nutrition):
                logger.info(f"Skipping {title} - nutrition doesn't meet GD requirements")
                return None
            
            recipe['nutrition'] = nutrition
            
            # Determine category based on carb content and recipe type
            recipe['category'] = self._determine_category(nutrition, title.lower())
            
            # Extract image
            img_selectors = [
                '[itemprop="image"]',
                '.recipe-image img',
                '.recipe-photo img',
                'img[alt*="' + title[:20] + '"]'
            ]
            
            for selector in img_selectors:
                elem = soup.select_one(selector)
                if elem and elem.get('src'):
                    img_url = urljoin(url, elem['src'])
                    local_path = self._download_image(img_url, title)
                    if local_path:
                        recipe['image'] = local_path
                        recipe['originalImage'] = img_url
                    break
            
            # Add tags
            tags = []
            if recipe['totalTime'] <= 30:
                tags.append('30-minutes-or-less')
            if recipe['totalTime'] <= 20:
                tags.append('quick')
            if nutrition.get('protein', 0) >= 20:
                tags.append('high-protein')
            if nutrition.get('fiber', 0) >= 5:
                tags.append('high-fiber')
            
            recipe['tags'] = tags
            
            return recipe
            
        except Exception as e:
            logger.error(f"Error parsing recipe {url}: {e}")
            return None
    
    def _extract_time(self, soup: BeautifulSoup, time_types: List[str]) -> int:
        """Extract cooking times accurately from the page"""
        for time_type in time_types:
            # Try schema.org markup first
            elem = soup.find(attrs={'itemprop': f'{time_type}Time'})
            if elem:
                # Look for ISO 8601 duration
                content = elem.get('content', '') or elem.get('datetime', '')
                if content:
                    match = re.search(r'PT(\d+)M', content)
                    if match:
                        return int(match.group(1))
                
                # Try text content
                text = elem.text
                match = re.search(r'(\d+)\s*min', text, re.I)
                if match:
                    return int(match.group(1))
            
            # Try other patterns
            pattern = re.compile(f'{time_type}.*?(\d+)\s*min', re.I)
            match = pattern.search(str(soup))
            if match:
                return int(match.group(1))
        
        return 0
    
    def _parse_ingredient_accurately(self, text: str) -> Optional[Dict]:
        """Parse ingredient text exactly as written"""
        text = text.strip()
        if not text:
            return None
        
        # Common measurement patterns
        patterns = [
            # Fraction/decimal + unit + item
            r'^([\d\s\-\/\.]+)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|ml|liter|liters?|clove|cloves)\s+(.+)$',
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
                    return {
                        'amount': groups[0].strip(),
                        'unit': groups[1].strip(),
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
    
    def _extract_accurate_nutrition(self, soup: BeautifulSoup) -> Dict:
        """Extract nutrition data exactly as shown on the page"""
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
        
        # Try schema.org nutrition info first
        nutrition_elem = soup.find(attrs={'itemprop': 'nutrition'})
        if nutrition_elem:
            for nutrient, prop_name in [
                ('calories', 'calories'),
                ('carbs', 'carbohydrateContent'),
                ('fiber', 'fiberContent'),
                ('sugar', 'sugarContent'),
                ('protein', 'proteinContent'),
                ('fat', 'fatContent'),
                ('saturatedFat', 'saturatedFatContent'),
                ('sodium', 'sodiumContent')
            ]:
                elem = nutrition_elem.find(attrs={'itemprop': prop_name})
                if elem:
                    text = elem.text
                    match = re.search(r'(\d+)', text)
                    if match:
                        nutrition[nutrient] = int(match.group(1))
        
        # Fallback to text search
        if nutrition['carbs'] == 0:
            nutrition_text = soup.text.lower()
            patterns = {
                'calories': r'calories?:?\s*(\d+)',
                'carbs': r'carb(?:ohydrate)?s?:?\s*(\d+)\s*g',
                'fiber': r'(?:dietary\s+)?fiber:?\s*(\d+)\s*g',
                'sugar': r'sugars?:?\s*(\d+)\s*g',
                'protein': r'protein:?\s*(\d+)\s*g',
                'fat': r'(?:total\s+)?fat:?\s*(\d+)\s*g',
                'saturatedFat': r'saturated\s+fat:?\s*(\d+)\s*g',
                'sodium': r'sodium:?\s*(\d+)\s*mg'
            }
            
            for nutrient, pattern in patterns.items():
                match = re.search(pattern, nutrition_text)
                if match:
                    nutrition[nutrient] = int(match.group(1))
        
        return nutrition
    
    def _validate_gd_nutrition(self, nutrition: Dict) -> bool:
        """Validate nutrition meets gestational diabetes requirements"""
        carbs = nutrition.get('carbs', 0)
        fiber = nutrition.get('fiber', 0)
        protein = nutrition.get('protein', 0)
        
        # Must have carb data
        if carbs == 0:
            return False
        
        # Reasonable ranges for any meal/snack
        if carbs < 10 or carbs > 50:
            return False
        
        # Minimum fiber
        if fiber < 2:
            return False
        
        # Minimum protein
        if protein < 5:
            return False
        
        return True
    
    def _determine_category(self, nutrition: Dict, title: str) -> str:
        """Determine meal category based on nutrition and title"""
        carbs = nutrition.get('carbs', 0)
        
        # Check title for hints
        breakfast_words = ['breakfast', 'oatmeal', 'pancake', 'egg', 'toast', 'smoothie', 'yogurt']
        lunch_words = ['sandwich', 'wrap', 'salad', 'soup']
        dinner_words = ['dinner', 'roasted', 'grilled', 'baked']
        snack_words = ['snack', 'bar', 'bites']
        
        for word in breakfast_words:
            if word in title:
                return 'breakfast'
        
        for word in snack_words:
            if word in title:
                return 'snacks'
        
        # Use carb content as guide
        if carbs <= 20:
            return 'snacks'
        elif carbs <= 35:
            return 'lunch'
        else:
            return 'dinner'
    
    def _download_image(self, url: str, recipe_title: str) -> Optional[str]:
        """Download and save recipe image"""
        try:
            response = self.session.get(url, stream=True, timeout=10)
            response.raise_for_status()
            
            # Generate safe filename
            safe_title = re.sub(r'[^\w\s-]', '', recipe_title.lower())
            safe_title = re.sub(r'[-\s]+', '-', safe_title)[:50]
            
            ext = os.path.splitext(urlparse(url).path)[1] or '.jpg'
            filename = f"{safe_title}{ext}"
            filepath = os.path.join(self.images_dir, filename)
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            
            logger.info(f"Downloaded image: {filename}")
            return f"images/{filename}"
            
        except Exception as e:
            logger.error(f"Error downloading image: {e}")
            return None
    
    def scrape_real_recipes(self):
        """Main method to scrape real, verified recipes"""
        
        # Search terms for gestational diabetes recipes
        search_queries = [
            "gestational diabetes",
            "low carb pregnancy",
            "diabetes friendly",
            "blood sugar friendly",
            "low glycemic",
            "high fiber",
            "balanced carbs"
        ]
        
        # Meal type filters
        meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
        
        all_recipe_urls = set()
        
        # Search for recipes
        logger.info("Searching for real recipes...")
        for query in search_queries:
            urls = self.search_recipes(query)
            all_recipe_urls.update(urls)
            
            # Also search with meal type filters
            for meal_type in meal_types:
                urls = self.search_recipes(query, {'meal_type': meal_type})
                all_recipe_urls.update(urls)
            
            if len(all_recipe_urls) >= 100:  # Limit to prevent too many requests
                break
        
        logger.info(f"Found {len(all_recipe_urls)} potential recipe URLs")
        
        # Parse each recipe
        successful_recipes = []
        for url in list(all_recipe_urls)[:100]:  # Limit to 100 recipes
            recipe = self.parse_recipe_page(url)
            if recipe:
                successful_recipes.append(recipe)
                logger.info(f"✓ Successfully scraped: {recipe['title']}")
            
            time.sleep(2)  # Rate limiting
            
            if len(successful_recipes) >= 50:  # Stop at 50 good recipes
                break
        
        # Save results
        logger.info(f"\nSuccessfully scraped {len(successful_recipes)} real recipes")
        
        # Save all recipes
        output_file = os.path.join(self.output_dir, 'real_recipes.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(successful_recipes, f, indent=2, ensure_ascii=False)
        
        # Save by category
        categories = {}
        for recipe in successful_recipes:
            cat = recipe['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(recipe)
        
        for category, recipes in categories.items():
            cat_file = os.path.join(self.output_dir, f'{category}_real.json')
            with open(cat_file, 'w', encoding='utf-8') as f:
                json.dump(recipes, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(recipes)} {category} recipes")
        
        # Create summary
        summary = {
            'total': len(successful_recipes),
            'verified': True,
            'source': 'diabetesfoodhub.org',
            'scraped_at': datetime.now().isoformat(),
            'by_category': {cat: len(recipes) for cat, recipes in categories.items()},
            'sample_recipes': [r['title'] for r in successful_recipes[:5]]
        }
        
        summary_file = os.path.join(self.output_dir, 'scraping_summary.json')
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\nScraping complete! Check {self.output_dir} for results")
        return successful_recipes

if __name__ == "__main__":
    scraper = RealRecipeScraper()
    scraper.scrape_real_recipes()