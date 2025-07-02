#!/usr/bin/env python3
"""
Diversity tracking system to ensure cultural variety and balanced recipe collection.
Tracks progress towards collection goals and identifies gaps.
"""

import logging
from typing import Dict, List, Set, Tuple
from collections import defaultdict, Counter
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Collection targets
COLLECTION_TARGETS = {
    'total': 360,
    'by_meal_type': {
        'breakfast': 90,
        'lunch': 90,
        'dinner': 90,
        'snacks': 90
    },
    'by_cuisine': {
        'mediterranean': 60,
        'asian': 60,
        'latin': 50,
        'indian': 40,
        'italian': 40,
        'american': 40,
        'middle_eastern': 30,
        'other': 40
    },
    'by_season': {
        'spring': 90,
        'summer': 90,
        'fall': 90,
        'winter': 90,
        'year-round': 180  # Can be enjoyed any season
    },
    'by_prep_time': {
        '15-min-meals': 60,
        '30-min-meals': 120,
        'quick-meals': 120,  # 31-45 minutes
        'slow-cooking': 60   # >45 minutes
    },
    'by_special_diet': {
        'vegetarian': 80,
        'vegan': 40,
        'gluten-free': 60,
        'dairy-free': 60,
        'keto-friendly': 20,
        'paleo-friendly': 20
    }
}

# Minimum diversity requirements
DIVERSITY_REQUIREMENTS = {
    'min_cuisines_per_meal_type': 4,  # Each meal type should have at least 4 cuisines
    'min_seasonal_per_meal_type': 3,  # Each meal type should have at least 3 seasons
    'max_similar_recipes': 5,  # Max recipes with very similar ingredients
    'min_protein_variety': 10,  # Minimum different protein sources
    'min_grain_variety': 8,  # Minimum different grain sources
}


class DiversityTracker:
    """Track and analyze recipe collection diversity."""
    
    def __init__(self, save_path: str = "diversity_report.json"):
        self.save_path = save_path
        self.recipes = []
        self.stats = self._initialize_stats()
        self.warnings = []
        
    def _initialize_stats(self) -> Dict:
        """Initialize tracking statistics."""
        return {
            'total_count': 0,
            'by_meal_type': defaultdict(int),
            'by_cuisine': defaultdict(int),
            'by_season': defaultdict(int),
            'by_prep_time': defaultdict(int),
            'by_special_diet': defaultdict(int),
            'by_source': defaultdict(int),
            'cuisine_meal_matrix': defaultdict(lambda: defaultdict(int)),
            'seasonal_meal_matrix': defaultdict(lambda: defaultdict(int)),
            'protein_sources': Counter(),
            'grain_sources': Counter(),
            'unique_ingredients': set(),
            'recipe_signatures': set(),  # For duplicate detection
            'collection_date': datetime.now().isoformat()
        }
        
    def add_recipe(self, recipe: Dict) -> Tuple[bool, List[str]]:
        """
        Add a recipe to the tracker and check diversity requirements.
        
        Returns:
            Tuple of (should_add, reasons)
        """
        should_add = True
        reasons = []
        
        # Extract recipe characteristics
        meal_type = self._get_meal_type(recipe)
        cuisine = recipe.get('cuisine', 'other')
        seasons = recipe.get('seasonalTags', [])
        prep_time = recipe.get('timeCategory', 'quick-meals')
        tags = recipe.get('tags', [])
        
        # Check if we've hit targets
        if self.stats['by_meal_type'][meal_type] >= COLLECTION_TARGETS['by_meal_type'].get(meal_type, 90):
            should_add = False
            reasons.append(f"Already have enough {meal_type} recipes")
            
        if cuisine and self.stats['by_cuisine'][cuisine] >= COLLECTION_TARGETS['by_cuisine'].get(cuisine, 40):
            should_add = False
            reasons.append(f"Already have enough {cuisine} cuisine recipes")
            
        # Check for diversity within meal type
        if meal_type:
            cuisine_count = len([c for c, count in self.stats['cuisine_meal_matrix'][meal_type].items() if count > 0])
            if cuisine_count < DIVERSITY_REQUIREMENTS['min_cuisines_per_meal_type'] and cuisine in self.stats['cuisine_meal_matrix'][meal_type]:
                reasons.append(f"Need more cuisine diversity in {meal_type}")
                
        # If we should add, update stats
        if should_add:
            self._update_stats(recipe, meal_type, cuisine, seasons, prep_time, tags)
            self.recipes.append({
                'title': recipe.get('title'),
                'meal_type': meal_type,
                'cuisine': cuisine,
                'seasons': seasons,
                'added_at': datetime.now().isoformat()
            })
            
        return should_add, reasons
        
    def _get_meal_type(self, recipe: Dict) -> str:
        """Determine meal type from recipe tags and metadata."""
        tags = recipe.get('tags', [])
        title = recipe.get('title', '').lower()
        
        for meal in ['breakfast', 'lunch', 'dinner', 'snacks']:
            if meal in tags or meal in title:
                return meal
                
        # Default based on calories
        calories = recipe.get('nutrition', {}).get('calories', 0)
        if calories < 200:
            return 'snacks'
        elif 'morning' in title or 'pancake' in title or 'muffin' in title:
            return 'breakfast'
        else:
            return 'dinner'  # Default to dinner
            
    def _update_stats(self, recipe: Dict, meal_type: str, cuisine: str, 
                     seasons: List[str], prep_time: str, tags: List[str]):
        """Update tracking statistics with new recipe."""
        self.stats['total_count'] += 1
        self.stats['by_meal_type'][meal_type] += 1
        
        if cuisine:
            self.stats['by_cuisine'][cuisine] += 1
            self.stats['cuisine_meal_matrix'][meal_type][cuisine] += 1
            
        for season in seasons:
            self.stats['by_season'][season] += 1
            self.stats['seasonal_meal_matrix'][meal_type][season] += 1
            
        if prep_time:
            self.stats['by_prep_time'][prep_time] += 1
            
        # Track special diets
        diet_tags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
                    'keto-friendly', 'paleo-friendly']
        for diet in diet_tags:
            if diet in tags:
                self.stats['by_special_diet'][diet] += 1
                
        # Track source
        source = recipe.get('sourceSite', 'unknown')
        self.stats['by_source'][source] += 1
        
        # Track protein and grain diversity
        self._track_ingredient_diversity(recipe)
        
        # Create recipe signature for duplicate detection
        signature = self._create_recipe_signature(recipe)
        self.stats['recipe_signatures'].add(signature)
        
    def _track_ingredient_diversity(self, recipe: Dict):
        """Track diversity of protein and grain sources."""
        ingredients = recipe.get('ingredients', [])
        ingredients_text = ' '.join([
            ing.get('name', '') if isinstance(ing, dict) else str(ing)
            for ing in ingredients
        ]).lower()
        
        # Common protein sources
        proteins = [
            'chicken', 'turkey', 'beef', 'pork', 'lamb', 'fish', 'salmon',
            'tuna', 'shrimp', 'tofu', 'tempeh', 'beans', 'lentils', 'chickpeas',
            'eggs', 'greek yogurt', 'cottage cheese', 'nuts', 'quinoa'
        ]
        
        # Common grain sources  
        grains = [
            'rice', 'brown rice', 'wild rice', 'quinoa', 'oats', 'barley',
            'bulgur', 'wheat', 'pasta', 'bread', 'couscous', 'farro',
            'millet', 'buckwheat', 'corn', 'polenta'
        ]
        
        for protein in proteins:
            if protein in ingredients_text:
                self.stats['protein_sources'][protein] += 1
                
        for grain in grains:
            if grain in ingredients_text:
                self.stats['grain_sources'][grain] += 1
                
        # Track unique ingredients
        for ing in ingredients:
            if isinstance(ing, dict):
                ing_name = ing.get('name', '').lower().strip()
                if ing_name:
                    self.stats['unique_ingredients'].add(ing_name)
                    
    def _create_recipe_signature(self, recipe: Dict) -> str:
        """Create a signature for duplicate detection."""
        # Use title and main ingredients to create signature
        title = recipe.get('title', '').lower().strip()
        ingredients = recipe.get('ingredients', [])
        
        # Get first 5 ingredient names
        main_ingredients = []
        for ing in ingredients[:5]:
            if isinstance(ing, dict):
                ing_name = ing.get('name', '').lower().strip()
                # Remove quantities and common words
                ing_name = ' '.join([
                    word for word in ing_name.split()
                    if word not in ['the', 'a', 'an', 'and', 'or', 'of']
                ])
                main_ingredients.append(ing_name)
                
        # Create signature
        signature_parts = [title] + sorted(main_ingredients)
        return '|'.join(signature_parts)
        
    def get_progress_report(self) -> Dict:
        """Generate comprehensive progress report."""
        report = {
            'summary': {
                'total_collected': self.stats['total_count'],
                'total_target': COLLECTION_TARGETS['total'],
                'overall_progress': (self.stats['total_count'] / COLLECTION_TARGETS['total']) * 100,
                'collection_date': self.stats['collection_date'],
                'report_date': datetime.now().isoformat()
            },
            'by_meal_type': {},
            'by_cuisine': {},
            'by_season': {},
            'by_prep_time': {},
            'by_special_diet': {},
            'diversity_metrics': {},
            'gaps': [],
            'recommendations': []
        }
        
        # Progress by category
        for meal_type, target in COLLECTION_TARGETS['by_meal_type'].items():
            current = self.stats['by_meal_type'][meal_type]
            report['by_meal_type'][meal_type] = {
                'current': current,
                'target': target,
                'progress': (current / target) * 100 if target > 0 else 0,
                'remaining': max(0, target - current)
            }
            
        for cuisine, target in COLLECTION_TARGETS['by_cuisine'].items():
            current = self.stats['by_cuisine'][cuisine]
            report['by_cuisine'][cuisine] = {
                'current': current,
                'target': target,
                'progress': (current / target) * 100 if target > 0 else 0,
                'remaining': max(0, target - current)
            }
            
        # Diversity metrics
        report['diversity_metrics'] = {
            'unique_ingredients': len(self.stats['unique_ingredients']),
            'protein_sources': len(self.stats['protein_sources']),
            'grain_sources': len(self.stats['grain_sources']),
            'cuisines_per_meal_type': {
                meal: len([c for c, count in cuisines.items() if count > 0])
                for meal, cuisines in self.stats['cuisine_meal_matrix'].items()
            },
            'seasonal_coverage': {
                meal: len([s for s, count in seasons.items() if count > 0])
                for meal, seasons in self.stats['seasonal_meal_matrix'].items()
            }
        }
        
        # Identify gaps
        gaps = []
        
        # Meal type gaps
        for meal_type, target in COLLECTION_TARGETS['by_meal_type'].items():
            current = self.stats['by_meal_type'][meal_type]
            if current < target * 0.8:  # Less than 80% of target
                gaps.append(f"Need {target - current} more {meal_type} recipes")
                
        # Cuisine gaps
        for cuisine, target in COLLECTION_TARGETS['by_cuisine'].items():
            current = self.stats['by_cuisine'][cuisine]
            if current < target * 0.5:  # Less than 50% of target
                gaps.append(f"Need {target - current} more {cuisine} cuisine recipes")
                
        # Diversity gaps
        for meal_type, cuisines in self.stats['cuisine_meal_matrix'].items():
            cuisine_count = len([c for c, count in cuisines.items() if count > 0])
            if cuisine_count < DIVERSITY_REQUIREMENTS['min_cuisines_per_meal_type']:
                gaps.append(f"{meal_type} needs more cuisine variety (current: {cuisine_count})")
                
        report['gaps'] = gaps
        
        # Generate recommendations
        recommendations = []
        
        # Prioritize based on gaps
        lowest_progress_meal = min(
            report['by_meal_type'].items(),
            key=lambda x: x[1]['progress']
        )
        recommendations.append(f"Focus on {lowest_progress_meal[0]} recipes (only {lowest_progress_meal[1]['progress']:.0f}% complete)")
        
        lowest_progress_cuisine = min(
            report['by_cuisine'].items(),
            key=lambda x: x[1]['progress']
        )
        recommendations.append(f"Need more {lowest_progress_cuisine[0]} recipes (only {lowest_progress_cuisine[1]['progress']:.0f}% complete)")
        
        # Check protein diversity
        if len(self.stats['protein_sources']) < DIVERSITY_REQUIREMENTS['min_protein_variety']:
            recommendations.append(f"Increase protein variety (current: {len(self.stats['protein_sources'])} sources)")
            
        report['recommendations'] = recommendations
        
        return report
        
    def get_collection_matrix(self) -> Dict:
        """Get detailed collection matrix for visualization."""
        return {
            'cuisine_meal_matrix': dict(self.stats['cuisine_meal_matrix']),
            'seasonal_meal_matrix': dict(self.stats['seasonal_meal_matrix']),
            'source_distribution': dict(self.stats['by_source']),
            'top_proteins': self.stats['protein_sources'].most_common(10),
            'top_grains': self.stats['grain_sources'].most_common(10)
        }
        
    def check_duplicate(self, recipe: Dict) -> bool:
        """Check if recipe is likely a duplicate."""
        signature = self._create_recipe_signature(recipe)
        return signature in self.stats['recipe_signatures']
        
    def save_report(self, filepath: str = None):
        """Save diversity report to JSON file."""
        filepath = filepath or self.save_path
        report = self.get_progress_report()
        report['detailed_stats'] = {
            'recipes_collected': len(self.recipes),
            'collection_matrix': self.get_collection_matrix()
        }
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2, default=str)
            
        logger.info(f"Saved diversity report to {filepath}")
        
    def load_previous_state(self, filepath: str):
        """Load previous tracking state from file."""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                # Restore stats
                if 'detailed_stats' in data:
                    # Convert back to appropriate types
                    self.stats['unique_ingredients'] = set(data['detailed_stats'].get('unique_ingredients', []))
                    self.stats['recipe_signatures'] = set(data['detailed_stats'].get('recipe_signatures', []))
                    # Restore other stats
                    for key in ['by_meal_type', 'by_cuisine', 'by_season', 'by_prep_time', 'by_special_diet']:
                        if key in data:
                            self.stats[key] = defaultdict(int, data[key])
                            
            logger.info(f"Loaded previous state from {filepath}")
        except Exception as e:
            logger.error(f"Error loading previous state: {e}")
            
    def get_next_priorities(self, limit: int = 5) -> List[Dict]:
        """Get prioritized list of what recipes to collect next."""
        priorities = []
        
        # Calculate gaps for each category
        meal_gaps = []
        for meal_type, target in COLLECTION_TARGETS['by_meal_type'].items():
            current = self.stats['by_meal_type'][meal_type]
            if current < target:
                gap_percentage = (target - current) / target
                meal_gaps.append({
                    'type': 'meal_type',
                    'value': meal_type,
                    'needed': target - current,
                    'priority_score': gap_percentage * 2  # Weight meal type heavily
                })
                
        cuisine_gaps = []
        for cuisine, target in COLLECTION_TARGETS['by_cuisine'].items():
            current = self.stats['by_cuisine'][cuisine]
            if current < target:
                gap_percentage = (target - current) / target
                cuisine_gaps.append({
                    'type': 'cuisine',
                    'value': cuisine,
                    'needed': target - current,
                    'priority_score': gap_percentage
                })
                
        # Combine and sort by priority
        all_gaps = meal_gaps + cuisine_gaps
        all_gaps.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # Generate specific recommendations
        for gap in all_gaps[:limit]:
            if gap['type'] == 'meal_type':
                # Find which cuisines are underrepresented for this meal type
                meal_cuisines = self.stats['cuisine_meal_matrix'][gap['value']]
                underrepresented_cuisines = [
                    c for c in COLLECTION_TARGETS['by_cuisine'].keys()
                    if meal_cuisines[c] < 3
                ]
                priorities.append({
                    'priority': f"{gap['value']} recipes",
                    'focus': f"Especially {', '.join(underrepresented_cuisines[:3])} cuisines",
                    'needed': gap['needed'],
                    'search_terms': [f"{gap['value']} {c}" for c in underrepresented_cuisines[:2]]
                })
            else:
                # Find which meal types need this cuisine
                needed_meals = []
                for meal in COLLECTION_TARGETS['by_meal_type'].keys():
                    if self.stats['cuisine_meal_matrix'][meal][gap['value']] < 5:
                        needed_meals.append(meal)
                priorities.append({
                    'priority': f"{gap['value']} cuisine recipes",
                    'focus': f"Especially for {', '.join(needed_meals)}",
                    'needed': gap['needed'],
                    'search_terms': [f"{gap['value']} {m}" for m in needed_meals[:2]]
                })
                
        return priorities