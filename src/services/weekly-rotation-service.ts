import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { 
  WeeklyRotationPlan, 
  RotationLibrary, 
  CurrentWeekInfo, 
  RotationTrack, 
  ROTATION_TRACKS 
} from '@/src/types/weekly-rotation';

const ROTATION_COLLECTION = 'weekly_rotations';
const ROTATION_LIBRARY_COLLECTION = 'rotation_libraries';

/**
 * WeeklyRotationService
 * 
 * Manages the current week selection, track switching, and rotation state
 * Provides the main interface for the Smart Rotation system
 */
export class WeeklyRotationService {
  
  /**
   * Get the current week's meal plan for a user
   */
  static async getCurrentWeekInfo(
    userId: string, 
    preferredTrack?: RotationTrack
  ): Promise<CurrentWeekInfo> {
    try {
      // Get user's preferred track or default to 'standard'
      const track = preferredTrack || await this.getUserPreferredTrack(userId) || 'standard';
      
      // Get current week number (1-52 based on year)
      const weekOfYear = this.getCurrentWeekOfYear();
      
      // Get rotation library for this track
      const library = await this.getRotationLibrary(track);
      
      if (!library || library.plans.length === 0) {
        throw new Error(`No rotation library found for track: ${track}`);
      }
      
      // Calculate current week in rotation (cycles through available weeks)
      const rotationWeek = ((weekOfYear - 1) % library.totalWeeks) + 1;
      
      // Find the current and next week plans
      const currentWeek = library.plans.find(p => p.weekNumber === rotationWeek);
      const nextRotationWeek = (rotationWeek % library.totalWeeks) + 1;
      const nextWeek = library.plans.find(p => p.weekNumber === nextRotationWeek);
      
      if (!currentWeek) {
        throw new Error(`Week ${rotationWeek} not found in ${track} rotation`);
      }
      
      return {
        currentWeek,
        nextWeek: nextWeek || null,
        weekOfYear,
        rotationTrack: track,
        weekProgress: {
          current: rotationWeek,
          total: library.totalWeeks,
        },
      };
      
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error getting current week:', error);
      throw new Error(`Failed to get current week: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Switch user to a different rotation track
   */
  static async switchTrack(userId: string, newTrack: RotationTrack): Promise<CurrentWeekInfo> {
    try {
      // Save user's new track preference
      await this.saveUserTrackPreference(userId, newTrack);
      
      // Get current week info for new track
      const weekInfo = await this.getCurrentWeekInfo(userId, newTrack);
      
      console.log(`[WEEKLY_ROTATION] User ${userId} switched to ${newTrack} track`);
      return weekInfo;
      
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error switching track:', error);
      throw new Error(`Failed to switch track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get all available rotation tracks with metadata
   */
  static getAvailableTracks() {
    return ROTATION_TRACKS;
  }
  
  /**
   * Get preview of next week without switching
   */
  static async getNextWeekPreview(
    userId: string, 
    track?: RotationTrack
  ): Promise<WeeklyRotationPlan | null> {
    try {
      const currentInfo = await this.getCurrentWeekInfo(userId, track);
      return currentInfo.nextWeek;
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error getting next week preview:', error);
      return null;
    }
  }
  
  /**
   * Store a rotation library in Firebase
   */
  static async storeRotationLibrary(library: RotationLibrary): Promise<void> {
    try {
      const docRef = doc(db, ROTATION_LIBRARY_COLLECTION, library.track);
      await setDoc(docRef, library);
      
      console.log(`[WEEKLY_ROTATION] Stored ${library.track} library with ${library.plans.length} weeks`);
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error storing library:', error);
      throw new Error(`Failed to store rotation library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Store all rotation libraries
   */
  static async storeAllRotationLibraries(libraries: RotationLibrary[]): Promise<void> {
    try {
      const promises = libraries.map(library => this.storeRotationLibrary(library));
      await Promise.all(promises);
      
      console.log(`[WEEKLY_ROTATION] Stored ${libraries.length} rotation libraries`);
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error storing all libraries:', error);
      throw error;
    }
  }
  
  /**
   * Get a rotation library from Firebase
   */
  static async getRotationLibrary(track: RotationTrack): Promise<RotationLibrary | null> {
    try {
      const docRef = doc(db, ROTATION_LIBRARY_COLLECTION, track);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.warn(`[WEEKLY_ROTATION] No library found for track: ${track}`);
        return null;
      }
      
      return docSnap.data() as RotationLibrary;
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error getting library:', error);
      return null;
    }
  }
  
  /**
   * Check if rotation libraries exist and are up to date
   */
  static async checkLibraryStatus(): Promise<{
    [track in RotationTrack]: {
      exists: boolean;
      weekCount: number;
      lastGenerated: string | null;
      isOutdated: boolean;
    }
  }> {
    const status = {} as any;
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    for (const trackConfig of ROTATION_TRACKS) {
      try {
        const library = await this.getRotationLibrary(trackConfig.track);
        
        if (library) {
          const lastGenerated = new Date(library.lastGenerated);
          const isOutdated = Date.now() - lastGenerated.getTime() > maxAgeMs;
          
          status[trackConfig.track] = {
            exists: true,
            weekCount: library.plans.length,
            lastGenerated: library.lastGenerated,
            isOutdated,
          };
        } else {
          status[trackConfig.track] = {
            exists: false,
            weekCount: 0,
            lastGenerated: null,
            isOutdated: true,
          };
        }
      } catch (error) {
        console.error(`[WEEKLY_ROTATION] Error checking ${trackConfig.track} status:`, error);
        status[trackConfig.track] = {
          exists: false,
          weekCount: 0,
          lastGenerated: null,
          isOutdated: true,
        };
      }
    }
    
    return status;
  }
  
  /**
   * Get user's preferred rotation track
   */
  private static async getUserPreferredTrack(userId: string): Promise<RotationTrack | null> {
    try {
      const docRef = doc(db, 'user_preferences', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.preferredRotationTrack || null;
      }
      
      return null;
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error getting user track preference:', error);
      return null;
    }
  }
  
  /**
   * Save user's preferred rotation track
   */
  private static async saveUserTrackPreference(userId: string, track: RotationTrack): Promise<void> {
    try {
      const docRef = doc(db, 'user_preferences', userId);
      await setDoc(docRef, {
        preferredRotationTrack: track,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error saving user track preference:', error);
      throw error;
    }
  }
  
  /**
   * Get current week of year (1-52)
   */
  private static getCurrentWeekOfYear(): number {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    
    // Ensure we stay within 1-52 range
    return Math.max(1, Math.min(52, weekNumber));
  }
  
  /**
   * Get week info for a specific week number (for admin/testing)
   */
  static async getSpecificWeek(
    track: RotationTrack, 
    weekNumber: number
  ): Promise<WeeklyRotationPlan | null> {
    try {
      const library = await this.getRotationLibrary(track);
      if (!library) return null;
      
      return library.plans.find(p => p.weekNumber === weekNumber) || null;
    } catch (error) {
      console.error('[WEEKLY_ROTATION] Error getting specific week:', error);
      return null;
    }
  }
  
  /**
   * Get rotation statistics for admin dashboard
   */
  static async getRotationStats(): Promise<{
    totalLibraries: number;
    totalWeeks: number;
    trackStats: Array<{
      track: RotationTrack;
      name: string;
      weekCount: number;
      lastGenerated: string | null;
      isHealthy: boolean;
    }>;
  }> {
    const libraries = await Promise.all(
      ROTATION_TRACKS.map(async (config) => ({
        config,
        library: await this.getRotationLibrary(config.track),
      }))
    );
    
    const validLibraries = libraries.filter(l => l.library !== null);
    const totalWeeks = validLibraries.reduce((sum, l) => sum + (l.library?.plans.length || 0), 0);
    
    const trackStats = libraries.map(({ config, library }) => ({
      track: config.track,
      name: config.name,
      weekCount: library?.plans.length || 0,
      lastGenerated: library?.lastGenerated || null,
      isHealthy: library !== null && library.plans.length >= 52,
    }));
    
    return {
      totalLibraries: validLibraries.length,
      totalWeeks,
      trackStats,
    };
  }
}