'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  Skeleton,
  Input,
  Select,
  Checkbox,
  RecipeCardEnhanced,
  MealSlot,
  GlucoseEntry,
} from '@/components/ui'
import { mockRecipes } from '@/lib/mock-data'

export default function ComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [checkboxValue, setCheckboxValue] = useState(false)

  return (
    <div className="container py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Component Library</h1>
        <p className="text-neutral-600">All UI components for Pregnancy Plate Planner</p>
      </div>

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>This is a card description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Bordered Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>With border variant.</p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>With shadow on hover.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge size="sm">Small</Badge>
        </div>
      </section>

      {/* Form Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
          <Input
            label="Text Input"
            placeholder="Enter text..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            hint="This is a helpful hint"
          />
          
          <Input
            label="Input with Error"
            placeholder="Enter text..."
            error="This field is required"
          />
          
          <Select
            label="Select Input"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
            ]}
            placeholder="Choose an option"
          />
          
          <div>
            <Checkbox
              id="checkbox-demo"
              label="I agree to the terms"
              description="You must agree before continuing"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
            />
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
        <div className="flex items-center gap-8">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
          <LoadingSpinner size="md" text="Loading recipes..." />
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Skeleton Loaders</h3>
          <div className="space-y-2 max-w-md">
            <Skeleton />
            <Skeleton width="80%" />
            <Skeleton width="60%" />
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Empty States</h2>
        <Card>
          <EmptyState
            icon="🍽️"
            title="No recipes found"
            description="Start by adding your first recipe to build your meal plan"
            action={{
              label: 'Add Recipe',
              onClick: () => console.log('Add recipe'),
            }}
            secondaryAction={{
              label: 'Browse Library',
              onClick: () => console.log('Browse'),
            }}
          />
        </Card>
      </section>

      {/* Recipe Card */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recipe Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <RecipeCardEnhanced
            recipe={mockRecipes[0]}
            onFavorite={() => console.log('Favorite')}
            isFavorite={false}
            showQuickAdd
            onQuickAdd={() => console.log('Quick add')}
          />
          <RecipeCardEnhanced
            recipe={mockRecipes[1]}
            onFavorite={() => console.log('Favorite')}
            isFavorite={true}
          />
        </div>
      </section>

      {/* Meal Planning */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Meal Planning Components</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          <MealSlot
            mealType="breakfast"
            day="Monday"
            targetCarbs={{ min: 30, max: 45 }}
            onAddRecipe={() => console.log('Add recipe')}
          />
          <MealSlot
            mealType="breakfast"
            day="Monday"
            recipe={mockRecipes[0]}
            targetCarbs={{ min: 30, max: 45 }}
            onSwapRecipe={() => console.log('Swap')}
            onRemoveRecipe={() => console.log('Remove')}
          />
          <MealSlot
            mealType="morning-snack"
            day="Monday"
            targetCarbs={{ min: 15, max: 20 }}
            onAddRecipe={() => console.log('Add recipe')}
          />
          <MealSlot
            mealType="morning-snack"
            day="Monday"
            recipe={mockRecipes[3]}
            targetCarbs={{ min: 15, max: 20 }}
            onSwapRecipe={() => console.log('Swap')}
            onRemoveRecipe={() => console.log('Remove')}
          />
        </div>
      </section>

      {/* Tracking Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Tracking Components</h2>
        <div className="max-w-md">
          <GlucoseEntry onSubmit={(data) => console.log('Glucose data:', data)} />
        </div>
      </section>

      {/* Modal */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          description="This is a modal description"
        >
          <p>Modal content goes here. You can put any content inside.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </section>
    </div>
  )
}