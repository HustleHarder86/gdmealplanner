#!/usr/bin/env python3
"""
Recipe enrichment module for adding seasonal tags, cuisine classification,
trimester suitability, and other metadata to enhance recipe discovery.
"""

import logging
from typing import Dict, List, Set, Optional
import re
from datetime import datetime
from collections import Counter

logger = logging.getLogger(__name__)

# Seasonal ingredients database
SEASONAL_INGREDIENTS = {
    'spring': [
        'asparagus', 'artichoke', 'peas', 'spring onions', 'radish',
        'strawberries', 'rhubarb', 'spinach', 'lettuce', 'arugula',
        'fennel', 'leeks', 'mint', 'parsley', 'dill'
    ],
    'summer': [
        'tomatoes', 'corn', 'zucchini', 'cucumber', 'bell peppers',
        'eggplant', 'berries', 'peaches', 'watermelon', 'melon',
        'basil', 'cilantro', 'green beans', 'okra', 'summer squash'
    ],
    'fall': [
        'pumpkin', 'butternut squash', 'acorn squash', 'sweet potato',
        'apples', 'pears', 'cranberries', 'brussels sprouts', 'cauliflower',
        'kale', 'swiss chard', 'pomegranate', 'persimmon', 'figs'
    ],
    'winter': [
        'cabbage', 'winter squash', 'root vegetables', 'carrots', 'parsnips',
        'turnips', 'beets', 'citrus', 'oranges', 'grapefruit', 'lemons',
        'collard greens', 'endive', 'radicchio', 'dates'
    ],
    'year_round': [
        'onions', 'garlic', 'potatoes', 'mushrooms', 'broccoli',
        'carrots', 'celery', 'bananas', 'avocados', 'nuts', 'seeds'
    ]
}

# Cuisine classification patterns
CUISINE_PATTERNS = {
    'mediterranean': {
        'ingredients': ['olive oil', 'feta', 'olives', 'oregano', 'basil', 
                       'tomatoes', 'garlic', 'lemon', 'yogurt', 'chickpeas',
                       'tahini', 'hummus', 'pita', 'couscous', 'bulgur'],
        'dishes': ['greek salad', 'tzatziki', 'tabbouleh', 'shakshuka', 'falafel']
    },
    'asian': {
        'ingredients': ['soy sauce', 'ginger', 'sesame', 'rice vinegar', 'miso',
                       'tofu', 'bok choy', 'noodles', 'rice', 'sriracha',
                       'fish sauce', 'coconut milk', 'curry', 'lemongrass'],
        'dishes': ['stir fry', 'pad thai', 'pho', 'curry', 'sushi', 'teriyaki']
    },
    'latin': {
        'ingredients': ['cilantro', 'lime', 'jalapeno', 'chili', 'cumin',
                       'black beans', 'corn', 'avocado', 'salsa', 'tortilla',
                       'queso', 'chorizo', 'plantain', 'mole', 'adobo'],
        'dishes': ['tacos', 'enchiladas', 'burrito', 'quesadilla', 'ceviche']
    },
    'indian': {
        'ingredients': ['curry', 'turmeric', 'cumin', 'coriander', 'garam masala',
                       'cardamom', 'naan', 'basmati rice', 'dal', 'paneer',
                       'ghee', 'chutney', 'tandoori', 'masala'],
        'dishes': ['curry', 'biryani', 'tikka masala', 'samosa', 'dosa']
    },
    'italian': {
        'ingredients': ['pasta', 'parmesan', 'mozzarella', 'basil', 'oregano',
                       'marinara', 'pesto', 'risotto', 'prosciutto', 'balsamic',
                       'ricotta', 'polenta', 'gnocchi'],
        'dishes': ['pasta', 'pizza', 'risotto', 'lasagna', 'caprese']
    },
    'american': {
        'ingredients': ['bbq sauce', 'ranch', 'cheddar', 'bacon', 'maple syrup',
                       'cornbread', 'coleslaw', 'buffalo sauce'],
        'dishes': ['burger', 'sandwich', 'mac and cheese', 'chili', 'meatloaf']
    },
    'middle_eastern': {
        'ingredients': ['tahini', 'sumac', 'zaatar', 'pomegranate', 'dates',
                       'pistachios', 'rose water', 'harissa', 'preserved lemon'],
        'dishes': ['shawarma', 'kebab', 'baba ganoush', 'fattoush']
    }
}

# Pregnancy trimester considerations
TRIMESTER_CONSIDERATIONS = {
    'first_trimester': {
        'avoid': ['raw fish', 'high mercury fish', 'excessive caffeine'],
        'beneficial': ['ginger', 'bland foods', 'small portions', 'crackers',
                      'citrus', 'vitamin b6 foods'],
        'tags': ['morning-sickness-friendly', 'gentle-stomach', 'small-portions']
    },
    'second_trimester': {
        'avoid': ['high mercury fish', 'raw eggs', 'unpasteurized cheese'],
        'beneficial': ['iron rich', 'calcium rich', 'protein', 'omega-3',
                      'whole grains', 'variety'],
        'tags': ['energy-boost', 'nutrient-dense', 'balanced']
    },
    'third_trimester': {
        'avoid': ['heavy meals', 'spicy foods', 'gas-producing foods'],
        'beneficial': ['small frequent meals', 'fiber', 'hydrating foods',
                      'easy to digest'],
        'tags': ['easy-digest', 'heartburn-friendly', 'light-meals']
    }
}

# Batch cooking and freezer-friendly indicators
BATCH_FRIENDLY_INDICATORS = [
    'casserole', 'soup', 'stew', 'chili', 'curry', 'lasagna',
    'meatballs', 'burrito', 'enchilada', 'sauce', 'marinade'
]

FREEZER_FRIENDLY_INDICATORS = [
    'freeze', 'frozen', 'make ahead', 'batch', 'meal prep',
    'freezer friendly', 'store frozen'
]


class RecipeEnricher:
    """Enrich recipes with additional metadata and classifications."""
    
    def __init__(self):
        self.enrichment_stats = {
            'total_enriched': 0,
            'seasonal_tags': 0,
            'cuisine_tags': 0,
            'trimester_tags': 0,
            'batch_tags': 0
        }
        
    def enrich_recipe(self, recipe: Dict) -> Dict:
        """
        Enrich a recipe with additional metadata.
        
        Args:
            recipe: Recipe dictionary to enrich
            
        Returns:
            Enriched recipe dictionary
        """
        # Make a copy to avoid modifying original
        enriched = recipe.copy()
        
        # Ensure tags list exists
        if 'tags' not in enriched:
            enriched['tags'] = []
            
        # Extract text for analysis
        ingredients_text = self._get_ingredients_text(enriched)
        title = enriched.get('title', '').lower()
        description = enriched.get('description', '').lower()
        instructions_text = ' '.join(enriched.get('instructions', [])).lower()
        
        # 1. Add seasonal tags
        seasonal_tags = self._classify_seasonal(ingredients_text)
        enriched['seasonalTags'] = seasonal_tags
        enriched['tags'].extend(seasonal_tags)
        if seasonal_tags:
            self.enrichment_stats['seasonal_tags'] += 1
            
        # 2. Add cuisine classification
        cuisine = self._classify_cuisine(ingredients_text, title, description)
        if cuisine:
            enriched['cuisine'] = cuisine
            enriched['tags'].append(f"cuisine-{cuisine}")
            self.enrichment_stats['cuisine_tags'] += 1
            
        # 3. Add pregnancy trimester suitability
        trimester_info = self._assess_trimester_suitability(ingredients_text, enriched)
        enriched['trimesterSuitability'] = trimester_info['suitable']
        enriched['tags'].extend(trimester_info['tags'])
        if trimester_info['tags']:
            self.enrichment_stats['trimester_tags'] += 1
            
        # 4. Add batch/freezer friendly flags
        is_batch_friendly = self._is_batch_friendly(title, instructions_text)
        is_freezer_friendly = self._is_freezer_friendly(title, instructions_text, description)
        
        enriched['batchFriendly'] = is_batch_friendly
        enriched['freezerFriendly'] = is_freezer_friendly
        
        if is_batch_friendly:
            enriched['tags'].append('batch-cooking')
            self.enrichment_stats['batch_tags'] += 1
        if is_freezer_friendly:
            enriched['tags'].append('freezer-friendly')
            
        # 5. Generate shopping list
        enriched['shoppingList'] = self._generate_shopping_list(enriched.get('ingredients', []))
        
        # 6. Add cooking method tags
        cooking_methods = self._extract_cooking_methods(instructions_text)
        enriched['cookingMethods'] = cooking_methods
        enriched['tags'].extend([f"method-{method}" for method in cooking_methods])
        
        # 7. Add meal prep time categories
        total_time = enriched.get('prepTime', 0) + enriched.get('cookTime', 0)
        time_category = self._categorize_prep_time(total_time)
        if time_category:
            enriched['timeCategory'] = time_category
            enriched['tags'].append(time_category)
            
        # 8. Add special diet indicators
        diet_tags = self._identify_special_diets(enriched)
        enriched['tags'].extend(diet_tags)
        
        # Remove duplicate tags
        enriched['tags'] = list(set(enriched['tags']))
        
        # Update stats
        self.enrichment_stats['total_enriched'] += 1
        
        return enriched
        
    def _get_ingredients_text(self, recipe: Dict) -> str:
        """Extract ingredients text for analysis."""
        ingredients = recipe.get('ingredients', [])
        if isinstance(ingredients, list):
            return ' '.join([
                ing.get('name', '') if isinstance(ing, dict) else str(ing)
                for ing in ingredients
            ]).lower()
        return ''
        
    def _classify_seasonal(self, ingredients_text: str) -> List[str]:
        """Classify recipe by seasonal ingredients."""
        seasonal_scores = Counter()
        
        for season, ingredients in SEASONAL_INGREDIENTS.items():
            if season == 'year_round':
                continue
            for ingredient in ingredients:
                if ingredient in ingredients_text:
                    seasonal_scores[season] += 1
                    
        # Get seasons with significant ingredients (at least 2)
        seasons = [season for season, count in seasonal_scores.items() if count >= 2]
        
        # If no strong seasonal indicators, check if mostly year-round
        if not seasons:
            year_round_count = sum(1 for ing in SEASONAL_INGREDIENTS['year_round'] 
                                 if ing in ingredients_text)
            if year_round_count >= 3:
                seasons = ['year-round']
                
        return seasons
        
    def _classify_cuisine(self, ingredients_text: str, title: str, description: str) -> Optional[str]:
        """Classify recipe cuisine based on ingredients and dish names."""
        cuisine_scores = Counter()
        combined_text = f"{ingredients_text} {title} {description}"
        
        for cuisine, patterns in CUISINE_PATTERNS.items():
            # Check ingredients
            for ingredient in patterns['ingredients']:
                if ingredient in combined_text:
                    cuisine_scores[cuisine] += 1
                    
            # Check dish names (weighted more heavily)
            for dish in patterns['dishes']:
                if dish in combined_text:
                    cuisine_scores[cuisine] += 3
                    
        # Return cuisine with highest score if significant
        if cuisine_scores:
            top_cuisine, score = cuisine_scores.most_common(1)[0]
            if score >= 3:  # Minimum threshold
                return top_cuisine
                
        return None
        
    def _assess_trimester_suitability(self, ingredients_text: str, recipe: Dict) -> Dict:
        """Assess recipe suitability for different pregnancy trimesters."""
        suitable_trimesters = []
        tags = []
        
        for trimester, considerations in TRIMESTER_CONSIDERATIONS.items():
            # Check for ingredients to avoid
            has_avoid = any(avoid in ingredients_text for avoid in considerations['avoid'])
            
            # Check for beneficial ingredients
            beneficial_count = sum(1 for beneficial in considerations['beneficial'] 
                                 if beneficial in ingredients_text)
            
            # Assess suitability
            if not has_avoid and beneficial_count >= 2:
                suitable_trimesters.append(trimester)
                tags.extend(considerations['tags'][:1])  # Add primary tag
                
        # If suitable for all trimesters
        if len(suitable_trimesters) == 3:
            tags = ['pregnancy-friendly']
            
        return {
            'suitable': suitable_trimesters,
            'tags': list(set(tags))
        }
        
    def _is_batch_friendly(self, title: str, instructions: str) -> bool:
        """Determine if recipe is suitable for batch cooking."""
        combined_text = f"{title} {instructions}"
        
        # Check for batch-friendly dish types
        for indicator in BATCH_FRIENDLY_INDICATORS:
            if indicator in combined_text:
                return True
                
        # Check for batch cooking mentions
        batch_patterns = ['double.*recipe', 'make.*batch', 'serves 8', 'serves 10', 
                         'serves 12', 'large batch']
        return any(re.search(pattern, combined_text) for pattern in batch_patterns)
        
    def _is_freezer_friendly(self, title: str, instructions: str, description: str) -> bool:
        """Determine if recipe is freezer-friendly."""
        combined_text = f"{title} {instructions} {description}"
        
        return any(indicator in combined_text for indicator in FREEZER_FRIENDLY_INDICATORS)
        
    def _generate_shopping_list(self, ingredients: List[Dict]) -> Dict[str, List[Dict]]:
        """Generate organized shopping list from ingredients."""
        shopping_list = {
            'proteins': [],
            'produce': [],
            'grains': [],
            'dairy': [],
            'pantry': [],
            'other': []
        }
        
        # Categories for classification
        protein_keywords = ['chicken', 'beef', 'pork', 'fish', 'tofu', 'beans', 'eggs']
        produce_keywords = ['vegetable', 'fruit'] + SEASONAL_INGREDIENTS['year_round']
        grain_keywords = ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa']
        dairy_keywords = ['milk', 'cheese', 'yogurt', 'butter', 'cream']
        
        for ingredient in ingredients:
            ing_name = ingredient.get('name', '').lower()
            ing_data = {
                'name': ingredient.get('name', ''),
                'amount': ingredient.get('amount', 0),
                'unit': ingredient.get('unit', '')
            }
            
            # Categorize ingredient
            if any(keyword in ing_name for keyword in protein_keywords):
                shopping_list['proteins'].append(ing_data)
            elif any(keyword in ing_name for keyword in produce_keywords):
                shopping_list['produce'].append(ing_data)
            elif any(keyword in ing_name for keyword in grain_keywords):
                shopping_list['grains'].append(ing_data)
            elif any(keyword in ing_name for keyword in dairy_keywords):
                shopping_list['dairy'].append(ing_data)
            elif any(keyword in ing_name for keyword in ['oil', 'vinegar', 'sauce', 'spice']):
                shopping_list['pantry'].append(ing_data)
            else:
                shopping_list['other'].append(ing_data)
                
        # Remove empty categories
        return {k: v for k, v in shopping_list.items() if v}
        
    def _extract_cooking_methods(self, instructions: str) -> List[str]:
        """Extract cooking methods from instructions."""
        methods = []
        
        cooking_verbs = {
            'bake': 'baking',
            'roast': 'roasting',
            'grill': 'grilling',
            'saute': 'sauteing',
            'steam': 'steaming',
            'boil': 'boiling',
            'simmer': 'simmering',
            'stir fry': 'stir-frying',
            'slow cook': 'slow-cooking',
            'pressure cook': 'pressure-cooking',
            'air fry': 'air-frying'
        }
        
        for verb, method in cooking_verbs.items():
            if verb in instructions:
                methods.append(method)
                
        return methods[:3]  # Limit to top 3 methods
        
    def _categorize_prep_time(self, total_time: int) -> Optional[str]:
        """Categorize recipe by total prep time."""
        if total_time <= 15:
            return '15-min-meals'
        elif total_time <= 30:
            return '30-min-meals'
        elif total_time <= 45:
            return 'quick-meals'
        elif total_time >= 120:
            return 'slow-cooking'
        return None
        
    def _identify_special_diets(self, recipe: Dict) -> List[str]:
        """Identify special diet compatibility beyond basic tags."""
        diet_tags = []
        ingredients_text = self._get_ingredients_text(recipe)
        existing_tags = recipe.get('tags', [])
        
        # Keto-friendly (very low carb, high fat)
        nutrition = recipe.get('nutrition', {})
        if nutrition.get('carbs', 999) < 10 and nutrition.get('fat', 0) > 15:
            diet_tags.append('keto-friendly')
            
        # Paleo-friendly
        grain_keywords = ['wheat', 'bread', 'pasta', 'rice', 'oats']
        dairy_keywords = ['milk', 'cheese', 'yogurt']
        if not any(keyword in ingredients_text for keyword in grain_keywords + dairy_keywords):
            if 'vegetarian' not in existing_tags:  # Paleo includes meat
                diet_tags.append('paleo-friendly')
                
        # Whole30 compatible
        prohibited = ['sugar', 'honey', 'maple', 'dairy', 'grain', 'legume', 'alcohol']
        if not any(item in ingredients_text for item in prohibited):
            diet_tags.append('whole30-compatible')
            
        return diet_tags
        
    def enrich_batch(self, recipes: List[Dict]) -> List[Dict]:
        """Enrich a batch of recipes."""
        return [self.enrich_recipe(recipe) for recipe in recipes]
        
    def get_enrichment_report(self) -> Dict:
        """Get enrichment statistics report."""
        stats = self.enrichment_stats.copy()
        if stats['total_enriched'] > 0:
            for key in ['seasonal_tags', 'cuisine_tags', 'trimester_tags', 'batch_tags']:
                stats[f'{key}_rate'] = (stats[key] / stats['total_enriched']) * 100
        return stats