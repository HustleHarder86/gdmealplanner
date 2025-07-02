#!/usr/bin/env python3
"""Enhanced scraper for diabetesfoodhub.org - highest priority source."""

import logging
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin
import re

from .base import RecipeScraper, RATE_LIMIT_DELAY

logger = logging.getLogger(__name__)


class DiabetesFoodHubScraper(RecipeScraper):
    """Enhanced scraper for diabetesfoodhub.org"""
    
    def __init__(self):
        super().__init__("https://diabetesfoodhub.org", "Diabetes Food Hub", use_selenium=False)
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from Diabetes Food Hub."""
        soup = self.get_soup(url)
        if not soup:
            return None
            
        try:
            # Extract JSON-LD if available
            json_ld = self.extract_json_ld(soup)
            
            # Extract title
            title = ""
            if json_ld and 'name' in json_ld:
                title = json_ld['name']
            else:
                title_elem = soup.find('h1', class_='recipe-name')
                if not title_elem:
                    title_elem = soup.find('h1', class_='field-name-title')
                if not title_elem:
                    title_elem = soup.find('h1')
                title = self.clean_text(title_elem.text) if title_elem else "Unknown Recipe"
            
            # Extract description
            description = ""
            if json_ld and 'description' in json_ld:
                description = json_ld['description']
            else:
                desc_elem = soup.find('div', class_='recipe-intro')
                if not desc_elem:
                    desc_elem = soup.find('div', class_='field-name-body')
                if not desc_elem:
                    desc_elem = soup.find('div', class_='recipe-description')
                description = self.clean_text(desc_elem.text) if desc_elem else ""
            
            # Extract ingredients
            ingredients = []
            if json_ld and 'recipeIngredient' in json_ld:
                for ing_text in json_ld['recipeIngredient']:
                    ingredients.append(self.parse_ingredient(ing_text))
            else:
                # Multiple possible selectors for ingredients
                ingredient_selectors = [
                    ('ul', {'class': 'recipe-ingredients'}),
                    ('div', {'class': 'field-name-field-ingredients'}),
                    ('section', {'class': 'ingredients'}),
                    ('div', {'class': 'ingredients-section'})
                ]
                
                for tag, attrs in ingredient_selectors:
                    ingredient_section = soup.find(tag, attrs)
                    if ingredient_section:
                        break
                        
                if ingredient_section:
                    for item in ingredient_section.find_all('li'):
                        text = self.clean_text(item.text)
                        if text:
                            ingredients.append(self.parse_ingredient(text))
                            
            # Extract instructions
            instructions = []
            if json_ld and 'recipeInstructions' in json_ld:
                for inst in json_ld['recipeInstructions']:
                    if isinstance(inst, dict):
                        text = inst.get('text', '') or inst.get('name', '')
                    else:
                        text = str(inst)
                    if text:
                        instructions.append(self.clean_text(text))
            else:
                # Multiple possible selectors for instructions
                instruction_selectors = [
                    ('ol', {'class': 'recipe-instructions'}),
                    ('div', {'class': 'field-name-field-instructions'}),
                    ('section', {'class': 'instructions'}),
                    ('div', {'class': 'directions-section'})
                ]
                
                for tag, attrs in instruction_selectors:
                    instruction_section = soup.find(tag, attrs)
                    if instruction_section:
                        break
                        
                if instruction_section:
                    for item in instruction_section.find_all(['li', 'p']):
                        text = self.clean_text(item.text)
                        if text and len(text) > 10:
                            instructions.append(text)
                            
            # Extract times
            prep_time = 0
            cook_time = 0
            
            if json_ld:
                prep_time = self.extract_time(json_ld.get('prepTime', ''))
                cook_time = self.extract_time(json_ld.get('cookTime', ''))
            else:
                # Look for recipe meta information
                meta_section = soup.find('div', class_='recipe-meta')
                if not meta_section:
                    meta_section = soup.find('div', class_='recipe-info')
                    
                if meta_section:
                    # Look for prep time
                    prep_elem = meta_section.find(text=re.compile(r'prep', re.I))
                    if prep_elem:
                        prep_time = self.extract_time(prep_elem.parent.text)
                    
                    # Look for cook time
                    cook_elem = meta_section.find(text=re.compile(r'cook', re.I))
                    if cook_elem:
                        cook_time = self.extract_time(cook_elem.parent.text)
                        
            # Extract servings
            servings = 4  # default
            if json_ld and 'recipeYield' in json_ld:
                servings = int(self.extract_number(str(json_ld['recipeYield']))) or 4
            else:
                servings_elem = soup.find(text=re.compile(r'servings?|yield', re.I))
                if servings_elem:
                    servings = int(self.extract_number(servings_elem.parent.text)) or 4
                    
            # Extract comprehensive nutrition info
            nutrition = self.extract_dfh_nutrition(soup, json_ld)
            
            # Extract image
            image_url = None
            if json_ld and 'image' in json_ld:
                if isinstance(json_ld['image'], list):
                    image_url = json_ld['image'][0] if json_ld['image'] else None
                elif isinstance(json_ld['image'], dict):
                    image_url = json_ld['image'].get('url')
                else:
                    image_url = json_ld['image']
            else:
                # Look for recipe image
                image_selectors = [
                    ('img', {'class': 'recipe-image'}),
                    ('img', {'class': 'recipe-photo'}),
                    ('div', {'class': 'field-name-field-image'}),
                    ('div', {'class': 'recipe-header-image'})
                ]
                
                for tag, attrs in image_selectors:
                    if tag == 'img':
                        image_elem = soup.find(tag, attrs)
                    else:
                        container = soup.find(tag, attrs)
                        image_elem = container.find('img') if container else None
                        
                    if image_elem and image_elem.get('src'):
                        image_url = urljoin(url, image_elem['src'])
                        break
                        
            # Calculate estimated glycemic index
            estimated_gi = self.estimate_glycemic_index(ingredients, nutrition)
            
            # Validate for gestational diabetes
            carbs_per_serving = nutrition.get('carbs', 0)
            fiber_per_serving = nutrition.get('fiber', 0)
            
            # Check if meets GD criteria
            is_gd_friendly = (
                15 <= carbs_per_serving <= 45 and  # Appropriate carb range
                fiber_per_serving >= 3 and  # Minimum fiber
                estimated_gi in ['low', 'medium']  # Acceptable GI
            )
            
            # Extract additional metadata
            recipe_meta = self.extract_recipe_metadata(soup)
            
            recipe = {
                'title': title,
                'description': description,
                'ingredients': ingredients,
                'instructions': instructions,
                'prepTime': prep_time,
                'cookTime': cook_time,
                'servings': servings,
                'nutrition': nutrition,
                'tags': self.generate_tags(title, ingredients, nutrition, description),
                'imageUrl': image_url,
                'sourceUrl': url,
                'sourceSite': self.site_name,
                'estimatedGlycemicIndex': estimated_gi,
                'isGDFriendly': is_gd_friendly,
                'diabeticExchanges': recipe_meta.get('exchanges', {}),
                'carbChoices': recipe_meta.get('carbChoices', 0),
                'scrapedAt': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            # Add diabetes-specific tags
            recipe['tags'].extend(['diabetic-friendly', 'ada-approved'])
            if is_gd_friendly:
                recipe['tags'].append('gd-friendly')
                
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def extract_dfh_nutrition(self, soup, json_ld: Optional[Dict] = None) -> Dict[str, float]:
        """Extract nutrition information from Diabetes Food Hub."""
        nutrition = self.extract_nutrition(soup, json_ld)
        
        # DFH specific nutrition extraction
        nutrition_section = soup.find('div', class_='nutrition-analysis')
        if not nutrition_section:
            nutrition_section = soup.find('div', class_='field-name-field-nutrition-info')
        if not nutrition_section:
            nutrition_section = soup.find('section', class_='nutrition')
            
        if nutrition_section:
            # Look for nutrition facts table
            nutrition_table = nutrition_section.find('table')
            if nutrition_table:
                rows = nutrition_table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        label = cells[0].text.lower()
                        value = self.extract_number(cells[1].text)
                        
                        if 'calories' in label:
                            nutrition['calories'] = value
                        elif 'carbohydrate' in label:
                            nutrition['carbs'] = value
                        elif 'protein' in label:
                            nutrition['protein'] = value
                        elif 'fat' in label and 'saturated' not in label and 'trans' not in label:
                            nutrition['fat'] = value
                        elif 'fiber' in label:
                            nutrition['fiber'] = value
                        elif 'sugar' in label:
                            nutrition['sugar'] = value
                        elif 'sodium' in label:
                            nutrition['sodium'] = value
                        elif 'saturated' in label:
                            nutrition['saturatedFat'] = value
                        elif 'cholesterol' in label:
                            nutrition['cholesterol'] = value
            else:
                # Try to extract from list format
                nutrition_items = nutrition_section.find_all(['li', 'div', 'span'])
                for item in nutrition_items:
                    text = item.text.lower()
                    
                    patterns = {
                        'calories': r'calories?[:\s]*(\d+)',
                        'carbs': r'carb(?:ohydrate)?s?[:\s]*(\d+\.?\d*)\s*g',
                        'protein': r'protein[:\s]*(\d+\.?\d*)\s*g',
                        'fat': r'(?:total\s*)?fat[:\s]*(\d+\.?\d*)\s*g',
                        'fiber': r'(?:dietary\s*)?fiber[:\s]*(\d+\.?\d*)\s*g',
                        'sugar': r'sugars?[:\s]*(\d+\.?\d*)\s*g',
                        'sodium': r'sodium[:\s]*(\d+)\s*mg',
                        'saturatedFat': r'saturated\s*fat[:\s]*(\d+\.?\d*)\s*g',
                        'cholesterol': r'cholesterol[:\s]*(\d+)\s*mg'
                    }
                    
                    for nutrient, pattern in patterns.items():
                        match = re.search(pattern, text)
                        if match:
                            nutrition[nutrient] = float(match.group(1))
                            
        return nutrition
        
    def extract_recipe_metadata(self, soup) -> Dict:
        """Extract additional metadata specific to Diabetes Food Hub."""
        metadata = {
            'exchanges': {},
            'carbChoices': 0
        }
        
        # Look for diabetic exchanges
        exchanges_section = soup.find('div', class_='diabetic-exchanges')
        if not exchanges_section:
            exchanges_section = soup.find('div', class_='field-name-field-diabetic-exchanges')
            
        if exchanges_section:
            # Extract exchange information
            exchange_text = exchanges_section.text
            
            # Common exchange patterns
            exchange_patterns = {
                'starch': r'(\d+\.?\d*)\s*starch',
                'fruit': r'(\d+\.?\d*)\s*fruit',
                'milk': r'(\d+\.?\d*)\s*milk',
                'vegetable': r'(\d+\.?\d*)\s*vegetable',
                'meat': r'(\d+\.?\d*)\s*meat',
                'fat': r'(\d+\.?\d*)\s*fat',
                'carb': r'(\d+\.?\d*)\s*carb(?:ohydrate)?\s*choice'
            }
            
            for exchange_type, pattern in exchange_patterns.items():
                match = re.search(pattern, exchange_text, re.I)
                if match:
                    if exchange_type == 'carb':
                        metadata['carbChoices'] = float(match.group(1))
                    else:
                        metadata['exchanges'][exchange_type] = float(match.group(1))
                        
        return metadata
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from Diabetes Food Hub category page."""
        recipes = []
        soup = self.get_soup(list_url)
        
        if not soup:
            return recipes
            
        # Find recipe links
        recipe_links = []
        
        # Look for recipe cards/tiles
        recipe_cards = soup.find_all('div', class_='recipe-card')
        if not recipe_cards:
            recipe_cards = soup.find_all('article', class_='recipe-teaser')
        if not recipe_cards:
            recipe_cards = soup.find_all('div', class_='view-mode-card')
            
        for card in recipe_cards:
            link = card.find('a', href=True)
            if link and '/recipes/' in link['href']:
                full_url = urljoin(self.base_url, link['href'])
                if full_url not in recipe_links:
                    recipe_links.append(full_url)
                    
        # Also look for list views
        list_items = soup.find_all('div', class_='views-row')
        for item in list_items:
            link = item.find('a', href=True)
            if link and '/recipes/' in link['href']:
                full_url = urljoin(self.base_url, link['href'])
                if full_url not in recipe_links:
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
        
    def get_category_urls(self) -> Dict[str, List[str]]:
        """Get URLs for different recipe categories."""
        categories = {
            'breakfast': [
                f"{self.base_url}/recipes/breakfast-brunch",
                f"{self.base_url}/meal-type/breakfast",
                f"{self.base_url}/recipes?f[0]=recipe_meal_type%3A36"  # Breakfast filter
            ],
            'lunch': [
                f"{self.base_url}/recipes/lunch",
                f"{self.base_url}/meal-type/lunch",
                f"{self.base_url}/recipes?f[0]=recipe_meal_type%3A37"  # Lunch filter
            ],
            'dinner': [
                f"{self.base_url}/recipes/dinner",
                f"{self.base_url}/meal-type/dinner",
                f"{self.base_url}/recipes?f[0]=recipe_meal_type%3A38"  # Dinner filter
            ],
            'snacks': [
                f"{self.base_url}/recipes/snacks",
                f"{self.base_url}/meal-type/snack",
                f"{self.base_url}/recipes?f[0]=recipe_meal_type%3A39"  # Snack filter
            ],
            'desserts': [
                f"{self.base_url}/recipes/desserts",
                f"{self.base_url}/meal-type/dessert",
                f"{self.base_url}/recipes?f[0]=recipe_meal_type%3A40"  # Dessert filter
            ]
        }
        
        # Add cuisine-specific URLs
        categories['cuisines'] = [
            f"{self.base_url}/recipes/asian",
            f"{self.base_url}/recipes/latin-american",
            f"{self.base_url}/recipes/mediterranean",
            f"{self.base_url}/recipes/indian",
            f"{self.base_url}/recipes/middle-eastern"
        ]
        
        return categories