"use client";

import { useState } from 'react';
import { UserRecipeInput, Ingredient } from '@/src/types/recipe';
import { UserRecipeService } from '@/src/services/user-recipe-service';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRecipes } from '@/src/providers/recipe-provider';
import { Plus, Minus, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CustomRecipeFormProps {
  onSave?: (recipe: any) => void;
  onCancel?: () => void;
  initialData?: Partial<UserRecipeInput>;
}

export default function CustomRecipeForm({ onSave, onCancel, initialData }: CustomRecipeFormProps) {
  const { user } = useAuth();
  const { refreshUserRecipes } = useRecipes();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<UserRecipeInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'lunch',
    tags: initialData?.tags || [],
    prepTime: initialData?.prepTime || 10,
    cookTime: initialData?.cookTime || 20,
    servings: initialData?.servings || 4,
    ingredients: initialData?.ingredients || [{ name: '', amount: 0, unit: '', original: '' }],
    instructions: initialData?.instructions || [''],
    nutrition: initialData?.nutrition || {},
    isPrivate: initialData?.isPrivate || false,
  });

  const [newTag, setNewTag] = useState('');
  const [gdValidation, setGdValidation] = useState<{ isValid: boolean; warnings: string[] } | null>(null);

  const handleInputChange = (field: keyof UserRecipeInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors([]);
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };
    
    // Update the original field for display
    if (field === 'name' || field === 'amount' || field === 'unit') {
      const ingredient = newIngredients[index];
      newIngredients[index].original = `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
    }
    
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients,
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: 0, unit: '', original: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions,
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index),
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) newErrors.push('Recipe title is required');
    if (formData.prepTime < 0) newErrors.push('Prep time cannot be negative');
    if (formData.cookTime < 0) newErrors.push('Cook time cannot be negative');
    if (formData.servings < 1) newErrors.push('Servings must be at least 1');
    
    const validIngredients = formData.ingredients.filter(ing => ing.name.trim() && ing.amount > 0);
    if (validIngredients.length === 0) newErrors.push('At least one ingredient is required');
    
    const validInstructions = formData.instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) newErrors.push('At least one instruction is required');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrors(['You must be logged in to create recipes']);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setErrors([]);

    try {
      // Clean up the data before saving
      const cleanedData = {
        ...formData,
        ingredients: formData.ingredients.filter(ing => ing.name.trim() && ing.amount > 0),
        instructions: formData.instructions.filter(inst => inst.trim()),
      };

      const recipe = await UserRecipeService.createRecipe(user.uid, cleanedData);
      
      // Validate for GD guidelines
      const validation = UserRecipeService.validateForGD(recipe);
      setGdValidation(validation);
      
      // Refresh the recipe provider to include the new recipe
      await refreshUserRecipes();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      if (onSave) {
        onSave(recipe);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to save recipe']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Custom Recipe</h2>
        <p className="text-gray-600">Add your favorite GD-friendly recipes to use in meal planning</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Recipe saved successfully!</span>
        </div>
      )}

      {/* GD Validation */}
      {gdValidation && (
        <div className={`mb-4 p-4 rounded-lg border ${
          gdValidation.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`h-5 w-5 ${
              gdValidation.isValid ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <span className={`font-medium ${
              gdValidation.isValid ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {gdValidation.isValid ? 'GD-Friendly ✓' : 'GD Guidelines Check'}
            </span>
          </div>
          {gdValidation.warnings.length > 0 && (
            <ul className={`text-sm ${
              gdValidation.isValid ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {gdValidation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Please fix these errors:</span>
          </div>
          <ul className="text-sm text-red-700">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="My Favorite Lasagna"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="A delicious and GD-friendly recipe that..."
          />
        </div>

        {/* Timing and Servings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prep Time (minutes) *
            </label>
            <input
              type="number"
              value={formData.prepTime}
              onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cook Time (minutes) *
            </label>
            <input
              type="number"
              value={formData.cookTime}
              onChange={(e) => handleInputChange('cookTime', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servings *
            </label>
            <input
              type="number"
              value={formData.servings}
              onChange={(e) => handleInputChange('servings', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingredients *
          </label>
          <div className="space-y-3">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="1"
                  className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min="0"
                  step="0.25"
                />
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  placeholder="cup"
                  className="w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  placeholder="ingredient name"
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  disabled={formData.ingredients.length === 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Ingredient
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions *
          </label>
          <div className="space-y-3">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-3">
                <span className="mt-3 text-sm text-gray-500 font-medium min-w-[30px]">
                  {index + 1}.
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  rows={2}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Describe this step..."
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  disabled={formData.instructions.length === 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInstruction}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Step
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag"
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPrivate"
            checked={formData.isPrivate}
            onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
            className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <label htmlFor="isPrivate" className="text-sm text-gray-700">
            Keep this recipe private (only you can see it)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Recipe'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}