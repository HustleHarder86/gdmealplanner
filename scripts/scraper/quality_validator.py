#!/usr/bin/env python3
"""
Enhanced quality validation for gestational diabetes recipes.
Validates nutritional requirements, estimates glycemic index, and ensures recipe quality.
"""

import logging
from typing import Dict, List, Tuple, Optional
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# Gestational Diabetes Guidelines
GD_GUIDELINES = {
    'snacks': {
        'min_carbs': 15,
        'max_carbs': 30,
        'min_fiber': 3,
        'min_protein': 5,  # Helps stabilize blood sugar
    },
    'meals': {
        'min_carbs': 30,
        'max_carbs': 45,
        'min_fiber': 5,
        'min_protein': 15,
    },
    'general': {
        'max_prep_time': 45,  # minutes
        'max_sugar_ratio': 0.4,  # sugar should be < 40% of total carbs
        'min_fiber_carb_ratio': 0.1,  # fiber should be > 10% of carbs
        'max_saturated_fat_ratio': 0.3,  # saturated fat < 30% of total fat
    }
}

# Glycemic Index Database (simplified)
GI_DATABASE = {
    # Low GI (< 55)
    'low': [
        'quinoa', 'steel cut oats', 'rolled oats', 'barley', 'bulgur',
        'sweet potato', 'yam', 'most vegetables', 'beans', 'lentils',
        'chickpeas', 'black beans', 'kidney beans', 'whole grain bread',
        'whole wheat pasta', 'brown rice', 'wild rice', 'nuts', 'seeds',
        'greek yogurt', 'plain yogurt', 'milk', 'cheese', 'eggs',
        'chicken', 'fish', 'turkey', 'lean beef', 'tofu', 'tempeh',
        'apples', 'pears', 'berries', 'citrus', 'stone fruits'
    ],
    # Medium GI (55-69)
    'medium': [
        'whole wheat bread', 'pita bread', 'couscous', 'basmati rice',
        'sweet corn', 'raisins', 'bananas', 'grapes', 'mango',
        'whole grain crackers', 'popcorn', 'honey', 'maple syrup'
    ],
    # High GI (> 70)
    'high': [
        'white bread', 'white rice', 'instant rice', 'rice cakes',
        'corn flakes', 'instant oatmeal', 'white potato', 'french fries',
        'pretzels', 'crackers', 'watermelon', 'white pasta', 'bagels',
        'sugar', 'candy', 'soda', 'juice', 'sports drinks'
    ]
}

# Common ingredients database
COMMON_INGREDIENTS = {
    'proteins': [
        'chicken', 'turkey', 'beef', 'pork', 'fish', 'salmon', 'tuna',
        'eggs', 'tofu', 'tempeh', 'beans', 'lentils', 'chickpeas',
        'greek yogurt', 'cottage cheese', 'nuts', 'seeds'
    ],
    'whole_grains': [
        'quinoa', 'brown rice', 'wild rice', 'oats', 'barley', 'bulgur',
        'whole wheat flour', 'whole grain bread', 'whole wheat pasta'
    ],
    'vegetables': [
        'spinach', 'kale', 'lettuce', 'broccoli', 'cauliflower', 'carrots',
        'bell peppers', 'tomatoes', 'cucumber', 'zucchini', 'onions',
        'garlic', 'mushrooms', 'green beans', 'asparagus', 'brussels sprouts'
    ],
    'healthy_fats': [
        'olive oil', 'avocado', 'nuts', 'seeds', 'nut butter', 'tahini',
        'coconut oil', 'flaxseed', 'chia seeds', 'salmon', 'sardines'
    ],
    'seasonings': [
        'salt', 'pepper', 'herbs', 'spices', 'lemon', 'lime', 'vinegar',
        'mustard', 'hot sauce', 'soy sauce', 'ginger', 'turmeric'
    ]
}


class RecipeQualityValidator:
    """Comprehensive recipe quality validator for gestational diabetes."""
    
    def __init__(self):
        self.validation_stats = {
            'total_validated': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
        
    def validate_recipe(self, recipe: Dict) -> Tuple[bool, List[str], List[str]]:
        """
        Validate a recipe for GD suitability.
        
        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Determine meal type
        meal_type = self._determine_meal_type(recipe)
        guidelines = GD_GUIDELINES.get(meal_type, GD_GUIDELINES['meals'])
        
        # 1. Validate required fields
        field_errors = self._validate_required_fields(recipe)
        errors.extend(field_errors)
        
        # 2. Validate nutrition
        nutrition_errors, nutrition_warnings = self._validate_nutrition(
            recipe.get('nutrition', {}), 
            guidelines
        )
        errors.extend(nutrition_errors)
        warnings.extend(nutrition_warnings)
        
        # 3. Validate prep time
        prep_time = recipe.get('prepTime', 0) + recipe.get('cookTime', 0)
        if prep_time > GD_GUIDELINES['general']['max_prep_time']:
            warnings.append(f"Total time ({prep_time} min) exceeds recommended {GD_GUIDELINES['general']['max_prep_time']} min")
            
        # 4. Validate ingredients
        ingredient_warnings = self._validate_ingredients(recipe.get('ingredients', []))
        warnings.extend(ingredient_warnings)
        
        # 5. Estimate and validate glycemic index
        gi = self._estimate_glycemic_index(recipe)
        if gi == 'high':
            errors.append("Estimated glycemic index is high")
        elif gi == 'unknown':
            warnings.append("Unable to estimate glycemic index")
            
        # 6. Check for common allergens (warning only)
        allergens = self._check_allergens(recipe.get('ingredients', []))
        if allergens:
            warnings.append(f"Contains common allergens: {', '.join(allergens)}")
            
        # Update stats
        self.validation_stats['total_validated'] += 1
        if not errors:
            self.validation_stats['passed'] += 1
        else:
            self.validation_stats['failed'] += 1
        if warnings:
            self.validation_stats['warnings'] += 1
            
        return len(errors) == 0, errors, warnings
        
    def _determine_meal_type(self, recipe: Dict) -> str:
        """Determine if recipe is a snack or meal based on calories and tags."""
        nutrition = recipe.get('nutrition', {})
        calories = nutrition.get('calories', 0)
        tags = recipe.get('tags', [])
        
        # Check tags first
        if 'snack' in tags or 'appetizer' in tags:
            return 'snacks'
        elif any(tag in tags for tag in ['breakfast', 'lunch', 'dinner', 'main']):
            return 'meals'
            
        # Check by calories
        if 0 < calories <= 200:
            return 'snacks'
        else:
            return 'meals'
            
    def _validate_required_fields(self, recipe: Dict) -> List[str]:
        """Validate that all required fields are present."""
        errors = []
        required_fields = ['title', 'ingredients', 'instructions', 'nutrition']
        
        for field in required_fields:
            if not recipe.get(field):
                errors.append(f"Missing required field: {field}")
                
        # Check minimum content
        if recipe.get('ingredients') and len(recipe['ingredients']) < 3:
            errors.append("Recipe has too few ingredients (minimum 3)")
            
        if recipe.get('instructions') and len(recipe['instructions']) < 1:
            errors.append("Recipe has no instructions")
            
        return errors
        
    def _validate_nutrition(self, nutrition: Dict, guidelines: Dict) -> Tuple[List[str], List[str]]:
        """Validate nutritional content against GD guidelines."""
        errors = []
        warnings = []
        
        # Check carbohydrates
        carbs = nutrition.get('carbs', 0)
        if carbs < guidelines['min_carbs']:
            errors.append(f"Carbs too low: {carbs}g (minimum {guidelines['min_carbs']}g)")
        elif carbs > guidelines['max_carbs']:
            errors.append(f"Carbs too high: {carbs}g (maximum {guidelines['max_carbs']}g)")
            
        # Check fiber
        fiber = nutrition.get('fiber', 0)
        if fiber < guidelines['min_fiber']:
            errors.append(f"Fiber too low: {fiber}g (minimum {guidelines['min_fiber']}g)")
            
        # Check protein
        protein = nutrition.get('protein', 0)
        if protein < guidelines['min_protein']:
            warnings.append(f"Protein low: {protein}g (recommended minimum {guidelines['min_protein']}g)")
            
        # Check sugar ratio
        sugar = nutrition.get('sugar', 0)
        if carbs > 0:
            sugar_ratio = sugar / carbs
            if sugar_ratio > GD_GUIDELINES['general']['max_sugar_ratio']:
                warnings.append(f"High sugar content: {sugar}g ({sugar_ratio*100:.0f}% of carbs)")
                
        # Check fiber to carb ratio
        if carbs > 0:
            fiber_ratio = fiber / carbs
            if fiber_ratio < GD_GUIDELINES['general']['min_fiber_carb_ratio']:
                warnings.append(f"Low fiber to carb ratio: {fiber_ratio*100:.0f}%")
                
        # Check saturated fat
        total_fat = nutrition.get('fat', 0)
        sat_fat = nutrition.get('saturatedFat', 0)
        if total_fat > 0 and sat_fat > 0:
            sat_fat_ratio = sat_fat / total_fat
            if sat_fat_ratio > GD_GUIDELINES['general']['max_saturated_fat_ratio']:
                warnings.append(f"High saturated fat: {sat_fat}g ({sat_fat_ratio*100:.0f}% of total fat)")
                
        # Check sodium (general health)
        sodium = nutrition.get('sodium', 0)
        if sodium > 600:
            warnings.append(f"High sodium: {sodium}mg")
            
        return errors, warnings
        
    def _validate_ingredients(self, ingredients: List[Dict]) -> List[str]:
        """Validate ingredient availability and quality."""
        warnings = []
        
        if not ingredients:
            return ["No ingredients found"]
            
        # Check for uncommon ingredients
        ingredient_names = [ing.get('name', '').lower() for ing in ingredients]
        uncommon = []
        
        # Flatten common ingredients
        all_common = []
        for category in COMMON_INGREDIENTS.values():
            all_common.extend(category)
            
        for ing_name in ingredient_names:
            # Check if any common ingredient is mentioned in the ingredient name
            is_common = any(common in ing_name for common in all_common)
            if not is_common and len(ing_name) > 3:  # Skip very short words
                uncommon.append(ing_name)
                
        if len(uncommon) > 3:
            warnings.append(f"Many uncommon ingredients: {', '.join(uncommon[:3])}...")
            
        return warnings
        
    def _estimate_glycemic_index(self, recipe: Dict) -> str:
        """
        Estimate glycemic index based on ingredients and preparation method.
        Returns: 'low', 'medium', 'high', or 'unknown'
        """
        ingredients = recipe.get('ingredients', [])
        if not ingredients:
            return 'unknown'
            
        # Combine all ingredient names
        ingredient_text = ' '.join([ing.get('name', '').lower() for ing in ingredients])
        
        # Count GI indicators
        low_count = sum(1 for item in GI_DATABASE['low'] if item in ingredient_text)
        medium_count = sum(1 for item in GI_DATABASE['medium'] if item in ingredient_text)
        high_count = sum(1 for item in GI_DATABASE['high'] if item in ingredient_text)
        
        # Check preparation methods that affect GI
        instructions_text = ' '.join(recipe.get('instructions', [])).lower()
        
        # Raw vegetables lower GI
        if 'raw' in instructions_text or 'fresh' in instructions_text:
            low_count += 1
            
        # Deep frying increases GI
        if 'deep fry' in instructions_text or 'fried' in instructions_text:
            high_count += 1
            
        # Determine overall GI
        total = low_count + medium_count + high_count
        if total == 0:
            return 'unknown'
            
        # Weight the scores
        score = (low_count * 1 + medium_count * 2 + high_count * 3) / total
        
        if score <= 1.5:
            return 'low'
        elif score <= 2.5:
            return 'medium'
        else:
            return 'high'
            
    def _check_allergens(self, ingredients: List[Dict]) -> List[str]:
        """Check for common allergens in ingredients."""
        common_allergens = {
            'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey'],
            'eggs': ['egg', 'eggs'],
            'nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'nut'],
            'peanuts': ['peanut'],
            'soy': ['soy', 'tofu', 'tempeh', 'edamame'],
            'wheat': ['wheat', 'flour', 'bread', 'pasta'],
            'shellfish': ['shrimp', 'crab', 'lobster', 'scallop'],
            'fish': ['salmon', 'tuna', 'cod', 'tilapia', 'fish']
        }
        
        found_allergens = []
        ingredient_text = ' '.join([ing.get('name', '').lower() for ing in ingredients])
        
        for allergen, keywords in common_allergens.items():
            if any(keyword in ingredient_text for keyword in keywords):
                found_allergens.append(allergen)
                
        return found_allergens
        
    def get_validation_report(self) -> Dict:
        """Get a report of validation statistics."""
        stats = self.validation_stats.copy()
        if stats['total_validated'] > 0:
            stats['pass_rate'] = (stats['passed'] / stats['total_validated']) * 100
            stats['warning_rate'] = (stats['warnings'] / stats['total_validated']) * 100
        else:
            stats['pass_rate'] = 0
            stats['warning_rate'] = 0
            
        return stats
        
    def validate_batch(self, recipes: List[Dict]) -> Dict[str, Dict]:
        """Validate a batch of recipes and return results."""
        results = {}
        
        for recipe in recipes:
            recipe_id = recipe.get('title', 'Unknown')
            is_valid, errors, warnings = self.validate_recipe(recipe)
            
            results[recipe_id] = {
                'valid': is_valid,
                'errors': errors,
                'warnings': warnings,
                'timestamp': datetime.now().isoformat()
            }
            
        return results