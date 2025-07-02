#!/usr/bin/env python3
"""Base scraper class with common functionality."""

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
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
REQUEST_TIMEOUT = 10
RATE_LIMIT_DELAY = 2  # seconds between requests


class RecipeScraper:
    """Base class for recipe scrapers."""
    
    def __init__(self, base_url: str, site_name: str, use_selenium: bool = False):
        self.base_url = base_url
        self.site_name = site_name
        self.use_selenium = use_selenium
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.driver = None
        
        if use_selenium:
            self._setup_selenium()
        
    def _setup_selenium(self):
        """Setup Selenium WebDriver for JavaScript-heavy sites."""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        try:
            self.driver = webdriver.Chrome(
                ChromeDriverManager().install(),
                options=chrome_options
            )
        except Exception as e:
            logger.error(f"Failed to setup Selenium: {e}")
            self.use_selenium = False
            
    def __del__(self):
        """Clean up Selenium driver."""
        if self.driver:
            self.driver.quit()
            
    def get_soup(self, url: str, use_js: bool = False) -> Optional[BeautifulSoup]:
        """Fetch URL and return BeautifulSoup object."""
        try:
            if use_js and self.use_selenium and self.driver:
                self.driver.get(url)
                # Wait for content to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                time.sleep(2)  # Additional wait for dynamic content
                html = self.driver.page_source
                return BeautifulSoup(html, 'html.parser')
            else:
                response = self.session.get(url, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
            
    def extract_time(self, time_str: str) -> int:
        """Extract time in minutes from string."""
        if not time_str:
            return 0
            
        # Look for patterns like "30 min", "1 hour", "1h 30m", "PT30M" (ISO 8601)
        total_minutes = 0
        
        # Handle ISO 8601 duration format (PT30M, PT1H30M)
        iso_match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', time_str)
        if iso_match:
            hours = int(iso_match.group(1) or 0)
            minutes = int(iso_match.group(2) or 0)
            return hours * 60 + minutes
        
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
        
    def extract_number(self, text: str, default: float = 0.0) -> float:
        """Extract number from string."""
        if not text:
            return default
            
        # Remove commas and extract first number
        text = text.replace(',', '')
        
        # Handle fractions
        fraction_match = re.search(r'(\d+)/(\d+)', text)
        if fraction_match:
            return float(fraction_match.group(1)) / float(fraction_match.group(2))
            
        # Handle decimals
        match = re.search(r'(\d+\.?\d*)', text)
        if match:
            return float(match.group(1))
            
        return default
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        # Remove extra whitespace and newlines
        text = ' '.join(text.split())
        return text.strip()
        
    def extract_json_ld(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract JSON-LD structured data if available."""
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                # Handle array of objects
                if isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'Recipe':
                            return item
                elif data.get('@type') == 'Recipe':
                    return data
            except json.JSONDecodeError:
                continue
        return None
        
    def parse_ingredient(self, text: str) -> Dict[str, any]:
        """Parse ingredient text into structured format."""
        # Clean the text first
        text = self.clean_text(text)
        if not text:
            return {'name': '', 'amount': 0, 'unit': ''}
            
        # Common units (expanded list)
        units = [
            'cup', 'cups', 'c', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 
            'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 
            'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'ml', 'milliliter',
            'milliliters', 'l', 'liter', 'liters', 'qt', 'quart', 'quarts',
            'pt', 'pint', 'pints', 'gal', 'gallon', 'gallons', 'dash', 'pinch',
            'handful', 'bunch', 'package', 'can', 'jar', 'bottle', 'bag', 'box'
        ]
        
        # Try to extract amount and unit
        amount = 0
        unit = ""
        name = text
        
        # Split text into parts
        parts = text.split()
        
        if len(parts) >= 2:
            # Check if first part is a number or fraction
            first_part = parts[0]
            
            # Handle mixed numbers (e.g., "1 1/2")
            if len(parts) >= 3 and '/' in parts[1]:
                try:
                    whole = float(parts[0])
                    frac_parts = parts[1].split('/')
                    fraction = float(frac_parts[0]) / float(frac_parts[1])
                    amount = whole + fraction
                    rest_start = 2
                except (ValueError, ZeroDivisionError):
                    rest_start = 0
            # Handle fractions
            elif '/' in first_part:
                try:
                    numerator, denominator = first_part.split('/')
                    amount = float(numerator) / float(denominator)
                    rest_start = 1
                except (ValueError, ZeroDivisionError):
                    rest_start = 0
            # Handle regular numbers
            else:
                try:
                    amount = float(first_part)
                    rest_start = 1
                except ValueError:
                    rest_start = 0
                    
            # Check if next part is a unit
            if rest_start > 0 and rest_start < len(parts):
                potential_unit = parts[rest_start].lower().rstrip('s')
                if potential_unit in units or parts[rest_start].lower() in units:
                    unit = parts[rest_start]
                    name = ' '.join(parts[rest_start + 1:])
                else:
                    name = ' '.join(parts[rest_start:])
                    
        # Clean up the name
        name = name.strip(',. ')
        
        return {
            'name': name,
            'amount': amount,
            'unit': unit
        }
        
    def extract_nutrition(self, soup: BeautifulSoup, json_ld: Optional[Dict] = None) -> Dict[str, float]:
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
        
        # Try JSON-LD first
        if json_ld and 'nutrition' in json_ld:
            nutrition_info = json_ld['nutrition']
            
            # Map JSON-LD nutrition fields to our format
            mapping = {
                'calories': ['calories', 'cal'],
                'carbohydrateContent': ['carbs', 'carbohydrate'],
                'proteinContent': ['protein'],
                'fatContent': ['fat', 'totalFat'],
                'fiberContent': ['fiber'],
                'sugarContent': ['sugar'],
                'sodiumContent': ['sodium'],
                'cholesterolContent': ['cholesterol'],
                'saturatedFatContent': ['saturatedFat'],
                'transFatContent': ['transFat']
            }
            
            for json_key, our_keys in mapping.items():
                if json_key in nutrition_info:
                    value = self.extract_number(str(nutrition_info[json_key]))
                    for our_key in our_keys:
                        if our_key in nutrition:
                            nutrition[our_key] = value
                            break
                            
        return nutrition
        
    def estimate_glycemic_index(self, ingredients: List[Dict], nutrition: Dict[str, float]) -> str:
        """Estimate glycemic index based on ingredients and nutrition."""
        # Simple estimation based on fiber to carb ratio and ingredients
        carbs = nutrition.get('carbs', 0)
        fiber = nutrition.get('fiber', 0)
        
        if carbs == 0:
            return 'low'
            
        fiber_ratio = fiber / carbs if carbs > 0 else 0
        
        # Check for high GI ingredients
        high_gi_keywords = [
            'white rice', 'white bread', 'white flour', 'potato', 'sugar', 
            'honey', 'maple syrup', 'corn syrup', 'white pasta', 'instant'
        ]
        low_gi_keywords = [
            'whole grain', 'whole wheat', 'beans', 'lentils', 'quinoa', 
            'vegetables', 'nuts', 'seeds', 'steel cut oats', 'brown rice',
            'sweet potato', 'chickpea', 'almond flour', 'coconut flour'
        ]
        
        ingredient_text = ' '.join([ing['name'].lower() for ing in ingredients])
        
        high_gi_count = sum(1 for keyword in high_gi_keywords if keyword in ingredient_text)
        low_gi_count = sum(1 for keyword in low_gi_keywords if keyword in ingredient_text)
        
        # Simple scoring
        if fiber_ratio > 0.3 or low_gi_count > high_gi_count * 2:
            return 'low'
        elif fiber_ratio > 0.15 or low_gi_count >= high_gi_count:
            return 'medium'
        else:
            return 'high'
            
    def generate_tags(self, title: str, ingredients: List[Dict], nutrition: Dict[str, float], 
                     description: str = "", meal_type: str = "") -> List[str]:
        """Generate comprehensive tags for the recipe."""
        tags = []
        
        # Combine all text for analysis
        title_lower = title.lower()
        desc_lower = description.lower() if description else ""
        ingredient_text = ' '.join([ing['name'].lower() for ing in ingredients])
        combined_text = f"{title_lower} {desc_lower} {ingredient_text}"
        
        # Meal type tags
        if meal_type:
            tags.append(meal_type.lower())
        else:
            # Try to determine meal type from title/description
            if any(word in title_lower for word in ['breakfast', 'morning', 'brunch', 'pancake', 'waffle', 'oatmeal', 'muffin', 'granola']):
                tags.append('breakfast')
            elif any(word in title_lower for word in ['lunch', 'sandwich', 'wrap', 'salad', 'soup']):
                tags.append('lunch')
            elif any(word in title_lower for word in ['dinner', 'main', 'entree', 'supper']):
                tags.append('dinner')
            elif any(word in title_lower for word in ['snack', 'appetizer', 'bite', 'bar']):
                tags.append('snack')
                
        # Dietary tags
        meat_keywords = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'bacon', 'sausage']
        animal_keywords = meat_keywords + ['egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey']
        
        if not any(meat in ingredient_text for meat in meat_keywords):
            tags.append('vegetarian')
        if not any(animal in ingredient_text for animal in animal_keywords):
            tags.append('vegan')
            
        # Gluten-free check
        gluten_keywords = ['flour', 'bread', 'pasta', 'wheat', 'barley', 'rye', 'couscous']
        gluten_free_keywords = ['gluten-free', 'almond flour', 'coconut flour', 'rice flour']
        if any(gf in combined_text for gf in gluten_free_keywords) or not any(g in ingredient_text for g in gluten_keywords):
            tags.append('gluten-free')
            
        # Dairy-free check
        dairy_keywords = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey']
        if not any(dairy in ingredient_text for dairy in dairy_keywords):
            tags.append('dairy-free')
            
        # Nutrition-based tags
        calories = nutrition.get('calories', 0)
        carbs = nutrition.get('carbs', 0)
        protein = nutrition.get('protein', 0)
        fiber = nutrition.get('fiber', 0)
        
        if carbs > 0 and carbs < 20:
            tags.append('low-carb')
        if calories > 0 and calories < 300:
            tags.append('low-calorie')
        if protein > 20:
            tags.append('high-protein')
        if fiber >= 5:
            tags.append('high-fiber')
            
        # Cooking method tags
        cooking_methods = {
            'baked': ['bake', 'baked', 'baking', 'oven'],
            'grilled': ['grill', 'grilled', 'grilling', 'bbq', 'barbecue'],
            'slow-cooker': ['slow cooker', 'crock pot', 'crockpot'],
            'instant-pot': ['instant pot', 'pressure cooker'],
            'no-cook': ['no cook', 'no-cook', 'raw', 'overnight'],
            'one-pot': ['one pot', 'one-pot', 'sheet pan']
        }
        
        for tag, keywords in cooking_methods.items():
            if any(keyword in combined_text for keyword in keywords):
                tags.append(tag)
                
        # Quick meal tags
        total_time = 0
        if 'prepTime' in nutrition and 'cookTime' in nutrition:
            total_time = nutrition.get('prepTime', 0) + nutrition.get('cookTime', 0)
        if total_time > 0 and total_time <= 30:
            tags.append('quick')
        elif total_time > 0 and total_time <= 15:
            tags.append('15-minutes')
            
        return list(set(tags))  # Remove duplicates
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe. Must be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement scrape_recipe")
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from a category page."""
        raise NotImplementedError("Subclasses must implement scrape_recipe_list")