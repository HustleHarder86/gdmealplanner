'use client'

import { useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/forms/Input'
import Select from '@/components/forms/Select'

interface GlucoseEntryProps {
  onSubmit?: (data: GlucoseReading) => void
}

interface GlucoseReading {
  value: number
  unit: 'mg/dL' | 'mmol/L'
  mealTiming: string
  timestamp: Date
  notes?: string
}

export default function GlucoseEntry({ onSubmit }: GlucoseEntryProps) {
  const [reading, setReading] = useState('')
  const [unit, setUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL')
  const [mealTiming, setMealTiming] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const mealTimingOptions = [
    { value: 'fasting', label: 'Fasting' },
    { value: 'pre-breakfast', label: 'Before Breakfast' },
    { value: 'post-breakfast', label: '1hr After Breakfast' },
    { value: 'pre-lunch', label: 'Before Lunch' },
    { value: 'post-lunch', label: '1hr After Lunch' },
    { value: 'pre-dinner', label: 'Before Dinner' },
    { value: 'post-dinner', label: '1hr After Dinner' },
    { value: 'bedtime', label: 'Bedtime' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const value = parseFloat(reading)
    if (isNaN(value)) {
      setError('Please enter a valid number')
      return
    }

    // Validate ranges
    if (unit === 'mg/dL' && (value < 20 || value > 600)) {
      setError('Value must be between 20 and 600 mg/dL')
      return
    }
    if (unit === 'mmol/L' && (value < 1.1 || value > 33.3)) {
      setError('Value must be between 1.1 and 33.3 mmol/L')
      return
    }

    const glucoseReading: GlucoseReading = {
      value,
      unit,
      mealTiming,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    }

    onSubmit?.(glucoseReading)
    
    // Reset form
    setReading('')
    setNotes('')
  }

  const getTargetRange = () => {
    if (!mealTiming) return null
    
    const targets = {
      'fasting': { min: 60, max: 95, label: 'Target: 60-95 mg/dL' },
      'pre-breakfast': { min: 60, max: 95, label: 'Target: 60-95 mg/dL' },
      'post-breakfast': { min: 90, max: 140, label: 'Target: <140 mg/dL (1hr)' },
      'pre-lunch': { min: 60, max: 105, label: 'Target: 60-105 mg/dL' },
      'post-lunch': { min: 90, max: 140, label: 'Target: <140 mg/dL (1hr)' },
      'pre-dinner': { min: 60, max: 105, label: 'Target: 60-105 mg/dL' },
      'post-dinner': { min: 90, max: 140, label: 'Target: <140 mg/dL (1hr)' },
      'bedtime': { min: 90, max: 120, label: 'Target: 90-120 mg/dL' },
    }
    
    return targets[mealTiming as keyof typeof targets]
  }

  const targetRange = getTargetRange()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Glucose Reading</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Glucose Value Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                label="Blood Glucose"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder={unit === 'mg/dL' ? '95' : '5.3'}
                step={unit === 'mg/dL' ? '1' : '0.1'}
                required
                error={error}
              />
            </div>
            <div className="w-32">
              <Select
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'mg/dL' | 'mmol/L')}
                options={[
                  { value: 'mg/dL', label: 'mg/dL' },
                  { value: 'mmol/L', label: 'mmol/L' },
                ]}
              />
            </div>
          </div>

          {/* Meal Timing */}
          <Select
            label="When was this reading taken?"
            value={mealTiming}
            onChange={(e) => setMealTiming(e.target.value)}
            options={mealTimingOptions}
            placeholder="Select timing"
            required
          />

          {/* Target Range Display */}
          {targetRange && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700">{targetRange.label}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Any relevant notes about this reading..."
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" fullWidth>
            Log Reading
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}