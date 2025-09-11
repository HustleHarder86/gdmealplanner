"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  PersonalizedGlucoseTargets,
  GlucoseTargetRange,
  GlucoseUnit,
  MealCategory,
  MEAL_CATEGORY_MAPPING,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  convertGlucoseUnit,
} from "@/src/types/glucose";
import { GlucoseTargetsService } from "@/src/services/glucose/glucose-targets-service";

interface GlucoseTargetsSettingsProps {
  onTargetsUpdated?: (targets: PersonalizedGlucoseTargets) => void;
}

export default function GlucoseTargetsSettings({
  onTargetsUpdated,
}: GlucoseTargetsSettingsProps) {
  const { user } = useAuth();
  const [targets, setTargets] = useState<PersonalizedGlucoseTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState<GlucoseUnit>("mg/dL");
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<MealCategory>("post-meal-2hr");
  const [bulkTarget, setBulkTarget] = useState<number>(120);

  // Load existing targets
  useEffect(() => {
    if (user) {
      loadTargets();
    }
  }, [user]);

  const loadTargets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const personalizedTargets = await GlucoseTargetsService.getPersonalizedTargets(user.uid);
      
      if (personalizedTargets) {
        setTargets(personalizedTargets);
        setUnit(personalizedTargets.unit);
      } else {
        // Initialize with default targets
        const defaultTargets = GlucoseTargetsService.getDefaultTargets(unit);
        defaultTargets.userId = user.uid;
        setTargets(defaultTargets);
      }
    } catch (error) {
      console.error("Error loading targets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (newUnit: GlucoseUnit) => {
    if (!targets) return;

    const convertedTargets = GlucoseTargetsService.convertTargetsUnit(targets, newUnit);
    setTargets(convertedTargets);
    setUnit(newUnit);
  };

  const handleSaveTargets = async () => {
    if (!user || !targets) return;

    try {
      setSaving(true);
      const targetsToSave = {
        ...targets,
        userId: user.uid,
        unit,
        updatedAt: new Date(),
      };

      await GlucoseTargetsService.savePersonalizedTargets(targetsToSave);
      
      if (onTargetsUpdated) {
        onTargetsUpdated(targets);
      }
      
      alert("Glucose targets updated successfully!");
    } catch (error) {
      console.error("Error saving targets:", error);
      alert("Error saving targets. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!user) return;

    const defaultTargets = GlucoseTargetsService.getDefaultTargets(unit);
    defaultTargets.userId = user.uid;
    setTargets(defaultTargets);
  };

  const handleBulkUpdate = async () => {
    if (!user || !targets) return;

    try {
      setSaving(true);
      
      const targetRange: GlucoseTargetRange = {
        min: 0,
        max: bulkTarget,
        unit,
      };

      await GlucoseTargetsService.applyBulkCategoryTarget(user.uid, bulkCategory, targetRange);
      
      // Reload targets to reflect changes
      await loadTargets();
      setShowBulkEdit(false);
      
      alert(`Successfully updated all ${bulkCategory} targets to ${bulkTarget} ${unit}`);
    } catch (error) {
      console.error("Error applying bulk update:", error);
      alert("Error updating targets. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateSpecificTarget = (field: keyof PersonalizedGlucoseTargets['targets'], value: number) => {
    if (!targets) return;

    const updatedTargets = {
      ...targets,
      targets: {
        ...targets.targets,
        [field]: {
          min: 0,
          max: value,
          unit,
        }
      }
    };

    setTargets(updatedTargets);
  };

  const getTargetValue = (field: keyof PersonalizedGlucoseTargets['targets']): number => {
    const target = targets?.targets[field];
    return target?.max || 0;
  };

  const getCategoryDescription = (category: MealCategory): string => {
    const descriptions: Record<MealCategory, string> = {
      "fasting": "Fasting/wake up readings",
      "pre-meal": "Before breakfast, lunch, and dinner",
      "post-meal-1hr": "1 hour after all meals",
      "post-meal-2hr": "2 hours after all meals",
      "snacks": "Before and after snacks",
      "bedtime": "Bedtime and middle-of-night readings"
    };
    return descriptions[category];
  };

  const getDefaultValue = (field: keyof PersonalizedGlucoseTargets['targets']): number => {
    const defaults = unit === "mmol/L" ? DEFAULT_GLUCOSE_TARGETS_MMOL : DEFAULT_GLUCOSE_TARGETS_MGDL;
    
    if (field === 'fasting') return defaults.fasting.max;
    if (field?.includes('1hr')) return defaults.postMeal1hr.max;
    if (field?.includes('2hr')) return defaults.postMeal2hr.max;
    
    return defaults.postMeal2hr.max; // Default for other fields
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!targets) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-600">Unable to load glucose targets.</p>
        <button
          onClick={loadTargets}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Glucose Target Settings</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Customize your glucose targets based on your doctor's recommendations
          </p>
        </div>
        
        {/* Unit Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Unit:</label>
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as GlucoseUnit)}
            className="px-3 py-1 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="mg/dL">mg/dL</option>
            <option value="mmol/L">mmol/L</option>
          </select>
        </div>
      </div>

      {/* Bulk Edit Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-blue-900">Quick Bulk Update</h3>
          <button
            onClick={() => setShowBulkEdit(!showBulkEdit)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showBulkEdit ? "Hide" : "Show"} Bulk Edit
          </button>
        </div>
        
        {showBulkEdit && (
          <div className="space-y-4">
            <p className="text-sm text-blue-800">
              Set all targets for a specific category to the same value (e.g., all lunch targets to 110 {unit})
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Category</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as MealCategory)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(MEAL_CATEGORY_MAPPING).map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-600 mt-1">
                  {getCategoryDescription(bulkCategory)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Target Value ({unit})
                </label>
                <input
                  type="number"
                  value={bulkTarget}
                  onChange={(e) => setBulkTarget(Number(e.target.value))}
                  min="50"
                  max="300"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleBulkUpdate}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Apply to All"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Target Settings */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Individual Target Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Fasting */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Fasting / Wake Up (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('fasting')}
              onChange={(e) => updateSpecificTarget('fasting', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="200"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('fasting')} {unit}
            </p>
          </div>

          {/* Post-Breakfast 2hr */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              2hr After Breakfast (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('postBreakfast2hr')}
              onChange={(e) => updateSpecificTarget('postBreakfast2hr', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="300"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('postBreakfast2hr')} {unit}
            </p>
          </div>

          {/* Post-Lunch 2hr */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              2hr After Lunch (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('postLunch2hr')}
              onChange={(e) => updateSpecificTarget('postLunch2hr', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="300"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('postLunch2hr')} {unit}
            </p>
          </div>

          {/* Post-Dinner 2hr */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              2hr After Dinner (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('postDinner2hr')}
              onChange={(e) => updateSpecificTarget('postDinner2hr', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="300"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('postDinner2hr')} {unit}
            </p>
          </div>

          {/* 1hr targets */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              1hr After Breakfast (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('postBreakfast1hr')}
              onChange={(e) => updateSpecificTarget('postBreakfast1hr', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="300"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('postBreakfast1hr')} {unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              1hr After Lunch (&lt; {unit})
            </label>
            <input
              type="number"
              value={getTargetValue('postLunch1hr')}
              onChange={(e) => updateSpecificTarget('postLunch1hr', Number(e.target.value))}
              step={unit === "mmol/L" ? "0.1" : "1"}
              min="50"
              max="300"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Default: {getDefaultValue('postLunch1hr')} {unit}
            </p>
          </div>

        </div>

        {/* Notes Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Doctor's Notes / Instructions
          </label>
          <textarea
            value={targets.notes || ""}
            onChange={(e) => setTargets({...targets, notes: e.target.value})}
            placeholder="Add any specific instructions from your healthcare provider..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Healthcare Provider */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Set by Healthcare Provider
          </label>
          <input
            type="text"
            value={targets.setBy || ""}
            onChange={(e) => setTargets({...targets, setBy: e.target.value})}
            placeholder="Dr. Smith, Diabetes Clinic"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleResetToDefaults}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
        >
          Reset to Defaults
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleSaveTargets}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Important</h3>
            <p className="text-sm text-amber-700">
              Only change these targets based on your healthcare provider's specific recommendations. 
              The default values follow standard gestational diabetes guidelines and are appropriate for most patients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}