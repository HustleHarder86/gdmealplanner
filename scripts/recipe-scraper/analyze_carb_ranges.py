#!/usr/bin/env python3
"""
Analyze how many recipes would be affected by different carb ranges
"""

import json

# Current ranges used in validator.py
current_ranges = {
    'breakfast': {'min': 25, 'max': 45},
    'lunch': {'min': 30, 'max': 45},
    'dinner': {'min': 30, 'max': 45},
    'snacks': {'min': 10, 'max': 20}
}

# Standard GD guidelines
standard_gd_ranges = {
    'breakfast': {'min': 15, 'max': 30},
    'lunch': {'min': 30, 'max': 45},
    'dinner': {'min': 30, 'max': 45},
    'snacks': {'min': 15, 'max': 20}
}

def analyze_recipes(filename):
    """Analyze recipes against different carb ranges"""
    with open(filename, 'r') as f:
        recipes = json.load(f)
    
    results = {
        'total': len(recipes),
        'by_category': {},
        'current_validation': {'pass': 0, 'fail': 0, 'failures': []},
        'standard_gd_validation': {'pass': 0, 'fail': 0, 'failures': []},
        'carb_distribution': {}
    }
    
    # Analyze each recipe
    for recipe in recipes:
        category = recipe.get('category', 'unknown')
        carbs = recipe.get('nutrition', {}).get('carbs', 0)
        
        # Track carb distribution
        if category not in results['carb_distribution']:
            results['carb_distribution'][category] = []
        results['carb_distribution'][category].append(carbs)
        
        # Count by category
        if category not in results['by_category']:
            results['by_category'][category] = 0
        results['by_category'][category] += 1
        
        # Check against current ranges
        current_range = current_ranges.get(category, current_ranges['lunch'])
        if current_range['min'] <= carbs <= current_range['max']:
            results['current_validation']['pass'] += 1
        else:
            results['current_validation']['fail'] += 1
            results['current_validation']['failures'].append({
                'recipe': recipe.get('title', 'Unknown'),
                'category': category,
                'carbs': carbs,
                'range': f"{current_range['min']}-{current_range['max']}g",
                'issue': 'too low' if carbs < current_range['min'] else 'too high'
            })
        
        # Check against standard GD ranges
        standard_range = standard_gd_ranges.get(category, standard_gd_ranges['lunch'])
        if standard_range['min'] <= carbs <= standard_range['max']:
            results['standard_gd_validation']['pass'] += 1
        else:
            results['standard_gd_validation']['fail'] += 1
            results['standard_gd_validation']['failures'].append({
                'recipe': recipe.get('title', 'Unknown'),
                'category': category,
                'carbs': carbs,
                'range': f"{standard_range['min']}-{standard_range['max']}g",
                'issue': 'too low' if carbs < standard_range['min'] else 'too high'
            })
    
    # Calculate statistics for carb distribution
    for category in results['carb_distribution']:
        carbs_list = results['carb_distribution'][category]
        if carbs_list:
            results['carb_distribution'][category] = {
                'count': len(carbs_list),
                'min': min(carbs_list),
                'max': max(carbs_list),
                'avg': round(sum(carbs_list) / len(carbs_list), 1),
                'values': sorted(carbs_list)
            }
    
    return results

# Analyze both recipe files
print("CARB RANGE ANALYSIS")
print("===================\n")

print("Current Ranges in validator.py:")
for cat, ranges in current_ranges.items():
    print(f"  {cat}: {ranges['min']}-{ranges['max']}g")

print("\nStandard GD Guidelines:")
for cat, ranges in standard_gd_ranges.items():
    print(f"  {cat}: {ranges['min']}-{ranges['max']}g")

print("\n" + "="*50 + "\n")

# Analyze scraped recipes
print("ANALYSIS OF output/recipes.json (48 scraped recipes):")
print("-" * 50)
results1 = analyze_recipes('output/recipes.json')

print(f"Total recipes: {results1['total']}")
print(f"\nBy category:")
for cat, count in results1['by_category'].items():
    print(f"  {cat}: {count}")

print(f"\nCarb Distribution by Category:")
for cat, stats in results1['carb_distribution'].items():
    print(f"\n  {cat} ({stats['count']} recipes):")
    print(f"    Range: {stats['min']}-{stats['max']}g")
    print(f"    Average: {stats['avg']}g")

print(f"\nValidation Results:")
print(f"\nWith Current Ranges:")
print(f"  Pass: {results1['current_validation']['pass']}")
print(f"  Fail: {results1['current_validation']['fail']}")

print(f"\nWith Standard GD Ranges:")
print(f"  Pass: {results1['standard_gd_validation']['pass']}")
print(f"  Fail: {results1['standard_gd_validation']['fail']}")

if results1['standard_gd_validation']['failures']:
    print(f"\n  Recipes that would fail with standard GD ranges:")
    for failure in results1['standard_gd_validation']['failures']:
        print(f"    - {failure['recipe']} ({failure['category']}): {failure['carbs']}g carbs - {failure['issue']} (range: {failure['range']})")

# Check if generated recipes exist
import os
if os.path.exists('output-full/recipes.json'):
    print("\n" + "="*50 + "\n")
    print("ANALYSIS OF output-full/recipes.json (360 generated recipes):")
    print("-" * 50)
    results2 = analyze_recipes('output-full/recipes.json')
    
    print(f"Total recipes: {results2['total']}")
    print(f"\nBy category:")
    for cat, count in results2['by_category'].items():
        print(f"  {cat}: {count}")
    
    print(f"\nCarb Distribution by Category:")
    for cat, stats in results2['carb_distribution'].items():
        print(f"\n  {cat} ({stats['count']} recipes):")
        print(f"    Range: {stats['min']}-{stats['max']}g")
        print(f"    Average: {stats['avg']}g")
    
    print(f"\nValidation Results:")
    print(f"\nWith Current Ranges:")
    print(f"  Pass: {results2['current_validation']['pass']}")
    print(f"  Fail: {results2['current_validation']['fail']}")
    
    print(f"\nWith Standard GD Ranges:")
    print(f"  Pass: {results2['standard_gd_validation']['pass']}")
    print(f"  Fail: {results2['standard_gd_validation']['fail']}")
    
    # Show breakdown by category
    category_failures = {}
    for failure in results2['standard_gd_validation']['failures']:
        cat = failure['category']
        if cat not in category_failures:
            category_failures[cat] = 0
        category_failures[cat] += 1
    
    if category_failures:
        print(f"\n  Failures by category with standard GD ranges:")
        for cat, count in category_failures.items():
            total = results2['by_category'][cat]
            print(f"    {cat}: {count}/{total} ({round(count/total*100, 1)}% would fail)")

print("\n" + "="*50 + "\n")
print("SUMMARY:")
print("-" * 7)
print("\n1. Current carb ranges are MORE LENIENT than standard GD guidelines for breakfast")
print("   - Current: 25-45g vs Standard: 15-30g")
print("   - This allows higher carb breakfast options")
print("\n2. Snack ranges have a lower minimum in current implementation")
print("   - Current: 10-20g vs Standard: 15-20g")
print("   - This allows lower carb snack options")
print("\n3. Lunch and dinner ranges match standard GD guidelines (30-45g)")