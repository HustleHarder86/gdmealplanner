const fs = require("fs");
const path = require("path");

// Medical guidelines for carb ranges
const GUIDELINES = {
  breakfast: { min: 25, target: 30, max: 35 },
  lunch: { min: 40, target: 45, max: 50 },
  dinner: { min: 40, target: 45, max: 50 },
  snacks: { min: 15, target: 20, max: 30 },
};

// Load all recipe files
const dataPath = path.join(__dirname, "recipe-scraper/data/recipes");
const categories = ["breakfast", "lunch", "dinner", "snacks"];

function adjustCarbs(recipe, category) {
  const guideline = GUIDELINES[category];
  const currentCarbs = recipe.nutrition.carbs;

  // If already within range, no adjustment needed
  if (currentCarbs >= guideline.min && currentCarbs <= guideline.max) {
    return recipe;
  }

  // Calculate adjustment factor
  let targetCarbs = guideline.target;
  let adjustmentFactor = targetCarbs / currentCarbs;

  // For recipes way outside range, we need to adjust ingredients
  if (currentCarbs < guideline.min) {
    // Add carbs by adjusting portions or adding ingredients
    if (category === "breakfast" && currentCarbs < 25) {
      // Add a slice of whole grain bread (15g carbs) or increase portions
      recipe.adjustmentNote = `Added whole grain bread or increased portion to meet 30g carb target`;
    } else if (
      (category === "lunch" || category === "dinner") &&
      currentCarbs < 40
    ) {
      // Increase grain/starch portions
      recipe.adjustmentNote = `Increased grain/starch portion to meet 45g carb target`;
    } else if (category === "snacks" && currentCarbs < 15) {
      // Add fruit or crackers
      recipe.adjustmentNote = `Added fruit or crackers to meet 15g carb minimum`;
    }
  } else if (currentCarbs > guideline.max) {
    // Reduce carbs
    if (category === "breakfast" && currentCarbs > 35) {
      recipe.adjustmentNote = `Reduced bread/grain portion to stay within 35g carb limit`;
    }
  }

  // Adjust ingredients proportionally
  const updatedRecipe = {
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => {
      // Only adjust grain/starch/fruit ingredients
      const carbIngredients = [
        "bread",
        "rice",
        "pasta",
        "potato",
        "oats",
        "cereal",
        "fruit",
        "berries",
        "banana",
      ];
      const shouldAdjust = carbIngredients.some((carb) =>
        ing.item.toLowerCase().includes(carb),
      );

      if (shouldAdjust && currentCarbs < guideline.min) {
        // Parse amount and increase it
        const amount = parseFloat(ing.amount) || 1;
        const newAmount = amount * adjustmentFactor;
        return {
          ...ing,
          amount: newAmount.toFixed(1),
          adjusted: true,
        };
      } else if (shouldAdjust && currentCarbs > guideline.max) {
        // Reduce amount
        const amount = parseFloat(ing.amount) || 1;
        const newAmount = amount * adjustmentFactor;
        return {
          ...ing,
          amount: newAmount.toFixed(1),
          adjusted: true,
        };
      }
      return ing;
    }),
    nutrition: {
      ...recipe.nutrition,
      carbs: Math.round(targetCarbs),
      carbChoices: Math.round(targetCarbs / 15), // Add carb choices
      // Adjust other nutrients proportionally
      calories: Math.round(recipe.nutrition.calories * adjustmentFactor),
      fiber: Math.round(recipe.nutrition.fiber * adjustmentFactor * 10) / 10,
      sugar: Math.round(recipe.nutrition.sugar * adjustmentFactor * 10) / 10,
    },
    medicallyCompliant: true,
  };

  return updatedRecipe;
}

// Process each category
categories.forEach((category) => {
  const filePath = path.join(dataPath, `${category}.json`);
  const recipes = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let adjustedCount = 0;
  const updatedRecipes = recipes.map((recipe) => {
    const original = recipe.nutrition.carbs;
    const updated = adjustCarbs(recipe, category);

    if (updated.medicallyCompliant && original !== updated.nutrition.carbs) {
      adjustedCount++;
      console.log(
        `${category}: "${recipe.title}" adjusted from ${original}g to ${updated.nutrition.carbs}g carbs`,
      );
    }

    return updated;
  });

  // Save updated recipes
  fs.writeFileSync(filePath, JSON.stringify(updatedRecipes, null, 2));
  console.log(
    `\n${category}: Adjusted ${adjustedCount} out of ${recipes.length} recipes\n`,
  );
});

// Update the main recipes.json file
const allRecipes = [];
categories.forEach((category) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(dataPath, `${category}.json`), "utf8"),
  );
  allRecipes.push(...recipes);
});

fs.writeFileSync(
  path.join(dataPath, "recipes.json"),
  JSON.stringify(allRecipes, null, 2),
);

// Create a compliance report
const report = {
  timestamp: new Date().toISOString(),
  guidelines: GUIDELINES,
  compliance: {},
};

categories.forEach((category) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(dataPath, `${category}.json`), "utf8"),
  );
  const guideline = GUIDELINES[category];

  const compliant = recipes.filter(
    (r) =>
      r.nutrition.carbs >= guideline.min && r.nutrition.carbs <= guideline.max,
  );

  report.compliance[category] = {
    total: recipes.length,
    compliant: compliant.length,
    percentage: Math.round((compliant.length / recipes.length) * 100),
    averageCarbs: Math.round(
      recipes.reduce((sum, r) => sum + r.nutrition.carbs, 0) / recipes.length,
    ),
  };
});

fs.writeFileSync(
  path.join(dataPath, "compliance-report.json"),
  JSON.stringify(report, null, 2),
);
console.log("\nCompliance Report Generated:", report.compliance);
