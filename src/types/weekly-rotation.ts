import { MealPlan } from './meal-plan';

export type RotationTrack = 'standard' | 'vegetarian' | 'quick' | 'family';

export interface WeeklyRotationPlan {
  id: string;
  weekNumber: number; // 1-52+
  rotationTrack: RotationTrack;
  mealPlan: MealPlan;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  lastUpdated: string;
}

export interface RotationLibrary {
  track: RotationTrack;
  totalWeeks: number;
  plans: WeeklyRotationPlan[];
  lastGenerated: string;
}

export interface CurrentWeekInfo {
  currentWeek: WeeklyRotationPlan;
  nextWeek: WeeklyRotationPlan | null;
  weekOfYear: number;
  rotationTrack: RotationTrack;
  weekProgress: {
    current: number;
    total: number;
  };
}

export interface RotationTrackConfig {
  track: RotationTrack;
  name: string;
  description: string;
  icon: string;
  dietaryFilters?: string[];
  preferences?: {
    maxCookTime?: number;
    servingSize?: 'individual' | 'family';
    complexity?: 'simple' | 'moderate' | 'advanced';
  };
}

export const ROTATION_TRACKS: RotationTrackConfig[] = [
  {
    track: 'standard',
    name: 'Balanced GD',
    description: 'Well-balanced meal plans following GD guidelines',
    icon: '⚖️',
  },
  {
    track: 'vegetarian',
    name: 'Vegetarian',
    description: 'Plant-based meals with complete proteins',
    icon: '🌱',
    dietaryFilters: ['vegetarian'],
  },
  {
    track: 'quick',
    name: 'Quick Meals',
    description: 'Meals ready in 30 minutes or less',
    icon: '⚡',
    preferences: {
      maxCookTime: 30,
      complexity: 'simple',
    },
  },
  {
    track: 'family',
    name: 'Family Style',
    description: 'Kid-friendly meals for larger families',
    icon: '👨‍👩‍👧‍👦',
    preferences: {
      servingSize: 'family',
      complexity: 'moderate',
    },
  },
];