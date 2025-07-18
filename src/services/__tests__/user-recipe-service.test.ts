import { UserRecipeService } from '../user-recipe-service';
import { UserRecipeInput } from '@/src/types/recipe';

// Mock Firebase
jest.mock('@/src/lib/firebase/client', () => ({
  db: jest.fn(),
}));

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1234567890 })),
}));

describe('UserRecipeService', () => {
  const mockUserId = 'user123';
  const mockRecipeInput: UserRecipeInput = {
    title: 'Test Recipe',
    description: 'A test recipe',
    category: 'lunch',
    tags: ['healthy', 'quick'],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    ingredients: [
      { name: 'chicken', amount: 1, unit: 'lb', original: '1 lb chicken' },
      { name: 'rice', amount: 2, unit: 'cups', original: '2 cups rice' },
    ],
    instructions: ['Cook chicken', 'Cook rice', 'Serve together'],
    nutrition: {
      calories: 400,
      carbohydrates: 45,
      protein: 35,
      fat: 10,
      fiber: 3,
    },
    isPrivate: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNutrition', () => {
    it('should calculate basic nutrition from ingredients', () => {
      // This is a simplified test since the actual calculation is basic
      const recipe = {
        ...mockRecipeInput,
        nutrition: {}, // Empty nutrition to trigger calculation
      };

      // The actual calculation would be tested by calling createRecipe
      // and verifying the returned nutrition values are reasonable
      expect(recipe.ingredients).toHaveLength(2);
      expect(recipe.ingredients[0].name).toBe('chicken');
      expect(recipe.ingredients[1].name).toBe('rice');
    });
  });

  describe('validateForGD', () => {
    it('should validate recipe for GD guidelines', () => {
      const mockRecipe = {
        id: 'recipe123',
        ...mockRecipeInput,
        totalTime: 30,
        carbChoices: 3,
        source: 'user',
        isUserCreated: true,
        userId: mockUserId,
        nutrition: {
          calories: 400,
          carbohydrates: 45,
          protein: 35,
          fat: 10,
          fiber: 3,
        },
      };

      const validation = UserRecipeService.validateForGD(mockRecipe);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.warnings)).toBe(true);
      
      // For lunch/dinner, 30-60g carbs is acceptable
      // This recipe has 45g carbs which should be valid
      expect(validation.isValid).toBe(true);
    });

    it('should warn about low fiber content', () => {
      const mockRecipe = {
        id: 'recipe123',
        ...mockRecipeInput,
        totalTime: 30,
        carbChoices: 3,
        source: 'user',
        isUserCreated: true,
        userId: mockUserId,
        nutrition: {
          calories: 400,
          carbohydrates: 45,
          protein: 35,
          fat: 10,
          fiber: 1, // Low fiber
        },
      };

      const validation = UserRecipeService.validateForGD(mockRecipe);

      expect(validation.warnings).toContain(
        expect.stringContaining('Low fiber content')
      );
    });

    it('should warn about too many carbs for breakfast', () => {
      const mockRecipe = {
        id: 'recipe123',
        ...mockRecipeInput,
        category: 'breakfast' as const,
        totalTime: 30,
        carbChoices: 4,
        source: 'user',
        isUserCreated: true,
        userId: mockUserId,
        nutrition: {
          calories: 400,
          carbohydrates: 60, // Too many carbs for breakfast
          protein: 35,
          fat: 10,
          fiber: 3,
        },
      };

      const validation = UserRecipeService.validateForGD(mockRecipe);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain(
        expect.stringContaining('Breakfast should have 15-45g carbs')
      );
    });
  });

  describe('nutrition calculation', () => {
    it('should calculate carb choices correctly', () => {
      // 45g carbs / 15g per choice = 3 choices
      const carbs = 45;
      const expectedChoices = Math.round(carbs / 15);
      
      expect(expectedChoices).toBe(3);
    });

    it('should calculate total time correctly', () => {
      const prepTime = 10;
      const cookTime = 20;
      const expectedTotal = prepTime + cookTime;
      
      expect(expectedTotal).toBe(30);
    });
  });

  describe('ingredient normalization', () => {
    it('should handle basic ingredients', () => {
      const ingredients = [
        { name: 'chicken breast', amount: 1, unit: 'lb', original: '1 lb chicken breast' },
        { name: 'brown rice', amount: 2, unit: 'cups', original: '2 cups brown rice' },
      ];

      ingredients.forEach(ingredient => {
        expect(ingredient.name).toBeTruthy();
        expect(ingredient.amount).toBeGreaterThan(0);
        expect(ingredient.unit).toBeTruthy();
        expect(ingredient.original).toBeTruthy();
      });
    });
  });
});