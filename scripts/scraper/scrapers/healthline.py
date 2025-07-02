#!/usr/bin/env python3
"""Scraper for Healthline gestational diabetes recipes."""

import logging
import time
from typing import Dict, List, Optional
from urllib.parse import urljoin
import re

from .base import RecipeScraper, RATE_LIMIT_DELAY

logger = logging.getLogger(__name__)


class HealthlineScraper(RecipeScraper):
    """Scraper for healthline.com gestational diabetes recipes."""
    
    def __init__(self):
        super().__init__("https://www.healthline.com", "Healthline", use_selenium=True)
        
    def scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape a single recipe from Healthline."""
        # Healthline often requires JavaScript rendering
        soup = self.get_soup(url, use_js=True)
        if not soup:
            return None
            
        try:
            # Extract title
            title_elem = soup.find('h1')
            title = self.clean_text(title_elem.text) if title_elem else "Unknown Recipe"
            
            # Remove common prefixes/suffixes
            title = re.sub(r'^Recipe:\s*', '', title, flags=re.I)
            title = re.sub(r'\s*\|\s*Healthline$', '', title)
            
            # Extract description
            description = ""
            # Look for article summary or first paragraph
            summary = soup.find('div', class_='article-summary')
            if summary:
                description = self.clean_text(summary.text)
            else:
                # Try first paragraph after title
                content = soup.find('div', class_='article-body')
                if content:
                    first_p = content.find('p')
                    if first_p:
                        description = self.clean_text(first_p.text)
            
            # Extract recipe content
            ingredients = []
            instructions = []
            
            # Healthline often uses structured content blocks
            content_blocks = soup.find_all(['div', 'section'], class_=['recipe-content', 'content-block'])
            
            for block in content_blocks:
                # Check headers to identify content type
                header = block.find(['h2', 'h3', 'h4'])
                if header:
                    header_text = header.text.lower()
                    
                    if 'ingredient' in header_text:
                        # Extract ingredients
                        for li in block.find_all('li'):
                            text = self.clean_text(li.text)
                            if text:
                                ingredients.append(self.parse_ingredient(text))
                                
                    elif any(word in header_text for word in ['instruction', 'direction', 'method', 'step']):
                        # Extract instructions
                        for elem in block.find_all(['li', 'p']):
                            text = self.clean_text(elem.text)
                            if text and len(text) > 10:
                                instructions.append(text)
            
            # If no structured content found, try to extract from main content
            if not ingredients:
                # Look for ingredient patterns in text
                content = soup.find('div', class_='article-body')
                if content:
                    # Find lists that might be ingredients
                    for ul in content.find_all('ul'):
                        # Check if this looks like an ingredient list
                        list_items = ul.find_all('li')
                        if list_items and any(self._looks_like_ingredient(li.text) for li in list_items[:3]):
                            for li in list_items:
                                text = self.clean_text(li.text)
                                if text:
                                    ingredients.append(self.parse_ingredient(text))
                            break
                            
            if not instructions and not ingredients:
                # This might not be a recipe page
                logger.warning(f"No recipe content found on {url}")
                return None
                
            # Extract nutrition information
            nutrition = self._extract_healthline_nutrition(soup)
            
            # Extract time information (often in the introduction)
            prep_time = 15  # default
            cook_time = 30  # default
            
            time_info = soup.find(text=re.compile(r'(prep|cook|total)\s*time', re.I))
            if time_info:
                parent = time_info.parent
                if parent:
                    prep_match = re.search(r'prep\s*time[:\s]*(\d+\s*(?:min|hour))', parent.text, re.I)
                    if prep_match:
                        prep_time = self.extract_time(prep_match.group(1))
                    cook_match = re.search(r'cook\s*time[:\s]*(\d+\s*(?:min|hour))', parent.text, re.I)
                    if cook_match:
                        cook_time = self.extract_time(cook_match.group(1))
                        
            # Extract servings
            servings = 4  # default
            servings_text = soup.find(text=re.compile(r'(serves?|servings?|yield)', re.I))
            if servings_text:
                servings = int(self.extract_number(servings_text.parent.text)) or 4
                
            # Extract image
            image_url = None
            # Look for recipe image
            image_elem = soup.find('img', {'alt': re.compile(title[:20], re.I)})
            if not image_elem:
                # Try to find any large image in content
                content = soup.find('div', class_='article-body')
                if content:
                    images = content.find_all('img')
                    for img in images:
                        if img.get('width') and int(img.get('width', 0)) > 300:
                            image_elem = img
                            break
                            
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
            
            # Add health condition tags
            if any(term in url.lower() for term in ['gestational', 'diabetes', 'pregnancy']):
                recipe['tags'].extend(['gestational-diabetes', 'pregnancy-safe'])
            if is_gd_friendly:
                recipe['tags'].append('gd-friendly')
                
            return recipe
            
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            return None
            
    def _looks_like_ingredient(self, text: str) -> bool:
        """Check if text looks like an ingredient."""
        # Common ingredient patterns
        patterns = [
            r'^\d+',  # Starts with number
            r'cup|tbsp|tsp|oz|pound|gram',  # Contains units
            r'chopped|diced|minced|sliced',  # Preparation words
        ]
        
        text_lower = text.lower()
        return any(re.search(pattern, text_lower) for pattern in patterns)
        
    def _extract_healthline_nutrition(self, soup) -> Dict[str, float]:
        """Extract nutrition information from Healthline format."""
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
        
        # Look for nutrition facts section
        nutrition_section = soup.find('div', class_=['nutrition-facts', 'nutrition-info'])
        if not nutrition_section:
            # Try to find by heading
            for heading in soup.find_all(['h2', 'h3', 'h4']):
                if 'nutrition' in heading.text.lower():
                    nutrition_section = heading.find_next_sibling(['div', 'ul', 'table'])
                    break
                    
        if nutrition_section:
            # Extract nutrition values
            text = nutrition_section.text
            
            # Common patterns
            patterns = {
                'calories': r'calories?[:\s]*(\d+)',
                'carbs': r'carb(?:ohydrate)?s?[:\s]*(\d+\.?\d*)\s*g',
                'protein': r'protein[:\s]*(\d+\.?\d*)\s*g',
                'fat': r'(?:total\s*)?fat[:\s]*(\d+\.?\d*)\s*g',
                'fiber': r'fiber[:\s]*(\d+\.?\d*)\s*g',
                'sugar': r'sugar[:\s]*(\d+\.?\d*)\s*g',
                'sodium': r'sodium[:\s]*(\d+)\s*mg',
                'saturatedFat': r'saturated\s*fat[:\s]*(\d+\.?\d*)\s*g'
            }
            
            for nutrient, pattern in patterns.items():
                match = re.search(pattern, text, re.I)
                if match:
                    nutrition[nutrient] = float(match.group(1))
                    
        # If no nutrition section, look for inline nutrition mentions
        if all(v == 0 for v in nutrition.values()):
            content = soup.find('div', class_='article-body')
            if content:
                # Look for nutrition mentions in paragraphs
                for p in content.find_all('p'):
                    text = p.text
                    if 'nutrition' in text.lower() or 'per serving' in text.lower():
                        for nutrient, pattern in {
                            'calories': r'(\d+)\s*calories',
                            'carbs': r'(\d+\.?\d*)\s*g(?:rams)?\s*(?:of\s*)?carb',
                            'protein': r'(\d+\.?\d*)\s*g(?:rams)?\s*(?:of\s*)?protein',
                            'fiber': r'(\d+\.?\d*)\s*g(?:rams)?\s*(?:of\s*)?fiber'
                        }.items():
                            match = re.search(pattern, text, re.I)
                            if match:
                                nutrition[nutrient] = float(match.group(1))
                                
        return nutrition
        
    def scrape_recipe_list(self, list_url: str, max_recipes: int = 10) -> List[Dict]:
        """Scrape a list of recipes from Healthline article."""
        recipes = []
        soup = self.get_soup(list_url, use_js=True)
        
        if not soup:
            return recipes
            
        # Healthline often has recipe collections in articles
        recipe_links = []
        
        # Look for recipe links in the article
        content = soup.find('div', class_='article-body')
        if content:
            for link in content.find_all('a', href=True):
                href = link['href']
                # Check if it looks like a recipe link
                if any(term in href.lower() for term in ['recipe', 'gestational', 'diabetes', 'meal']):
                    full_url = urljoin(self.base_url, href)
                    if full_url not in recipe_links and self.base_url in full_url:
                        recipe_links.append(full_url)
                        
        # Also check for recipe cards or sections
        recipe_sections = soup.find_all(['div', 'section'], class_=['recipe-card', 'recipe-item'])
        for section in recipe_sections:
            link = section.find('a', href=True)
            if link:
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
        
    def get_gestational_diabetes_urls(self) -> List[str]:
        """Get URLs for gestational diabetes recipe collections."""
        return [
            f"{self.base_url}/health/gestational-diabetes-recipes",
            f"{self.base_url}/nutrition/gestational-diabetes-diet",
            f"{self.base_url}/health/pregnancy/gestational-diabetes-meal-plan",
            f"{self.base_url}/nutrition/pregnancy-diabetes-recipes",
            f"{self.base_url}/health/gestational-diabetes-breakfast-ideas",
            f"{self.base_url}/nutrition/gestational-diabetes-snacks"
        ]