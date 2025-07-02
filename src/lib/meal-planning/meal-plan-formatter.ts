import { WeeklyMealPlan, DailyMealPlan, ShoppingListItem } from './types';
import { Recipe, NutritionInfo } from '@/types/firebase';

export interface PrintableMealPlan {
  html: string;
  css: string;
}

export class MealPlanFormatter {
  /**
   * Generate printable HTML/CSS for meal plan
   */
  static generatePrintableView(
    mealPlan: WeeklyMealPlan,
    includeShoppingList: boolean = true,
    includeNutrition: boolean = true
  ): PrintableMealPlan {
    const css = this.generatePrintCSS();
    const html = this.generatePrintHTML(mealPlan, includeShoppingList, includeNutrition);
    
    return { html, css };
  }

  /**
   * Generate HTML for printable meal plan
   */
  private static generatePrintHTML(
    mealPlan: WeeklyMealPlan,
    includeShoppingList: boolean,
    includeNutrition: boolean
  ): string {
    const startDate = mealPlan.startDate.toLocaleDateString();
    const endDate = mealPlan.endDate.toLocaleDateString();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meal Plan ${startDate} - ${endDate}</title>
        <style>${this.generatePrintCSS()}</style>
      </head>
      <body>
        <div class="meal-plan-container">
          <header>
            <h1>Weekly Meal Plan</h1>
            <p class="date-range">${startDate} - ${endDate}</p>
          </header>
          
          <div class="meal-grid">
            ${mealPlan.days.map((day, index) => this.generateDayHTML(day, index)).join('')}
          </div>
          
          ${includeNutrition ? this.generateNutritionSummaryHTML(mealPlan) : ''}
          ${includeShoppingList ? this.generateShoppingListHTML(mealPlan.shoppingList) : ''}
          
          <footer>
            <p class="tips-header">Gestational Diabetes Tips:</p>
            <ul class="tips">
              <li>Test blood sugar 1-2 hours after starting each meal</li>
              <li>Aim for blood sugar under 140 mg/dL at 1 hour or under 120 mg/dL at 2 hours</li>
              <li>Pair carbohydrates with protein and healthy fats</li>
              <li>Stay hydrated throughout the day</li>
              <li>Take a short walk after meals when possible</li>
            </ul>
          </footer>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate HTML for a single day
   */
  private static generateDayHTML(day: DailyMealPlan, dayIndex: number): string {
    const dayName = this.getDayName(day.date);
    const dateStr = day.date.toLocaleDateString();
    
    return `
      <div class="day-column">
        <h2>${dayName}</h2>
        <p class="date">${dateStr}</p>
        
        <div class="meals">
          ${this.generateMealHTML('Breakfast', day.breakfast, '7:00 AM')}
          ${this.generateMealHTML('Morning Snack', day.morningSnack, '10:00 AM')}
          ${this.generateMealHTML('Lunch', day.lunch, '12:30 PM')}
          ${this.generateMealHTML('Afternoon Snack', day.afternoonSnack, '3:30 PM')}
          ${this.generateMealHTML('Dinner', day.dinner, '6:30 PM')}
          ${this.generateMealHTML('Evening Snack', day.eveningSnack, '9:00 PM')}
        </div>
        
        <div class="day-totals">
          <strong>Daily Totals:</strong>
          <span>Carbs: ${day.totalNutrition.carbs}g</span>
          <span>Protein: ${day.totalNutrition.protein}g</span>
          <span>Calories: ${day.totalNutrition.calories}</span>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for a single meal
   */
  private static generateMealHTML(mealType: string, recipe: Recipe | null, suggestedTime: string): string {
    if (!recipe) {
      return `
        <div class="meal-slot empty">
          <h3>${mealType}</h3>
          <p class="time">${suggestedTime}</p>
          <p class="no-meal">No meal planned</p>
        </div>
      `;
    }
    
    return `
      <div class="meal-slot">
        <h3>${mealType}</h3>
        <p class="time">${suggestedTime}</p>
        <p class="recipe-name">${recipe.title}</p>
        <div class="nutrition-brief">
          <span>Carbs: ${recipe.nutrition.carbs}g</span>
          <span>Protein: ${recipe.nutrition.protein}g</span>
        </div>
        <p class="prep-time">Prep: ${recipe.prepTime + recipe.cookTime} min</p>
      </div>
    `;
  }

  /**
   * Generate nutrition summary HTML
   */
  private static generateNutritionSummaryHTML(mealPlan: WeeklyMealPlan): string {
    const dailyAverages = this.calculateDailyAverages(mealPlan);
    
    return `
      <div class="nutrition-summary page-break">
        <h2>Weekly Nutrition Summary</h2>
        <div class="nutrition-grid">
          <div class="nutrition-item">
            <h3>Daily Averages</h3>
            <ul>
              <li>Calories: ${dailyAverages.calories}</li>
              <li>Carbohydrates: ${dailyAverages.carbs}g</li>
              <li>Protein: ${dailyAverages.protein}g</li>
              <li>Fat: ${dailyAverages.fat}g</li>
              <li>Fiber: ${dailyAverages.fiber}g</li>
            </ul>
          </div>
          <div class="nutrition-item">
            <h3>Carb Distribution</h3>
            <ul>
              <li>Breakfast: ~30g</li>
              <li>Morning Snack: ~15g</li>
              <li>Lunch: ~45g</li>
              <li>Afternoon Snack: ~15g</li>
              <li>Dinner: ~45g</li>
              <li>Evening Snack: ~20g</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate shopping list HTML
   */
  private static generateShoppingListHTML(shoppingList: ShoppingListItem[]): string {
    const categorizedList = this.categorizeShoppingList(shoppingList);
    
    return `
      <div class="shopping-list page-break">
        <h2>Shopping List</h2>
        ${Array.from(categorizedList.entries()).map(([category, items]) => `
          <div class="category">
            <h3>${category}</h3>
            <ul class="checklist">
              ${items.map(item => `
                <li>
                  <input type="checkbox" id="${item.name.replace(/\s/g, '-')}">
                  <label for="${item.name.replace(/\s/g, '-')}">
                    ${item.amount} ${item.unit} ${item.name}
                  </label>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate print-optimized CSS
   */
  private static generatePrintCSS(): string {
    return `
      @media print {
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          font-size: 10pt;
        }
        
        .page-break {
          page-break-before: always;
        }
      }
      
      body {
        font-family: Arial, sans-serif;
        line-height: 1.4;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 20px;
      }
      
      h1 {
        color: #e74c3c;
        margin-bottom: 10px;
      }
      
      .date-range {
        font-size: 14pt;
        color: #666;
      }
      
      .meal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }
      
      .day-column {
        border: 1px solid #ddd;
        padding: 15px;
        border-radius: 8px;
      }
      
      .day-column h2 {
        color: #e74c3c;
        font-size: 14pt;
        margin-bottom: 5px;
      }
      
      .date {
        font-size: 9pt;
        color: #666;
        margin-bottom: 15px;
      }
      
      .meal-slot {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      
      .meal-slot:last-child {
        border-bottom: none;
      }
      
      .meal-slot h3 {
        font-size: 11pt;
        margin-bottom: 3px;
        color: #2c3e50;
      }
      
      .time {
        font-size: 9pt;
        color: #7f8c8d;
        margin-bottom: 5px;
      }
      
      .recipe-name {
        font-weight: bold;
        font-size: 10pt;
        margin-bottom: 5px;
      }
      
      .nutrition-brief {
        font-size: 9pt;
        color: #34495e;
      }
      
      .nutrition-brief span {
        margin-right: 10px;
      }
      
      .prep-time {
        font-size: 8pt;
        color: #95a5a6;
        font-style: italic;
      }
      
      .day-totals {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 2px solid #e74c3c;
        font-size: 9pt;
      }
      
      .day-totals span {
        display: block;
      }
      
      .nutrition-summary {
        background-color: #f8f8f8;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .nutrition-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .shopping-list {
        background-color: #f0f0f0;
        padding: 20px;
        border-radius: 8px;
      }
      
      .category {
        margin-bottom: 20px;
      }
      
      .category h3 {
        color: #e74c3c;
        margin-bottom: 10px;
      }
      
      .checklist {
        list-style: none;
        padding: 0;
      }
      
      .checklist li {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }
      
      .checklist input[type="checkbox"] {
        margin-right: 10px;
        width: 15px;
        height: 15px;
      }
      
      footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e74c3c;
      }
      
      .tips-header {
        font-weight: bold;
        color: #e74c3c;
        margin-bottom: 10px;
      }
      
      .tips {
        font-size: 9pt;
        color: #555;
      }
      
      .tips li {
        margin-bottom: 5px;
      }
      
      .empty .no-meal {
        color: #999;
        font-style: italic;
      }
    `;
  }

  /**
   * Helper methods
   */
  private static getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private static calculateDailyAverages(mealPlan: WeeklyMealPlan): {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
  } {
    const totals = mealPlan.days.reduce((sum, day) => ({
      calories: sum.calories + day.totalNutrition.calories,
      carbs: sum.carbs + day.totalNutrition.carbs,
      protein: sum.protein + day.totalNutrition.protein,
      fat: sum.fat + day.totalNutrition.fat,
      fiber: sum.fiber + (day.totalNutrition.fiber || 0)
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 });

    const days = mealPlan.days.length || 1;

    return {
      calories: Math.round(totals.calories / days),
      carbs: Math.round(totals.carbs / days),
      protein: Math.round(totals.protein / days),
      fat: Math.round(totals.fat / days),
      fiber: Math.round(totals.fiber / days)
    };
  }

  private static categorizeShoppingList(items: ShoppingListItem[]): Map<string, ShoppingListItem[]> {
    const categorized = new Map<string, ShoppingListItem[]>();
    
    items.forEach(item => {
      if (!categorized.has(item.category)) {
        categorized.set(item.category, []);
      }
      categorized.get(item.category)!.push(item);
    });
    
    // Sort categories for logical shopping order
    const sortedCategories = new Map<string, ShoppingListItem[]>();
    const categoryOrder = ['Vegetables', 'Fruits', 'Protein', 'Dairy', 'Grains', 'Healthy Fats', 'Other'];
    
    categoryOrder.forEach(cat => {
      if (categorized.has(cat)) {
        sortedCategories.set(cat, categorized.get(cat)!);
      }
    });
    
    return sortedCategories;
  }

  /**
   * Generate simplified text version of meal plan
   */
  static generateTextVersion(mealPlan: WeeklyMealPlan): string {
    let text = `MEAL PLAN: ${mealPlan.startDate.toLocaleDateString()} - ${mealPlan.endDate.toLocaleDateString()}\n`;
    text += '='.repeat(60) + '\n\n';

    mealPlan.days.forEach((day, index) => {
      text += `${this.getDayName(day.date).toUpperCase()} (${day.date.toLocaleDateString()})\n`;
      text += '-'.repeat(40) + '\n';
      
      text += `Breakfast (7:00 AM): ${day.breakfast?.title || 'Not planned'}\n`;
      if (day.breakfast) text += `  Carbs: ${day.breakfast.nutrition.carbs}g, Protein: ${day.breakfast.nutrition.protein}g\n`;
      
      text += `Morning Snack (10:00 AM): ${day.morningSnack?.title || 'Not planned'}\n`;
      if (day.morningSnack) text += `  Carbs: ${day.morningSnack.nutrition.carbs}g, Protein: ${day.morningSnack.nutrition.protein}g\n`;
      
      text += `Lunch (12:30 PM): ${day.lunch?.title || 'Not planned'}\n`;
      if (day.lunch) text += `  Carbs: ${day.lunch.nutrition.carbs}g, Protein: ${day.lunch.nutrition.protein}g\n`;
      
      text += `Afternoon Snack (3:30 PM): ${day.afternoonSnack?.title || 'Not planned'}\n`;
      if (day.afternoonSnack) text += `  Carbs: ${day.afternoonSnack.nutrition.carbs}g, Protein: ${day.afternoonSnack.nutrition.protein}g\n`;
      
      text += `Dinner (6:30 PM): ${day.dinner?.title || 'Not planned'}\n`;
      if (day.dinner) text += `  Carbs: ${day.dinner.nutrition.carbs}g, Protein: ${day.dinner.nutrition.protein}g\n`;
      
      text += `Evening Snack (9:00 PM): ${day.eveningSnack?.title || 'Not planned'}\n`;
      if (day.eveningSnack) text += `  Carbs: ${day.eveningSnack.nutrition.carbs}g, Protein: ${day.eveningSnack.nutrition.protein}g\n`;
      
      text += `\nDaily Totals: ${day.totalNutrition.carbs}g carbs, ${day.totalNutrition.protein}g protein, ${day.totalNutrition.calories} calories\n\n`;
    });

    return text;
  }
}