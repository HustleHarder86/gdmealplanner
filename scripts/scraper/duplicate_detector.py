#!/usr/bin/env python3
"""
Duplicate detection module using fuzzy matching for recipe titles,
ingredient similarity scoring, and nutrition profile comparison.
"""

import logging
from typing import Dict, List, Tuple, Optional
from fuzzywuzzy import fuzz, process
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json

logger = logging.getLogger(__name__)

# Thresholds for duplicate detection
DUPLICATE_THRESHOLDS = {
    'title_fuzzy_ratio': 85,  # Fuzzy string match threshold for titles
    'ingredient_similarity': 0.8,  # Cosine similarity threshold for ingredients
    'nutrition_similarity': 0.9,  # Similarity threshold for nutrition profiles
    'combined_threshold': 0.75,  # Overall similarity threshold
}

# Weights for different similarity components
SIMILARITY_WEIGHTS = {
    'title': 0.3,
    'ingredients': 0.4,
    'nutrition': 0.2,
    'cooking_method': 0.1
}


class DuplicateDetector:
    """Detect duplicate recipes using multiple similarity metrics."""
    
    def __init__(self, existing_recipes: List[Dict] = None):
        self.existing_recipes = existing_recipes or []
        self.recipe_index = {}
        self.ingredient_vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            max_features=1000,
            stop_words='english'
        )
        self.ingredient_vectors = None
        
        if self.existing_recipes:
            self._build_index()
            
    def _build_index(self):
        """Build search index for existing recipes."""
        logger.info(f"Building index for {len(self.existing_recipes)} recipes")
        
        # Build title index
        self.recipe_index = {
            recipe.get('title', '').lower(): i 
            for i, recipe in enumerate(self.existing_recipes)
        }
        
        # Build ingredient vectors
        if self.existing_recipes:
            ingredient_texts = [
                self._get_ingredient_text(recipe) 
                for recipe in self.existing_recipes
            ]
            if any(ingredient_texts):
                self.ingredient_vectors = self.ingredient_vectorizer.fit_transform(ingredient_texts)
                
    def _get_ingredient_text(self, recipe: Dict) -> str:
        """Extract ingredient names as text for vectorization."""
        ingredients = recipe.get('ingredients', [])
        ingredient_names = []
        
        for ing in ingredients:
            if isinstance(ing, dict):
                name = ing.get('name', '')
            else:
                name = str(ing)
            
            # Clean and normalize ingredient name
            name = name.lower().strip()
            # Remove common measurements and quantities
            for word in ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'gram', 'ml']:
                name = name.replace(word, '')
            # Remove numbers
            name = ''.join([c for c in name if not c.isdigit()])
            name = ' '.join(name.split())  # Normalize whitespace
            
            if name:
                ingredient_names.append(name)
                
        return ' '.join(ingredient_names)
        
    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """Calculate fuzzy similarity between two titles."""
        # Basic fuzzy ratio
        basic_ratio = fuzz.ratio(title1.lower(), title2.lower()) / 100.0
        
        # Token sort ratio (handles word order differences)
        token_ratio = fuzz.token_sort_ratio(title1.lower(), title2.lower()) / 100.0
        
        # Partial ratio (handles substring matches)
        partial_ratio = fuzz.partial_ratio(title1.lower(), title2.lower()) / 100.0
        
        # Weighted average
        return (basic_ratio * 0.5 + token_ratio * 0.3 + partial_ratio * 0.2)
        
    def _calculate_ingredient_similarity(self, ingredients1: List[Dict], ingredients2: List[Dict]) -> float:
        """Calculate similarity between two ingredient lists."""
        # Get ingredient names
        names1 = set()
        names2 = set()
        
        for ing in ingredients1:
            if isinstance(ing, dict):
                name = ing.get('name', '').lower().strip()
            else:
                name = str(ing).lower().strip()
            if name:
                # Extract main ingredient (remove descriptors)
                main_ing = self._extract_main_ingredient(name)
                names1.add(main_ing)
                
        for ing in ingredients2:
            if isinstance(ing, dict):
                name = ing.get('name', '').lower().strip()
            else:
                name = str(ing).lower().strip()
            if name:
                main_ing = self._extract_main_ingredient(name)
                names2.add(main_ing)
                
        # Calculate Jaccard similarity
        if not names1 or not names2:
            return 0.0
            
        intersection = len(names1.intersection(names2))
        union = len(names1.union(names2))
        
        return intersection / union if union > 0 else 0.0
        
    def _extract_main_ingredient(self, ingredient_name: str) -> str:
        """Extract the main ingredient from a full ingredient description."""
        # Remove common descriptors and preparations
        descriptors = [
            'fresh', 'frozen', 'canned', 'dried', 'chopped', 'diced', 
            'sliced', 'minced', 'ground', 'whole', 'large', 'small',
            'medium', 'organic', 'low-fat', 'fat-free', 'boneless',
            'skinless', 'cooked', 'raw', 'unsalted', 'salted'
        ]
        
        words = ingredient_name.split()
        main_words = [w for w in words if w not in descriptors]
        
        # Remove parenthetical information
        result = ' '.join(main_words)
        if '(' in result:
            result = result.split('(')[0].strip()
            
        return result
        
    def _calculate_nutrition_similarity(self, nutrition1: Dict, nutrition2: Dict) -> float:
        """Calculate similarity between nutrition profiles."""
        # Key nutrients to compare
        key_nutrients = ['calories', 'carbs', 'protein', 'fat', 'fiber', 'sugar', 'sodium']
        
        # Extract values
        values1 = []
        values2 = []
        
        for nutrient in key_nutrients:
            val1 = nutrition1.get(nutrient, 0)
            val2 = nutrition2.get(nutrient, 0)
            
            # Skip if both are zero
            if val1 == 0 and val2 == 0:
                continue
                
            values1.append(val1)
            values2.append(val2)
            
        if not values1 or not values2:
            return 0.0
            
        # Convert to numpy arrays
        arr1 = np.array(values1)
        arr2 = np.array(values2)
        
        # Normalize to handle different scales
        norm1 = arr1 / (np.linalg.norm(arr1) + 1e-10)
        norm2 = arr2 / (np.linalg.norm(arr2) + 1e-10)
        
        # Calculate cosine similarity
        similarity = np.dot(norm1, norm2)
        
        return float(similarity)
        
    def _calculate_method_similarity(self, recipe1: Dict, recipe2: Dict) -> float:
        """Calculate similarity based on cooking methods and tags."""
        tags1 = set(recipe1.get('tags', []))
        tags2 = set(recipe2.get('tags', []))
        
        # Extract cooking method tags
        method_tags1 = {tag for tag in tags1 if 'method-' in tag or any(
            method in tag for method in ['bake', 'grill', 'roast', 'steam', 'fry']
        )}
        method_tags2 = {tag for tag in tags2 if 'method-' in tag or any(
            method in tag for method in ['bake', 'grill', 'roast', 'steam', 'fry']
        )}
        
        if not method_tags1 or not method_tags2:
            # Check prep/cook times as proxy
            time1 = recipe1.get('prepTime', 0) + recipe1.get('cookTime', 0)
            time2 = recipe2.get('prepTime', 0) + recipe2.get('cookTime', 0)
            
            if time1 > 0 and time2 > 0:
                time_diff = abs(time1 - time2) / max(time1, time2)
                return 1.0 - time_diff
            return 0.5  # Neutral score
            
        # Jaccard similarity for methods
        intersection = len(method_tags1.intersection(method_tags2))
        union = len(method_tags1.union(method_tags2))
        
        return intersection / union if union > 0 else 0.0
        
    def calculate_similarity(self, recipe1: Dict, recipe2: Dict) -> Dict[str, float]:
        """Calculate comprehensive similarity between two recipes."""
        # Title similarity
        title1 = recipe1.get('title', '')
        title2 = recipe2.get('title', '')
        title_sim = self._calculate_title_similarity(title1, title2)
        
        # Ingredient similarity
        ingredients1 = recipe1.get('ingredients', [])
        ingredients2 = recipe2.get('ingredients', [])
        ingredient_sim = self._calculate_ingredient_similarity(ingredients1, ingredients2)
        
        # Nutrition similarity
        nutrition1 = recipe1.get('nutrition', {})
        nutrition2 = recipe2.get('nutrition', {})
        nutrition_sim = self._calculate_nutrition_similarity(nutrition1, nutrition2)
        
        # Cooking method similarity
        method_sim = self._calculate_method_similarity(recipe1, recipe2)
        
        # Combined score
        combined_score = (
            SIMILARITY_WEIGHTS['title'] * title_sim +
            SIMILARITY_WEIGHTS['ingredients'] * ingredient_sim +
            SIMILARITY_WEIGHTS['nutrition'] * nutrition_sim +
            SIMILARITY_WEIGHTS['cooking_method'] * method_sim
        )
        
        return {
            'title_similarity': title_sim,
            'ingredient_similarity': ingredient_sim,
            'nutrition_similarity': nutrition_sim,
            'method_similarity': method_sim,
            'combined_score': combined_score,
            'is_duplicate': combined_score >= DUPLICATE_THRESHOLDS['combined_threshold']
        }
        
    def find_duplicates(self, recipe: Dict, threshold: float = None) -> List[Dict]:
        """Find potential duplicates for a given recipe."""
        threshold = threshold or DUPLICATE_THRESHOLDS['combined_threshold']
        duplicates = []
        
        recipe_title = recipe.get('title', '').lower()
        
        # First, do a quick title-based filter using fuzzy matching
        potential_matches = []
        for i, existing_recipe in enumerate(self.existing_recipes):
            existing_title = existing_recipe.get('title', '').lower()
            
            # Quick fuzzy match
            if fuzz.ratio(recipe_title, existing_title) > 70:
                potential_matches.append((i, existing_recipe))
                
        # Then do detailed comparison on potential matches
        for idx, existing_recipe in potential_matches:
            similarity = self.calculate_similarity(recipe, existing_recipe)
            
            if similarity['combined_score'] >= threshold:
                duplicates.append({
                    'recipe': existing_recipe,
                    'similarity': similarity,
                    'index': idx
                })
                
        # Sort by similarity score
        duplicates.sort(key=lambda x: x['similarity']['combined_score'], reverse=True)
        
        return duplicates
        
    def find_near_duplicates_batch(self, recipes: List[Dict], threshold: float = None) -> Dict[str, List[Dict]]:
        """Find near-duplicates within a batch of recipes."""
        threshold = threshold or DUPLICATE_THRESHOLDS['combined_threshold']
        near_duplicates = {}
        
        # Compare each recipe with others
        for i, recipe1 in enumerate(recipes):
            recipe1_title = recipe1.get('title', 'Unknown')
            duplicates = []
            
            for j, recipe2 in enumerate(recipes[i+1:], i+1):
                similarity = self.calculate_similarity(recipe1, recipe2)
                
                if similarity['combined_score'] >= threshold:
                    duplicates.append({
                        'recipe': recipe2,
                        'similarity': similarity,
                        'index': j
                    })
                    
            if duplicates:
                near_duplicates[recipe1_title] = duplicates
                
        return near_duplicates
        
    def add_recipe(self, recipe: Dict):
        """Add a recipe to the existing collection."""
        self.existing_recipes.append(recipe)
        # Update index
        self.recipe_index[recipe.get('title', '').lower()] = len(self.existing_recipes) - 1
        
        # Update ingredient vectors (rebuild for simplicity)
        if len(self.existing_recipes) % 50 == 0:  # Rebuild every 50 recipes
            self._build_index()
            
    def get_deduplication_report(self, recipes: List[Dict]) -> Dict:
        """Generate a deduplication report for a set of recipes."""
        report = {
            'total_recipes': len(recipes),
            'duplicate_pairs': [],
            'duplicate_groups': [],
            'similarity_distribution': {
                'high': 0,  # > 0.9
                'medium': 0,  # 0.7 - 0.9
                'low': 0,  # 0.5 - 0.7
            },
            'recommendations': []
        }
        
        # Find all duplicate pairs
        seen_pairs = set()
        duplicate_groups = {}
        
        for i, recipe1 in enumerate(recipes):
            for j, recipe2 in enumerate(recipes[i+1:], i+1):
                pair_key = tuple(sorted([i, j]))
                if pair_key in seen_pairs:
                    continue
                    
                similarity = self.calculate_similarity(recipe1, recipe2)
                if similarity['combined_score'] >= 0.5:  # Lower threshold for report
                    seen_pairs.add(pair_key)
                    
                    # Add to report
                    pair_info = {
                        'recipe1': recipe1.get('title', 'Unknown'),
                        'recipe2': recipe2.get('title', 'Unknown'),
                        'similarity': similarity
                    }
                    
                    if similarity['combined_score'] >= DUPLICATE_THRESHOLDS['combined_threshold']:
                        report['duplicate_pairs'].append(pair_info)
                        
                        # Group duplicates
                        group_key = None
                        for key in duplicate_groups:
                            if i in duplicate_groups[key] or j in duplicate_groups[key]:
                                group_key = key
                                break
                                
                        if group_key is None:
                            group_key = i
                            duplicate_groups[group_key] = {i}
                            
                        duplicate_groups[group_key].update({i, j})
                        
                    # Update distribution
                    if similarity['combined_score'] > 0.9:
                        report['similarity_distribution']['high'] += 1
                    elif similarity['combined_score'] > 0.7:
                        report['similarity_distribution']['medium'] += 1
                    else:
                        report['similarity_distribution']['low'] += 1
                        
        # Convert duplicate groups to list
        for group_indices in duplicate_groups.values():
            group_recipes = [recipes[i].get('title', 'Unknown') for i in group_indices]
            report['duplicate_groups'].append(group_recipes)
            
        # Generate recommendations
        if report['duplicate_pairs']:
            report['recommendations'].append(
                f"Found {len(report['duplicate_pairs'])} potential duplicate pairs"
            )
            report['recommendations'].append(
                "Review and merge similar recipes or differentiate them further"
            )
            
        if report['similarity_distribution']['high'] > 10:
            report['recommendations'].append(
                "Many highly similar recipes detected - consider diversifying the collection"
            )
            
        return report
        
    def create_recipe_fingerprint(self, recipe: Dict) -> str:
        """Create a unique fingerprint for a recipe for fast lookup."""
        # Combine key elements
        elements = [
            recipe.get('title', '').lower(),
            self._get_ingredient_text(recipe),
            str(sorted(recipe.get('nutrition', {}).items()))
        ]
        
        fingerprint_string = '|'.join(elements)
        return hashlib.md5(fingerprint_string.encode()).hexdigest()
        
    def export_duplicate_pairs(self, recipes: List[Dict], output_file: str):
        """Export duplicate pairs to a JSON file for manual review."""
        duplicate_data = {
            'timestamp': logger.handlers[0].formatter.formatTime(logger.makeRecord('', 0, '', 0, '', (), None)),
            'total_recipes': len(recipes),
            'duplicate_pairs': []
        }
        
        # Find all duplicates
        for i, recipe in enumerate(recipes):
            duplicates = self.find_duplicates(recipe)
            
            for dup in duplicates:
                pair = {
                    'recipe1': {
                        'title': recipe.get('title'),
                        'source': recipe.get('sourceUrl'),
                        'nutrition': recipe.get('nutrition', {})
                    },
                    'recipe2': {
                        'title': dup['recipe'].get('title'),
                        'source': dup['recipe'].get('sourceUrl'),
                        'nutrition': dup['recipe'].get('nutrition', {})
                    },
                    'similarity_scores': dup['similarity']
                }
                duplicate_data['duplicate_pairs'].append(pair)
                
        with open(output_file, 'w') as f:
            json.dump(duplicate_data, f, indent=2)
            
        logger.info(f"Exported {len(duplicate_data['duplicate_pairs'])} duplicate pairs to {output_file}")