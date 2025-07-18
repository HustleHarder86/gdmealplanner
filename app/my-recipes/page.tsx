"use client";

import { useState, useEffect } from 'react';
import { Recipe } from '@/src/types/recipe';
import { UserRecipeService } from '@/src/services/user-recipe-service';
import { useAuth } from '@/src/contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, Clock, Users, Search, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CustomRecipeForm from '@/src/components/recipe/CustomRecipeForm';

export default function MyRecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadRecipes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userRecipes = await UserRecipeService.getUserRecipes(user.uid);
      setRecipes(userRecipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]); // loadRecipes depends on user, so only user as dependency

  const handleRecipeSaved = (recipe: Recipe) => {
    setRecipes(prev => [recipe, ...prev]);
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await UserRecipeService.deleteRecipe(recipeId, user.uid);
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      }
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to manage your recipes.</p>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <CustomRecipeForm
          onSave={handleRecipeSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
          initialData={editingRecipe || undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipes</h1>
        <p className="text-gray-600">Manage your personal collection of GD-friendly recipes</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Categories</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Recipe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{recipes.length}</div>
          <div className="text-sm text-gray-600">Total Recipes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {recipes.filter(r => r.category === 'breakfast').length}
          </div>
          <div className="text-sm text-gray-600">Breakfast</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {recipes.filter(r => r.category === 'lunch' || r.category === 'dinner').length}
          </div>
          <div className="text-sm text-gray-600">Main Meals</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {recipes.filter(r => r.category === 'snack').length}
          </div>
          <div className="text-sm text-gray-600">Snacks</div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 p-4 bg-red-50 border border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <Card className="text-center p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'No recipes found' 
                  : 'No recipes yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start building your personal recipe collection'}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="primary"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Recipe
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={() => handleEditRecipe(recipe)}
                  onDelete={() => handleDeleteRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
}

function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const categoryColors = {
    breakfast: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-green-100 text-green-800',
    dinner: 'bg-blue-100 text-blue-800',
    snack: 'bg-purple-100 text-purple-800',
  };

  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Recipe Image */}
      <div className="h-48 bg-gray-100 relative">
        {recipe.imageUrl && !imageError ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🍽️</div>
              <div className="text-gray-500 text-sm">No image</div>
            </div>
          </div>
        )}
        
        {/* Privacy indicator */}
        {recipe.isPrivate && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Private
          </div>
        )}
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {recipe.title}
          </h3>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
            categoryColors[recipe.category]
          }`}>
            {recipe.category}
          </span>
        </div>

        {recipe.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Recipe Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.totalTime}min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="font-medium text-green-600">
            {recipe.nutrition.carbohydrates}g carbs
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1 flex-1"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}