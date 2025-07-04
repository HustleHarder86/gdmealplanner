/**
 * Script to fix recipe data by replacing complete dishes with raw ingredients
 * and fixing redundant recipe names
 */

const fs = require('fs');
const path = require('path');

// Mapping of complete dishes to their raw ingredients
const dishToIngredients = {
  'turkey sandwich': {
    name: 'sliced turkey',
    amount: '4',
    unit: 'oz'
  },
  'chicken wrap': {
    name: 'chicken breast',
    amount: '4',
    unit: 'oz'
  },
  'tuna salad': {
    name: 'canned tuna',
    amount: '3',
    unit: 'oz'
  },
  'chicken salad': {
    name: 'cooked chicken breast',
    amount: '4',
    unit: 'oz'
  },
  'egg salad': {
    name: 'hard boiled eggs',
    amount: '2',
    unit: 'large'
  }
};

// Additional ingredients to add when transforming dishes
const dishAdditionalIngredients = {
  'turkey sandwich': [
    { name: 'whole wheat bread', amount: '2', unit: 'slices' },
    { name: 'lettuce', amount: '2', unit: 'leaves' },
    { name: 'tomato', amount: '2', unit: 'slices' },
    { name: 'mustard', amount: '1', unit: 'tsp' }
  ],
  'chicken wrap': [
    { name: 'whole wheat tortilla', amount: '1', unit: 'large' },
    { name: 'lettuce', amount: '1/4', unit: 'cup' },
    { name: 'tomato', amount: '1/4', unit: 'cup' },
    { name: 'avocado', amount: '1/4', unit: 'medium' }
  ],
  'tuna salad': [
    { name: 'mayonnaise', amount: '1', unit: 'tbsp' },
    { name: 'celery', amount: '2', unit: 'tbsp' },
    { name: 'onion', amount: '1', unit: 'tbsp' }
  ]
};

// Function to fix redundant recipe names
function fixRecipeName(name) {
  // First, check if this contains a complete dish name that needs fixing
  const dishNames = ['Turkey Sandwich', 'Chicken Wrap', 'Tuna Salad'];
  
  for (const dish of dishNames) {
    if (name.includes(dish)) {
      // Handle cases like "Buddha Bowl Turkey Sandwich with vegetables"
      // Should become "Turkey Buddha Bowl with vegetables"
      if (name.startsWith('Buddha Bowl ' + dish)) {
        return name.replace('Buddha Bowl ' + dish, 'Turkey Buddha Bowl');
      }
      if (name.startsWith('Grain Bowl ' + dish)) {
        return name.replace('Grain Bowl ' + dish, 'Turkey Grain Bowl');
      }
      if (name.includes('Bowl ' + dish)) {
        const protein = dish.split(' ')[0]; // Get "Turkey", "Chicken", or "Tuna"
        return name.replace(dish, '').replace('Bowl', `${protein} Bowl`).trim();
      }
      
      // For wraps containing sandwich names
      if (name.includes('Wrap ' + dish)) {
        return name.replace(dish, dish.split(' ')[0]); // Just keep the protein
      }
    }
  }
  
  // Remove redundant patterns like "Wrap Chicken Wrap"
  const patterns = [
    /^Wrap (.+) Wrap/i,
    /^Sandwich (.+) Sandwich/i,
    /^Salad (.+) Salad/i,
    /^Bowl (.+) Bowl/i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(name)) {
      // Extract the middle part and reconstruct
      const match = name.match(pattern);
      if (match) {
        const middle = match[1];
        // Get the first word (Wrap, Sandwich, etc.)
        const type = name.split(' ')[0];
        return `${middle} ${type}`;
      }
    }
  }
  
  return name;
}

// Function to fix recipe ingredients
function fixRecipeIngredients(recipe) {
  const fixedIngredients = [];
  let ingredientsModified = false;
  
  for (const ingredient of recipe.ingredients) {
    // Handle both 'item' and 'name' properties
    const ingredientName = ingredient.item || ingredient.name;
    if (!ingredientName) {
      fixedIngredients.push(ingredient);
      continue;
    }
    
    const lowerName = ingredientName.toLowerCase();
    
    // Check if this is a complete dish that needs transformation
    if (dishToIngredients[lowerName]) {
      ingredientsModified = true;
      
      // Add the raw ingredient
      const rawIngredient = dishToIngredients[lowerName];
      fixedIngredients.push({
        amount: rawIngredient.amount,
        unit: rawIngredient.unit,
        item: rawIngredient.name
      });
      
      // Add additional ingredients for the dish
      if (dishAdditionalIngredients[lowerName]) {
        fixedIngredients.push(...dishAdditionalIngredients[lowerName].map(ing => ({
          amount: ing.amount,
          unit: ing.unit,
          item: ing.name
        })));
      }
    } else {
      // Keep the original ingredient
      fixedIngredients.push(ingredient);
    }
  }
  
  return { ingredients: fixedIngredients, modified: ingredientsModified };
}

// Function to fix recipe instructions
function fixRecipeInstructions(instructions, recipeName) {
  return instructions.map(instruction => {
    // Replace generic "Prepare X according to package directions"
    if (instruction.includes('according to package directions')) {
      if (recipeName.toLowerCase().includes('wrap')) {
        return 'Warm the tortilla. Cook the chicken breast until internal temperature reaches 165°F. Slice the chicken and place on tortilla with vegetables.';
      } else if (recipeName.toLowerCase().includes('sandwich')) {
        return 'Toast the bread if desired. Layer the turkey, lettuce, tomato, and condiments between bread slices.';
      } else if (recipeName.toLowerCase().includes('salad') && recipeName.toLowerCase().includes('tuna')) {
        return 'Drain the tuna. Mix with mayonnaise, diced celery, and onion. Season with salt and pepper to taste.';
      }
    }
    
    // Fix other generic instructions
    if (instruction === 'Prepare side dishes as desired.') {
      return 'Prepare the vegetables by steaming, roasting, or sautéing until tender.';
    }
    
    if (instruction === 'Plate the main protein with chosen sides.') {
      return 'Arrange the prepared ingredients on a plate and serve immediately.';
    }
    
    return instruction;
  });
}

// Function to process a recipe file
function processRecipeFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let recipesModified = 0;
  
  const fixedRecipes = data.map(recipe => {
    let modified = false;
    
    // Fix recipe name
    const originalName = recipe.title;
    const fixedName = fixRecipeName(recipe.title);
    if (fixedName !== originalName) {
      recipe.title = fixedName;
      modified = true;
    }
    
    // Fix ingredients
    const { ingredients, modified: ingredientsModified } = fixRecipeIngredients(recipe);
    if (ingredientsModified) {
      recipe.ingredients = ingredients;
      modified = true;
      
      // Also fix the instructions since we changed ingredients
      recipe.instructions = fixRecipeInstructions(recipe.instructions, recipe.title);
    }
    
    if (modified) {
      recipesModified++;
      console.log(`  Fixed: ${originalName} → ${recipe.title}`);
    }
    
    return recipe;
  });
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(fixedRecipes, null, 2));
  console.log(`  Total recipes modified: ${recipesModified}`);
  
  return recipesModified;
}

// Main function
function main() {
  console.log('Starting recipe data cleanup...\n');
  
  const filesToProcess = [
    '/home/amy/dev/gdmealplanner/data/recipes/lunch.json',
    '/home/amy/dev/gdmealplanner/data/recipes/recipes.json',
    '/home/amy/dev/gdmealplanner/scripts/recipe-scraper/data/recipes/lunch.json',
    '/home/amy/dev/gdmealplanner/scripts/recipe-scraper/data/recipes/recipes.json'
  ];
  
  let totalModified = 0;
  
  for (const file of filesToProcess) {
    if (fs.existsSync(file)) {
      totalModified += processRecipeFile(file);
    } else {
      console.log(`File not found: ${file}`);
    }
  }
  
  console.log(`\nCleanup complete! Total recipes modified: ${totalModified}`);
  
  if (totalModified > 0) {
    console.log('\n⚠️  Important: The recipe data has been fixed!');
    console.log('Next steps:');
    console.log('1. Run "node scripts/generate-master-meal-plans.js" to regenerate meal plans');
    console.log('2. Verify the grocery lists no longer contain complete dishes');
    console.log('3. Test the application to ensure everything works correctly');
  }
}

// Run the script
main();