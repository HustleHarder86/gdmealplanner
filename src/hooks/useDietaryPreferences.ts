/**
 * Hook for managing user dietary preferences
 */

import { useState, useEffect } from 'react';
import { DietaryPreferences, DietaryRestriction } from '@/src/types/dietary';
import { useAuth } from '@/src/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';

const DEFAULT_PREFERENCES: DietaryPreferences = {
  restrictions: [],
  dislikes: [],
  allergies: [],
};

export function useDietaryPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DietaryPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from Firebase when user changes
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.dietaryPreferences) {
            setPreferences(data.dietaryPreferences);
          }
        }
      } catch (error) {
        console.error('Error loading dietary preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  // Save preferences to Firebase
  const savePreferences = async (newPreferences: DietaryPreferences) => {
    if (!user) {
      // Store in localStorage for non-authenticated users
      localStorage.setItem('dietaryPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          dietaryPreferences: newPreferences,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Toggle a dietary restriction
  const toggleRestriction = async (restriction: DietaryRestriction) => {
    const newRestrictions = preferences.restrictions.includes(restriction)
      ? preferences.restrictions.filter(r => r !== restriction)
      : [...preferences.restrictions, restriction];

    await savePreferences({
      ...preferences,
      restrictions: newRestrictions,
    });
  };

  // Add a disliked ingredient
  const addDislike = async (ingredient: string) => {
    if (!ingredient || preferences.dislikes.includes(ingredient)) return;

    await savePreferences({
      ...preferences,
      dislikes: [...preferences.dislikes, ingredient],
    });
  };

  // Remove a disliked ingredient
  const removeDislike = async (ingredient: string) => {
    await savePreferences({
      ...preferences,
      dislikes: preferences.dislikes.filter(d => d !== ingredient),
    });
  };

  // Add an allergy
  const addAllergy = async (allergen: string) => {
    if (!allergen || preferences.allergies.includes(allergen)) return;

    await savePreferences({
      ...preferences,
      allergies: [...preferences.allergies, allergen],
    });
  };

  // Remove an allergy
  const removeAllergy = async (allergen: string) => {
    await savePreferences({
      ...preferences,
      allergies: preferences.allergies.filter(a => a !== allergen),
    });
  };

  // Clear all preferences
  const clearPreferences = async () => {
    await savePreferences(DEFAULT_PREFERENCES);
  };

  // Load from localStorage for non-authenticated users
  useEffect(() => {
    if (!user && !loading) {
      const stored = localStorage.getItem('dietaryPreferences');
      if (stored) {
        try {
          setPreferences(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing stored preferences:', error);
        }
      }
    }
  }, [user, loading]);

  return {
    preferences,
    loading,
    saving,
    toggleRestriction,
    addDislike,
    removeDislike,
    addAllergy,
    removeAllergy,
    clearPreferences,
    savePreferences,
  };
}