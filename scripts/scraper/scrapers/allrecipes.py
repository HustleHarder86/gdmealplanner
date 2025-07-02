#!/usr/bin/env python3
"""Scraper for AllRecipes with diabetic-friendly filters."""

import logging
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin, quote

from .base import RecipeScraper, RATE_LIMIT_DELAY

logger = logging.getLogger(__name__)


class AllRecipesScraper(RecipeScraper):
    """Scraper for allrecipes.com with diabetic-friendly filters."""
    
    def __init__(self):
        super().__init__("https://www.allrecipes.com", "AllRecipes", use_selenium=False)
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from AllRecipes."""
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
                title_elem = soup.find('h1', class_='headline')
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
                    desc_elem = soup.find('p', class_='margin-0-auto')
                description = self.clean_text(desc_elem.text) if desc_elem else ""
            
            # Extract ingredients
            ingredients = []
            if json_ld and 'recipeIngredient' in json_ld:
                for ing_text in json_ld['recipeIngredient']:
                    ingredients.append(self.parse_ingredient(ing_text))
            else:
                # Look for ingredient list in HTML
                ingredient_section = soup.find('section', {'data-tracking-zone': 'recipe-ingredients'})
                if not ingredient_section:
                    ingredient_section = soup.find('div', class_='recipe-ingredients')
                    
                if ingredient_section:
                    for item in ingredient_section.find_all('li'):
                        # Skip advertisement items
                        if 'advertisement' in item.get('class', []):
                            continue
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
                instruction_section = soup.find('section', {'data-tracking-zone': 'recipe-instructions'})
                if not instruction_section:
                    instruction_section = soup.find('div', class_='recipe-instructions')
                    
                if instruction_section:
                    for item in instruction_section.find_all(['li', 'p']):
                        if 'advertisement' in item.get('class', []):
                            continue
                        text = self.clean_text(item.text)
                        if text and len(text) > 10:
                            # Remove step numbers
                            text = text.lstrip('0123456789. ')
                            if text:
                                instructions.append(text)
                            
            # Extract times
            prep_time = 0
            cook_time = 0
            
            if json_ld:
                prep_time = self.extract_time(json_ld.get('prepTime', ''))
                cook_time = self.extract_time(json_ld.get('cookTime', ''))
            else:
                # Look for time in recipe meta
                time_section = soup.find('div', class_='recipe-meta-container')
                if not time_section:
                    time_section = soup.find('div', class_='recipe-info')
                    
                if time_section:
                    prep_elem = time_section.find('div', {'data-test-id': 'prep-time'})
                    if prep_elem:
                        prep_time = self.extract_time(prep_elem.text)
                    cook_elem = time_section.find('div', {'data-test-id': 'cook-time'})
                    if cook_elem:
                        cook_time = self.extract_time(cook_elem.text)
                        
            # Extract servings
            servings = 4  # default
            if json_ld and 'recipeYield' in json_ld:
                yield_text = str(json_ld['recipeYield'])
                servings = int(self.extract_number(yield_text)) or 4
            else:
                servings_elem = soup.find('div', class_='recipe-yield')
                if servings_elem:
                    servings = int(self.extract_number(servings_elem.text)) or 4
                    
            # Extract nutrition info
            nutrition = self.extract_allrecipes_nutrition(soup, json_ld)
            
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
                image_elem = soup.find('img', class_='primary-image')
                if not image_elem:
                    image_elem = soup.find('img', {'data-src': True})
                if image_elem:
                    image_url = image_elem.get('src') or image_elem.get('data-src')
                    if image_url:
                        image_url = urljoin(url, image_url)
                    
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
            
            # Get user ratings if available
            rating = 0
            rating_count = 0
            if json_ld and 'aggregateRating' in json_ld:
                rating = float(json_ld['aggregateRating'].get('ratingValue', 0))
                rating_count = int(json_ld['aggregateRating'].get('ratingCount', 0))
            
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
                'rating': rating,
                'ratingCount': rating_count,
                'scrapedAt': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            # Add diabetic-specific tags
            if is_gd_friendly:
                recipe['tags'].append('gd-friendly')
            if rating >= 4.0 and rating_count >= 10:
                recipe['tags'].append('highly-rated')
                
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def extract_allrecipes_nutrition(self, soup, json_ld: Optional[Dict] = None) -> Dict[str, float]:
        """Extract nutrition information from AllRecipes."""
        nutrition = self.extract_nutrition(soup, json_ld)
        
        # AllRecipes specific nutrition extraction
        nutrition_section = soup.find('section', class_='recipe-nutrition')
        if not nutrition_section:
            nutrition_section = soup.find('div', class_='recipe-nutrition-section')
            
        if nutrition_section:
            # Look for nutrition rows
            nutrition_rows = nutrition_section.find_all('div', class_='nutrition-row')
            
            for row in nutrition_rows:
                label = row.find('span', class_='nutrient-name')
                value = row.find('span', class_='nutrient-value')
                
                if label and value:
                    label_text = label.text.lower()
                    value_num = self.extract_number(value.text)
                    
                    if 'calories' in label_text:
                        nutrition['calories'] = value_num
                    elif 'carbohydrate' in label_text:
                        nutrition['carbs'] = value_num
                    elif 'protein' in label_text:
                        nutrition['protein'] = value_num
                    elif 'fat' in label_text and 'saturated' not in label_text:
                        nutrition['fat'] = value_num
                    elif 'fiber' in label_text:
                        nutrition['fiber'] = value_num
                    elif 'sugar' in label_text:
                        nutrition['sugar'] = value_num
                    elif 'sodium' in label_text:
                        nutrition['sodium'] = value_num
                    elif 'saturated fat' in label_text:
                        nutrition['saturatedFat'] = value_num
                    elif 'cholesterol' in label_text:
                        nutrition['cholesterol'] = value_num
                        
        return nutrition
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from AllRecipes category/search page."""
        recipes = []
        soup = self.get_soup(list_url)
        
        if not soup:
            return recipes
            
        # Find recipe links
        recipe_links = []
        
        # Look for recipe cards
        recipe_cards = soup.find_all('div', class_='card__detailsContainer')
        if not recipe_cards:
            recipe_cards = soup.find_all('article', class_='recipe-card')
            
        for card in recipe_cards:
            link = card.find('a', href=True)
            if link and '/recipe/' in link['href']:
                full_url = urljoin(self.base_url, link['href'])
                if full_url not in recipe_links:
                    recipe_links.append(full_url)
                    
        # Also look for grid items
        grid_items = soup.find_all('div', class_='component')
        for item in grid_items:
            link = item.find('a', href=True)
            if link and '/recipe/' in link['href']:
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
        
    def get_diabetic_search_urls(self) -> List[str]:
        """Get search URLs for diabetic-friendly recipes."""
        # AllRecipes search parameters for diabetic-friendly recipes
        search_terms = [
            "gestational diabetes",
            "diabetic friendly",
            "low glycemic",
            "high fiber low carb",
            "diabetes meal",
            "blood sugar friendly"
        ]
        
        urls = []
        for term in search_terms:
            search_url = f"{self.base_url}/search?q={quote(term)}"
            urls.append(search_url)
            
        # Also add specific dietary collection URLs
        urls.extend([
            f"{self.base_url}/recipes/739/healthy-recipes/diabetic/",
            f"{self.base_url}/recipes/1231/healthy-recipes/low-carb/",
            f"{self.base_url}/recipes/22959/healthy-recipes/high-fiber/",
            f"{self.base_url}/recipes/84/healthy-recipes/",
        ])
        
        return urls
        
    def get_meal_type_search_urls(self, meal_type: str) -> List[str]:
        """Get search URLs for specific meal types with diabetic filters."""
        base_searches = {
            'breakfast': [
                "diabetic breakfast",
                "low carb breakfast", 
                "high protein breakfast",
                "gestational diabetes breakfast"
            ],
            'lunch': [
                "diabetic lunch",
                "low carb lunch",
                "healthy lunch diabetes",
                "gestational diabetes lunch"
            ],
            'dinner': [
                "diabetic dinner",
                "low glycemic dinner",
                "diabetes friendly dinner",
                "gestational diabetes dinner"
            ],
            'snacks': [
                "diabetic snacks",
                "low carb snacks",
                "pregnancy diabetes snacks",
                "high protein low carb snacks"
            ]
        }
        
        urls = []
        if meal_type in base_searches:
            for term in base_searches[meal_type]:
                search_url = f"{self.base_url}/search?q={quote(term)}"
                urls.append(search_url)
                
        return urls