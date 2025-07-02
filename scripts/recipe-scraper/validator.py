#!/usr/bin/env python3
"""
Recipe Validator for GD Compliance
"""

import json
import os
from typing import Dict, List, Tuple

class RecipeValidator:
    def __init__(self):
        self.gd_requirements = {
            'breakfast': {
                'min_carbs': 25,
                'max_carbs': 45,
                'min_fiber': 3,
                'min_protein': 10
            },
            'lunch': {
                'min_carbs': 30,
                'max_carbs': 45,
                'min_fiber': 4,
                'min_protein': 15
            },
            'dinner': {
                'min_carbs': 30,
                'max_carbs': 45,
                'min_fiber': 4,
                'min_protein': 20
            },
            'snacks': {
                'min_carbs': 10,
                'max_carbs': 20,
                'min_fiber': 2,
                'min_protein': 5
            }
        }
    
    def validate_recipe(self, recipe: Dict) -> Tuple[bool, List[str]]:
        """Validate a single recipe"""
        issues = []
        category = recipe.get('category', 'meal')
        requirements = self.gd_requirements.get(category, self.gd_requirements['lunch'])
        
        # Check required fields
        required_fields = ['title', 'ingredients', 'instructions', 'nutrition', 'totalTime']
        for field in required_fields:
            if not recipe.get(field):
                issues.append(f"Missing required field: {field}")
        
        # Check nutrition
        nutrition = recipe.get('nutrition', {})
        
        # Carbs
        carbs = nutrition.get('carbs', 0)
        if carbs < requirements['min_carbs']:
            issues.append(f"Carbs too low: {carbs}g (min: {requirements['min_carbs']}g)")
        elif carbs > requirements['max_carbs']:
            issues.append(f"Carbs too high: {carbs}g (max: {requirements['max_carbs']}g)")
        
        # Fiber
        fiber = nutrition.get('fiber', 0)
        if fiber < requirements['min_fiber']:
            issues.append(f"Fiber too low: {fiber}g (min: {requirements['min_fiber']}g)")
        
        # Protein
        protein = nutrition.get('protein', 0)
        if protein < requirements['min_protein']:
            issues.append(f"Protein too low: {protein}g (min: {requirements['min_protein']}g)")
        
        # Time limit
        total_time = recipe.get('totalTime', 0)
        if total_time > 45:
            issues.append(f"Total time too long: {total_time} minutes (max: 45)")
        
        # Ingredients
        if len(recipe.get('ingredients', [])) < 3:
            issues.append("Too few ingredients")
        
        # Instructions
        if len(recipe.get('instructions', [])) < 2:
            issues.append("Too few instructions")
        
        return len(issues) == 0, issues
    
    def validate_all(self, input_file: str) -> Dict:
        """Validate all recipes in a file"""
        with open(input_file, 'r', encoding='utf-8') as f:
            recipes = json.load(f)
        
        results = {
            'total': len(recipes),
            'valid': 0,
            'invalid': 0,
            'by_category': {},
            'issues': []
        }
        
        valid_recipes = []
        
        for recipe in recipes:
            is_valid, issues = self.validate_recipe(recipe)
            
            category = recipe.get('category', 'unknown')
            if category not in results['by_category']:
                results['by_category'][category] = {'valid': 0, 'invalid': 0}
            
            if is_valid:
                results['valid'] += 1
                results['by_category'][category]['valid'] += 1
                valid_recipes.append(recipe)
            else:
                results['invalid'] += 1
                results['by_category'][category]['invalid'] += 1
                results['issues'].append({
                    'recipe': recipe.get('title', 'Unknown'),
                    'category': category,
                    'issues': issues
                })
        
        # Save valid recipes
        output_dir = os.path.dirname(input_file)
        valid_file = os.path.join(output_dir, 'recipes_validated.json')
        with open(valid_file, 'w', encoding='utf-8') as f:
            json.dump(valid_recipes, f, indent=2, ensure_ascii=False)
        
        # Save validation report
        report_file = os.path.join(output_dir, 'validation_report.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Print summary
        print(f"\nValidation Summary:")
        print(f"Total recipes: {results['total']}")
        print(f"Valid recipes: {results['valid']}")
        print(f"Invalid recipes: {results['invalid']}")
        print(f"\nBy Category:")
        for category, stats in results['by_category'].items():
            print(f"  {category}: {stats['valid']} valid, {stats['invalid']} invalid")
        
        if results['issues']:
            print(f"\nIssues found in {len(results['issues'])} recipes")
            print("See validation_report.json for details")
        
        return results

if __name__ == "__main__":
    validator = RecipeValidator()
    validator.validate_all('output/recipes.json')