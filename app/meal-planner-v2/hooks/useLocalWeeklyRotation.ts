import { useState, useEffect, useCallback } from 'react';
import { LocalWeeklyRotationService } from '@/src/services/local-weekly-rotation';
import { CurrentWeekInfo, RotationTrack, WeeklyRotationPlan } from '@/src/types/weekly-rotation';
import { MealPlan } from '@/src/types/meal-plan';

interface UseLocalWeeklyRotationReturn {
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

export function useLocalWeeklyRotation(userId: string = 'demo-user'): UseLocalWeeklyRotationReturn {
  const [currentWeekInfo, setCurrentWeekInfo] = useState<CurrentWeekInfo | null>(null);
  const [nextWeekPlan, setNextWeekPlan] = useState<WeeklyRotationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingNextWeek, setShowingNextWeek] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<RotationTrack>('standard');

  // Load current week info
  const loadCurrentWeek = useCallback(async (track?: RotationTrack) => {
    try {
      setLoading(true);
      setError(null);
      
      const trackToUse = track || currentTrack;
      const weekInfo = await LocalWeeklyRotationService.getCurrentWeekInfo(userId, trackToUse);
      setCurrentWeekInfo(weekInfo);
      setNextWeekPlan(weekInfo.nextWeek);
      setCurrentTrack(trackToUse);
      
      console.log(`[LOCAL_ROTATION_HOOK] Loaded ${weekInfo.rotationTrack} track, week ${weekInfo.weekProgress.current}`);
    } catch (err) {
      console.error('[LOCAL_ROTATION_HOOK] Error loading current week:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weekly meal plan');
    } finally {
      setLoading(false);
    }
  }, [userId, currentTrack]);

  // Initialize on mount
  useEffect(() => {
    loadCurrentWeek();
  }, [loadCurrentWeek]);

  // Switch track
  const switchTrack = useCallback(async (track: RotationTrack) => {
    try {
      setLoading(true);
      setError(null);
      setShowingNextWeek(false);
      
      const weekInfo = await LocalWeeklyRotationService.switchTrack(userId, track);
      setCurrentWeekInfo(weekInfo);
      setNextWeekPlan(weekInfo.nextWeek);
      setCurrentTrack(track);
      
      console.log(`[LOCAL_ROTATION_HOOK] Switched to ${track} track`);
    } catch (err) {
      console.error('[LOCAL_ROTATION_HOOK] Error switching track:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch track');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Preview next week
  const previewNextWeek = useCallback(async () => {
    if (!nextWeekPlan) return;
    
    try {
      setShowingNextWeek(true);
      console.log('[LOCAL_ROTATION_HOOK] Showing next week preview');
    } catch (err) {
      console.error('[LOCAL_ROTATION_HOOK] Error previewing next week:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview next week');
    }
  }, [nextWeekPlan]);

  // Return to current week
  const returnToCurrentWeek = useCallback(() => {
    setShowingNextWeek(false);
    console.log('[LOCAL_ROTATION_HOOK] Returned to current week');
  }, []);

  // Refresh current week
  const refreshCurrentWeek = useCallback(async () => {
    await loadCurrentWeek(currentTrack);
  }, [loadCurrentWeek, currentTrack]);

  // Get current meal plan (either current week or next week preview)
  const getCurrentMealPlan = useCallback((): MealPlan | null => {
    if (showingNextWeek && nextWeekPlan) {
      return nextWeekPlan.mealPlan;
    }
    return currentWeekInfo?.currentWeek?.mealPlan || null;
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
    getCurrentMealPlan
  };
}