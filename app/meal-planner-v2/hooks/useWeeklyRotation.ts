import { useState, useEffect, useCallback } from 'react';
import { WeeklyRotationService } from '@/src/services/weekly-rotation-service';
import { CurrentWeekInfo, RotationTrack, WeeklyRotationPlan } from '@/src/types/weekly-rotation';
import { MealPlan } from '@/src/types/meal-plan';

interface UseWeeklyRotationReturn {
  currentWeekInfo: CurrentWeekInfo | null;
  loading: boolean;
  error: string | null;
  showingNextWeek: boolean;
  switchTrack: (track: RotationTrack) => Promise<void>;
  previewNextWeek: () => Promise<void>;
  returnToCurrentWeek: () => void;
  refreshCurrentWeek: () => Promise<void>;
  getCurrentMealPlan: () => MealPlan | null;
}

export function useWeeklyRotation(userId: string | undefined): UseWeeklyRotationReturn {
  const [currentWeekInfo, setCurrentWeekInfo] = useState<CurrentWeekInfo | null>(null);
  const [nextWeekPlan, setNextWeekPlan] = useState<WeeklyRotationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingNextWeek, setShowingNextWeek] = useState(false);

  // Load current week info
  const loadCurrentWeek = useCallback(async (preferredTrack?: RotationTrack) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const weekInfo = await WeeklyRotationService.getCurrentWeekInfo(userId, preferredTrack);
      setCurrentWeekInfo(weekInfo);
      setNextWeekPlan(weekInfo.nextWeek);
      
      console.log(`[USE_WEEKLY_ROTATION] Loaded ${weekInfo.rotationTrack} track, week ${weekInfo.weekProgress.current}`);
    } catch (err) {
      console.error('[USE_WEEKLY_ROTATION] Error loading current week:', err);
      
      // Handle the case where rotation system is not yet initialized
      if (err instanceof Error && err.message === 'ROTATION_NOT_INITIALIZED') {
        setError(null); // Don't show error, just no rotation available
        setCurrentWeekInfo(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load weekly meal plan');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initialize on mount and when user changes
  useEffect(() => {
    loadCurrentWeek();
  }, [loadCurrentWeek]);

  // Switch to different rotation track
  const switchTrack = useCallback(async (track: RotationTrack) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      setShowingNextWeek(false); // Return to current week view
      
      const newWeekInfo = await WeeklyRotationService.switchTrack(userId, track);
      setCurrentWeekInfo(newWeekInfo);
      setNextWeekPlan(newWeekInfo.nextWeek);
      
      console.log(`[USE_WEEKLY_ROTATION] Switched to ${track} track`);
    } catch (err) {
      console.error('[USE_WEEKLY_ROTATION] Error switching track:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch meal plan style');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Preview next week
  const previewNextWeek = useCallback(async () => {
    if (!currentWeekInfo || !nextWeekPlan) {
      console.warn('[USE_WEEKLY_ROTATION] No next week available to preview');
      return;
    }

    setShowingNextWeek(true);
    console.log(`[USE_WEEKLY_ROTATION] Previewing next week: ${nextWeekPlan.title}`);
  }, [currentWeekInfo, nextWeekPlan]);

  // Return to current week
  const returnToCurrentWeek = useCallback(() => {
    setShowingNextWeek(false);
    console.log('[USE_WEEKLY_ROTATION] Returned to current week view');
  }, []);

  // Refresh current week (for admin/testing)
  const refreshCurrentWeek = useCallback(async () => {
    await loadCurrentWeek(currentWeekInfo?.rotationTrack);
  }, [loadCurrentWeek, currentWeekInfo?.rotationTrack]);

  // Get the current meal plan to display
  const getCurrentMealPlan = useCallback((): MealPlan | null => {
    if (!currentWeekInfo) return null;
    
    if (showingNextWeek && nextWeekPlan) {
      return nextWeekPlan.mealPlan;
    }
    
    return currentWeekInfo.currentWeek.mealPlan;
  }, [currentWeekInfo, nextWeekPlan, showingNextWeek]);

  return {
    currentWeekInfo,
    loading,
    error,
    showingNextWeek,
    switchTrack,
    previewNextWeek,
    returnToCurrentWeek,
    refreshCurrentWeek,
    getCurrentMealPlan,
  };
}