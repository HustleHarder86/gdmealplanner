"use client";

import { useEffect, useState } from 'react';

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  target: number;
  showCelebration?: boolean;
}

export default function AchievementBadge({ 
  title, 
  description, 
  icon, 
  progress, 
  target, 
  showCelebration = false 
}: AchievementBadgeProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Animate progress from 0 to actual value
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    // Check if just completed
    if (progress >= 100 && !isCompleted) {
      setIsCompleted(true);
    }

    return () => clearTimeout(timer);
  }, [progress, isCompleted]);

  const isAchieved = progress >= 100;

  return (
    <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${
      isAchieved 
        ? 'nutrition-success achievement-glow confetti-burst' 
        : progress > 50 
        ? 'nutrition-warning' 
        : 'nutrition-info'
    } ${showCelebration && isCompleted ? 'achievement-badge' : ''}`}>
      
      {/* Achievement Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 ${
        isAchieved ? 'bg-green-100' : 'bg-neutral-100'
      }`}>
        {isAchieved ? '🏆' : icon}
      </div>

      {/* Title and Description */}
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs opacity-75 mb-3">{description}</p>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${
            isAchieved ? 'progress-excellent' : 'progress-good'
          }`}
          style={{ width: `${Math.min(animatedProgress, 100)}%` }}
        />
      </div>

      {/* Progress Text */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-semibold number-counter">
          {Math.round((animatedProgress / 100) * target)}/{target}
        </span>
        <span className="text-xs font-bold">
          {Math.round(animatedProgress)}%
        </span>
      </div>

      {/* Celebration Effect */}
      {isAchieved && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm animate-pulse">
          ✨
        </div>
      )}
    </div>
  );
}