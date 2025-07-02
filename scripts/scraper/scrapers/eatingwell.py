#!/usr/bin/env python3
"""Scraper for EatingWell diabetic-friendly recipes."""

import logging
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin

from .base import RecipeScraper, RATE_LIMIT_DELAY

logger = logging.getLogger(__name__)


class EatingWellScraper(RecipeScraper):
    """Scraper for eatingwell.com diabetic diet recipes."""
    
    def __init__(self):
        super().__init__("https://www.eatingwell.com", "EatingWell", use_selenium=False)
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from EatingWell."""
        soup = self.get_soup(url)
        if not soup:
            return None
            
        try:
            # Try to extract JSON-LD data first
            json_ld = self.extract_json_ld(soup)
            
            # Extract title
            title = ""
            if json_ld and 'name' in json_ld:
                title = json_ld['name']
            else:
                title_elem = soup.find('h1', class_='recipe-name')
                if not title_elem:
                    title_elem = soup.find('h1')
                title = self.clean_text(title_elem.text) if title_elem else "Unknown Recipe"
            
            # Extract description
            description = ""
            if json_ld and 'description' in json_ld:
                description = json_ld['description']
            else:
                desc_elem = soup.find('div', class_='recipe-summary')
                if not desc_elem:
                    desc_elem = soup.find('p', class_='recipe-description')
                description = self.clean_text(desc_elem.text) if desc_elem else ""
            
            # Extract ingredients
            ingredients = []
            if json_ld and 'recipeIngredient' in json_ld:
                for ing_text in json_ld['recipeIngredient']:
                    ingredients.append(self.parse_ingredient(ing_text))
            else:
                # Look for ingredient list in HTML
                ingredient_section = soup.find('section', class_='recipe-ingredients')
                if not ingredient_section:
                    ingredient_section = soup.find('div', class_='ingredients-section')
                    
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
                # Look for instructions in HTML
                instruction_section = soup.find('section', class_='recipe-instructions')
                if not instruction_section:
                    instruction_section = soup.find('div', class_='instructions-section')
                    
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
                # Look for time in HTML
                time_section = soup.find('div', class_='recipe-meta-container')
                if time_section:
                    prep_elem = time_section.find(text=lambda t: 'prep' in t.lower() if t else False)
                    if prep_elem:
                        prep_time = self.extract_time(prep_elem.parent.text)
                    cook_elem = time_section.find(text=lambda t: 'cook' in t.lower() if t else False)
                    if cook_elem:
                        cook_time = self.extract_time(cook_elem.parent.text)
                        
            # Extract servings
            servings = 4  # default
            if json_ld and 'recipeYield' in json_ld:
                servings = int(self.extract_number(str(json_ld['recipeYield']))) or 4
            else:
                servings_elem = soup.find(text=lambda t: 'serving' in t.lower() if t else False)
                if servings_elem:
                    servings = int(self.extract_number(servings_elem.parent.text)) or 4
                    
            # Extract nutrition info
            nutrition = self.extract_nutrition_from_page(soup, json_ld)
            
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
                image_elem = soup.find('img', class_='recipe-image')
                if not image_elem:
                    image_elem = soup.find('img', {'itemprop': 'image'})
                if image_elem and image_elem.get('src'):
                    image_url = urljoin(url, image_elem['src'])
                    
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
                'scrapedAt': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            # Add diabetic-specific tags
            if 'diabetic' in url or 'diabetes' in url:
                recipe['tags'].append('diabetic-friendly')
            if is_gd_friendly:
                recipe['tags'].append('gd-friendly')
                
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def extract_nutrition_from_page(self, soup, json_ld: Optional[Dict] = None) -> Dict[str, float]:
        """Extract nutrition information from EatingWell page."""
        nutrition = self.extract_nutrition(soup, json_ld)
        
        # EatingWell specific nutrition extraction
        nutrition_section = soup.find('div', class_='recipe-nutrition')
        if not nutrition_section:
            nutrition_section = soup.find('div', class_='nutrition-profile')
            
        if nutrition_section:
            # Look for specific nutrition items
            nutrition_items = nutrition_section.find_all('span', class_='nutrition-item')
            
            for item in nutrition_items:
                text = item.text.lower()
                if 'calories' in text:
                    nutrition['calories'] = self.extract_number(text)
                elif 'carbohydrate' in text or 'carbs' in text:
                    nutrition['carbs'] = self.extract_number(text)
                elif 'protein' in text:
                    nutrition['protein'] = self.extract_number(text)
                elif 'fat' in text and 'saturated' not in text:
                    nutrition['fat'] = self.extract_number(text)
                elif 'fiber' in text:
                    nutrition['fiber'] = self.extract_number(text)
                elif 'sugar' in text:
                    nutrition['sugar'] = self.extract_number(text)
                elif 'sodium' in text:
                    nutrition['sodium'] = self.extract_number(text)
                elif 'saturated fat' in text:
                    nutrition['saturatedFat'] = self.extract_number(text)
                    
        return nutrition
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from EatingWell category page."""
        recipes = []
        soup = self.get_soup(list_url)
        
        if not soup:
            return recipes
            
        # Find recipe links - EatingWell uses article cards
        recipe_links = []
        
        # Look for recipe cards
        recipe_cards = soup.find_all('article', class_='recipe-card')
        if not recipe_cards:
            recipe_cards = soup.find_all('div', class_='card')
            
        for card in recipe_cards:
            link = card.find('a', href=True)
            if link and '/recipe/' in link['href']:
                full_url = urljoin(self.base_url, link['href'])
                if full_url not in recipe_links:
                    recipe_links.append(full_url)
                    
        # Also look for direct links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/recipe/' in href and href not in recipe_links:
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
        
    def get_diabetic_recipe_urls(self) -> List[str]:
        """Get URLs for diabetic-friendly recipe collections."""
        return [
            f"{self.base_url}/recipes/diabetic",
            f"{self.base_url}/recipes/18371/nutrition/diabetic/",
            f"{self.base_url}/recipes/22493/health-condition/diabetes/",
            f"{self.base_url}/special-diets/diabetes-appropriate/",
            f"{self.base_url}/recipes/low-glycemic/",
            f"{self.base_url}/recipes/high-fiber/",
            f"{self.base_url}/recipes/18371/nutrition/low-carb/"
        ]
        
    def get_meal_type_urls(self, meal_type: str) -> List[str]:
        """Get URLs for specific meal types with diabetic filters."""
        base_urls = {
            'breakfast': [
                f"{self.base_url}/recipes/17907/meal-types/breakfast/",
                f"{self.base_url}/recipes/diabetic-breakfast/"
            ],
            'lunch': [
                f"{self.base_url}/recipes/17908/meal-types/lunch/",
                f"{self.base_url}/recipes/diabetic-lunch/"
            ],
            'dinner': [
                f"{self.base_url}/recipes/17909/meal-types/dinner/",
                f"{self.base_url}/recipes/diabetic-dinner/"
            ],
            'snacks': [
                f"{self.base_url}/recipes/17950/meal-types/snacks/",
                f"{self.base_url}/recipes/diabetic-snacks/"
            ]
        }
        
        return base_urls.get(meal_type, [])