#!/usr/bin/env python3
"""
Fix miscategorized recipes in the database.
Recipes that are clearly main dishes should not be categorized as snacks.
"""

import json
import re

def is_true_snack(recipe):
    """
    Determine if a recipe is actually a snack based on multiple criteria.
    """
    title = recipe.get('title', '').lower()
    description = recipe.get('description', '').lower()
    calories = recipe.get('nutrition', {}).get('calories', 0)
    servings = recipe.get('servings', 1)
    calories_per_serving = calories / servings if servings > 0 else calories
    
    # Main dish keywords that should NOT be snacks
    main_dish_keywords = [
        'chili', 'soup', 'salad', 'risotto', 'fried rice', 'pasta', 'pizza',
        'burger', 'sandwich', 'wrap', 'bowl', 'casserole', 'stew', 'curry',
        'tacos', 'burritos', 'enchiladas', 'lasagna', 'spaghetti', 'noodles',
        'stir fry', 'roast', 'grilled', 'baked chicken', 'salmon', 'steak',
        'pork chops', 'meatloaf', 'pot pie', 'quiche', 'frittata'
    ]
    
    # True snack keywords
    snack_keywords = [
        'hummus', 'dip', 'chips', 'crackers', 'popcorn', 'nuts', 'trail mix',
        'granola', 'bar', 'bites', 'balls', 'muffin', 'cookie', 'brownie',
        'smoothie', 'shake', 'yogurt', 'pudding', 'fruit', 'veggie sticks',
        'cheese stick', 'jerky', 'pretzel', 'toast', 'bruschetta', 'crostini',
        'deviled eggs', 'roll-ups', 'pinwheel', 'spread', 'pate', 'tapenade'
    ]
    
    # Check if it's clearly a main dish
    for keyword in main_dish_keywords:
        if keyword in title:
            return False
    
    # Check for appetizer/hors d'oeuvre in description (could be snack-sized)
    if 'main course' in description or 'main dish' in description:
        return False
    
    # If calories per serving > 350, probably not a snack
    if calories_per_serving > 350:
        return False
        
    # If it mentions dinner, lunch, or breakfast in description, not a snack
    if any(meal in description for meal in ['dinner', 'lunch', 'breakfast']):
        return False
    
    # Check if it has snack keywords
    has_snack_keyword = any(keyword in title for keyword in snack_keywords)
    
    # If it's labeled as appetizer/hor d'oeuvre and under 250 calories, it could be a snack
    if ('hor d\'oeuvre' in description or 'appetizer' in description) and calories_per_serving <= 250:
        return True
    
    return has_snack_keyword

def determine_correct_category(recipe):
    """
    Determine the correct category for a recipe.
    """
    title = recipe.get('title', '').lower()
    description = recipe.get('description', '').lower()
    calories = recipe.get('nutrition', {}).get('calories', 0)
    servings = recipe.get('servings', 1)
    calories_per_serving = calories / servings if servings > 0 else calories
    
    # Breakfast items
    breakfast_keywords = ['pancake', 'waffle', 'french toast', 'oatmeal', 'cereal', 
                         'scrambled', 'omelet', 'frittata', 'breakfast', 'morning']
    if any(keyword in title or keyword in description for keyword in breakfast_keywords):
        return 'breakfast'
    
    # Snacks (true snacks only)
    if is_true_snack(recipe):
        return 'snack'
    
    # Soups and salads - typically lunch
    if any(keyword in title for keyword in ['soup', 'salad', 'sandwich', 'wrap']):
        return 'lunch'
    
    # Heavy/complex dishes - typically dinner
    dinner_keywords = ['chili', 'risotto', 'pasta', 'pizza', 'casserole', 'stew', 
                       'curry', 'roast', 'grilled', 'baked', 'fried rice', 'stir fry']
    if any(keyword in title for keyword in dinner_keywords):
        return 'dinner'
    
    # Based on calories - rough heuristic
    if calories_per_serving < 300:
        return 'snack'
    elif calories_per_serving < 500:
        return 'lunch'
    else:
        return 'dinner'

def main():
    # Load the recipes
    with open('public/data/recipes.json', 'r') as f:
        data = json.load(f)
    
    recipes = data['recipes']
    
    # Track changes
    changes = []
    snack_count_before = sum(1 for r in recipes if r.get('category') == 'snack')
    
    # Fix categories
    for recipe in recipes:
        current_category = recipe.get('category', '')
        
        # Only check recipes currently marked as snacks
        if current_category == 'snack':
            if not is_true_snack(recipe):
                new_category = determine_correct_category(recipe)
                if new_category != current_category:
                    changes.append({
                        'title': recipe['title'],
                        'old': current_category,
                        'new': new_category,
                        'calories': recipe.get('nutrition', {}).get('calories', 0)
                    })
                    recipe['category'] = new_category
    
    # Save the updated recipes
    with open('public/data/recipes.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Report changes
    snack_count_after = sum(1 for r in recipes if r.get('category') == 'snack')
    
    print(f"Fixed {len(changes)} miscategorized recipes")
    print(f"Snacks before: {snack_count_before}")
    print(f"Snacks after: {snack_count_after}")
    print("\nChanges made:")
    for change in changes[:20]:  # Show first 20 changes
        print(f"  {change['title']}: {change['old']} -> {change['new']} ({change['calories']} cal)")
    
    if len(changes) > 20:
        print(f"  ... and {len(changes) - 20} more")

if __name__ == '__main__':
    main()