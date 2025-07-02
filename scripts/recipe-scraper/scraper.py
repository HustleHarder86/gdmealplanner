#!/usr/bin/env python3
"""
Recipe Scraper for Diabetes Food Hub
Scrapes GD-friendly recipes with images
"""

import json
import os
import time
import re
from datetime import datetime
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import hashlib

class DiabetesFoodHubScraper:
    def __init__(self):
        self.base_url = "https://diabetesfoodhub.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.output_dir = "output"
        self.images_dir = os.path.join(self.output_dir, "images")
        self.max_total_time = 45  # minutes
        
        # Create output directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.images_dir, exist_ok=True)
        
    def scrape_recipe_urls(self, category: str, max_recipes: int = 15) -> List[str]:
        """Get recipe URLs from category page"""
        urls = []
        page = 1
        
        while len(urls) < max_recipes:
            category_url = f"{self.base_url}/recipes?meal-type={category}&page={page}"
            print(f"Fetching {category} recipes from page {page}...")
            
            try:
                response = self.session.get(category_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find recipe links
                recipe_cards = soup.find_all('div', class_='recipe-card')
                if not recipe_cards:
                    recipe_cards = soup.find_all('article', class_='recipe-item')
                
                for card in recipe_cards:
                    link = card.find('a')
                    if link and link.get('href'):
                        url = urljoin(self.base_url, link['href'])
                        urls.append(url)
                        if len(urls) >= max_recipes:
                            break
                
                if not recipe_cards:
                    break
                    
                page += 1
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                print(f"Error fetching category page: {e}")
                break
                
        return urls[:max_recipes]
    
    def parse_recipe(self, url: str) -> Optional[Dict]:
        """Parse individual recipe page"""
        try:
            print(f"Parsing recipe: {url}")
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract recipe data
            recipe = {
                'url': url,
                'scraped_at': datetime.now().isoformat(),
                'source': 'diabetesfoodhub.org'
            }
            
            # Title
            title_elem = soup.find('h1', class_='recipe-title') or soup.find('h1')
            recipe['title'] = title_elem.text.strip() if title_elem else 'Unknown Recipe'
            
            # Description
            desc_elem = soup.find('div', class_='recipe-description') or soup.find('p', class_='intro')
            recipe['description'] = desc_elem.text.strip() if desc_elem else ''
            
            # Times
            prep_time = self._extract_time(soup, 'prep')
            cook_time = self._extract_time(soup, 'cook')
            total_time = prep_time + cook_time
            
            # Skip if total time > 45 minutes
            if total_time > self.max_total_time:
                print(f"Skipping {recipe['title']} - Total time: {total_time} minutes")
                return None
                
            recipe['prepTime'] = prep_time
            recipe['cookTime'] = cook_time
            recipe['totalTime'] = total_time
            
            # Servings
            servings_elem = soup.find('span', class_='servings') or soup.find(text=re.compile(r'servings?', re.I))
            if servings_elem:
                servings_match = re.search(r'(\d+)', str(servings_elem))
                recipe['servings'] = int(servings_match.group(1)) if servings_match else 4
            else:
                recipe['servings'] = 4
            
            # Ingredients
            ingredients = []
            ingredients_section = soup.find('div', class_='ingredients') or soup.find('ul', class_='ingredients-list')
            if ingredients_section:
                for li in ingredients_section.find_all('li'):
                    ingredient_text = li.text.strip()
                    if ingredient_text:
                        parsed = self._parse_ingredient(ingredient_text)
                        ingredients.append(parsed)
            recipe['ingredients'] = ingredients
            
            # Instructions
            instructions = []
            instructions_section = soup.find('div', class_='directions') or soup.find('ol', class_='instructions')
            if instructions_section:
                for step in instructions_section.find_all(['li', 'p']):
                    instruction_text = step.text.strip()
                    if instruction_text and len(instruction_text) > 5:
                        instructions.append(instruction_text)
            recipe['instructions'] = instructions
            
            # Nutrition
            nutrition = self._extract_nutrition(soup)
            recipe['nutrition'] = nutrition
            
            # Skip if doesn't meet GD requirements
            if not self._validate_gd_nutrition(nutrition, recipe.get('category', 'meal')):
                print(f"Skipping {recipe['title']} - Nutrition doesn't meet GD requirements")
                return None
            
            # Tags
            tags = []
            tags_elem = soup.find_all('span', class_='tag') or soup.find_all('a', class_='recipe-tag')
            for tag in tags_elem:
                tags.append(tag.text.strip().lower())
            
            # Add time-based tags
            if total_time <= 20:
                tags.append('quick')
            if total_time <= 30:
                tags.append('30-minutes-or-less')
            
            recipe['tags'] = list(set(tags))
            
            # Image
            image_elem = soup.find('img', class_='recipe-image') or soup.find('img', {'alt': re.compile(recipe['title'][:10], re.I)})
            if image_elem and image_elem.get('src'):
                image_url = urljoin(self.base_url, image_elem['src'])
                local_image = self._download_image(image_url, recipe['title'])
                recipe['image'] = local_image
                recipe['originalImage'] = image_url
            
            return recipe
            
        except Exception as e:
            print(f"Error parsing recipe {url}: {e}")
            return None
    
    def _extract_time(self, soup: BeautifulSoup, time_type: str) -> int:
        """Extract prep or cook time in minutes"""
        patterns = [
            rf'{time_type}.*?(\d+)\s*(?:hours?|hrs?|h)',
            rf'{time_type}.*?(\d+)\s*(?:minutes?|mins?|m)',
            rf'(\d+)\s*(?:minutes?|mins?|m).*?{time_type}'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, str(soup), re.I)
            if match:
                time_value = int(match.group(1))
                if 'hour' in match.group(0).lower():
                    return time_value * 60
                return time_value
        
        return 0
    
    def _parse_ingredient(self, text: str) -> Dict:
        """Parse ingredient text into structured format"""
        # Simple regex patterns for common formats
        patterns = [
            r'^([\d\/\s]+)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l)\s+(.+)$',
            r'^([\d\/\s]+)\s+(.+)$',
            r'^(.+)$'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, text.strip(), re.I)
            if match:
                if len(match.groups()) == 3:
                    return {
                        'amount': match.group(1).strip(),
                        'unit': match.group(2).strip(),
                        'item': match.group(3).strip()
                    }
                elif len(match.groups()) == 2:
                    return {
                        'amount': match.group(1).strip(),
                        'unit': '',
                        'item': match.group(2).strip()
                    }
                else:
                    return {
                        'amount': '',
                        'unit': '',
                        'item': match.group(1).strip()
                    }
        
        return {'amount': '', 'unit': '', 'item': text}
    
    def _extract_nutrition(self, soup: BeautifulSoup) -> Dict:
        """Extract nutrition information"""
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
        
        # Look for nutrition table or list
        nutrition_section = soup.find('div', class_='nutrition') or soup.find('table', class_='nutrition-table')
        
        if nutrition_section:
            text = nutrition_section.text.lower()
            
            # Extract values using regex
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
                match = re.search(pattern, text)
                if match:
                    nutrition[key] = int(match.group(1))
        
        return nutrition
    
    def _validate_gd_nutrition(self, nutrition: Dict, category: str) -> bool:
        """Validate if recipe meets GD nutritional requirements"""
        carbs = nutrition.get('carbs', 0)
        fiber = nutrition.get('fiber', 0)
        
        # Skip if no carb data
        if carbs == 0:
            return False
        
        # Check carb ranges
        if category == 'snack':
            if carbs < 10 or carbs > 25:
                return False
        else:  # meals
            if carbs < 25 or carbs > 50:
                return False
        
        # Minimum fiber (at least 2g for snacks, 3g for meals)
        min_fiber = 2 if category == 'snack' else 3
        if fiber < min_fiber:
            return False
        
        return True
    
    def _download_image(self, url: str, recipe_title: str) -> str:
        """Download and save recipe image"""
        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()
            
            # Generate filename from recipe title
            safe_title = re.sub(r'[^\w\s-]', '', recipe_title.lower())
            safe_title = re.sub(r'[-\s]+', '-', safe_title)[:50]
            
            # Get file extension
            ext = os.path.splitext(urlparse(url).path)[1] or '.jpg'
            filename = f"{safe_title}{ext}"
            filepath = os.path.join(self.images_dir, filename)
            
            # Save image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            
            print(f"Downloaded image: {filename}")
            return f"images/{filename}"
            
        except Exception as e:
            print(f"Error downloading image: {e}")
            return ""
    
    def scrape_all_recipes(self):
        """Main method to scrape all recipes"""
        categories = {
            'breakfast': 15,
            'lunch': 15,
            'dinner': 15,
            'snacks': 5
        }
        
        all_recipes = []
        
        for category, count in categories.items():
            print(f"\n{'='*50}")
            print(f"Scraping {category} recipes...")
            print(f"{'='*50}")
            
            # Get recipe URLs
            urls = self.scrape_recipe_urls(category, count * 2)  # Get extra in case some fail
            
            category_recipes = []
            for url in urls:
                if len(category_recipes) >= count:
                    break
                    
                recipe = self.parse_recipe(url)
                if recipe:
                    recipe['category'] = category
                    category_recipes.append(recipe)
                    print(f"✓ Scraped: {recipe['title']}")
                
                time.sleep(2)  # Rate limiting
            
            all_recipes.extend(category_recipes)
            print(f"Completed {category}: {len(category_recipes)} recipes")
        
        # Save to JSON
        output_file = os.path.join(self.output_dir, 'recipes.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_recipes, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*50}")
        print(f"Scraping complete! Total recipes: {len(all_recipes)}")
        print(f"Saved to: {output_file}")
        
        # Create category files
        for category in categories.keys():
            category_recipes = [r for r in all_recipes if r['category'] == category]
            category_file = os.path.join(self.output_dir, f'{category}.json')
            with open(category_file, 'w', encoding='utf-8') as f:
                json.dump(category_recipes, f, indent=2, ensure_ascii=False)
            print(f"Created {category_file}: {len(category_recipes)} recipes")
        
        return all_recipes

if __name__ == "__main__":
    scraper = DiabetesFoodHubScraper()
    scraper.scrape_all_recipes()