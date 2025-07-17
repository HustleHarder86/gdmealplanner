const fs = require('fs');

const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
let total = 0;
let uniqueIds = new Set();

console.log('Checking category files:');
categories.forEach(cat => {
  const data = JSON.parse(fs.readFileSync(`public/data/recipes-${cat}.json`, 'utf-8'));
  console.log(`${cat}: ${data.recipes.length} recipes`);
  total += data.recipes.length;
  data.recipes.forEach(r => uniqueIds.add(r.id));
});

console.log(`\nTotal recipes (sum): ${total}`);
console.log(`Unique recipe IDs: ${uniqueIds.size}`);

// Check main file
const mainData = JSON.parse(fs.readFileSync('public/data/recipes.json', 'utf-8'));
console.log(`\nMain recipes.json count: ${mainData.recipeCount}`);
console.log(`Actual recipes in array: ${mainData.recipes.length}`);

// Check for duplicates
const mainIds = new Set(mainData.recipes.map(r => r.id));
console.log(`Unique IDs in main file: ${mainIds.size}`);

if (mainIds.size !== mainData.recipes.length) {
  console.log(`\nFound ${mainData.recipes.length - mainIds.size} duplicate recipes!`);
  
  // Find duplicates
  const idCounts = {};
  mainData.recipes.forEach(r => {
    idCounts[r.id] = (idCounts[r.id] || 0) + 1;
  });
  
  console.log('\nDuplicate IDs:');
  Object.entries(idCounts).forEach(([id, count]) => {
    if (count > 1) {
      const recipe = mainData.recipes.find(r => r.id === id);
      console.log(`- ${id}: ${count} times (${recipe.title})`);
    }
  });
}