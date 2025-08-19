import { NutritionInfo, NutritionGoals } from "@/src/types/nutrition";
import { useEffect, useState } from "react";

interface MacroProgressRingsProps {
  nutrition: NutritionInfo;
  goals: NutritionGoals;
}

export default function MacroProgressRings({
  nutrition,
  goals,
}: MacroProgressRingsProps) {
  const [animatedProgress, setAnimatedProgress] = useState([0, 0, 0]);
  
  const calculateProgress = (value: number, min: number, max: number) => {
    const target = (min + max) / 2;
    return Math.min((value / target) * 100, 100);
  };

  const macros = [
    {
      name: "Carbs",
      value: nutrition.carbohydrates,
      progress: calculateProgress(
        nutrition.carbohydrates,
        goals.carbohydrates.min,
        goals.carbohydrates.max
      ),
      gradientId: "carbsGradient",
      gradientColors: ["#3B82F6", "#06B6D4"], // blue to cyan
      bgColor: "#E0F2FE",
      glowColor: "rgba(59, 130, 246, 0.4)",
    },
    {
      name: "Protein", 
      value: nutrition.protein,
      progress: calculateProgress(
        nutrition.protein,
        goals.protein.min,
        goals.protein.max
      ),
      gradientId: "proteinGradient",
      gradientColors: ["#10B981", "#059669"], // emerald gradient
      bgColor: "#D1FAE5",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
    {
      name: "Fat",
      value: nutrition.fat,
      progress: calculateProgress(
        nutrition.fat,
        goals.fat.min,
        goals.fat.max
      ),
      gradientId: "fatGradient", 
      gradientColors: ["#F59E0B", "#D97706"], // amber to orange
      bgColor: "#FEF3C7",
      glowColor: "rgba(245, 158, 11, 0.4)",
    },
  ];

  // Animate progress rings on mount
  useEffect(() => {
    const finalProgress = macros.map(m => m.progress);
    const duration = 1500; // 1.5 seconds
    const steps = 60; // 60fps
    const stepDuration = duration / steps;
    
    let step = 0;
    const interval = setInterval(() => {
      const progress = finalProgress.map(target => {
        const easeOut = 1 - Math.pow(1 - step / steps, 3); // Cubic ease-out
        return target * easeOut;
      });
      
      setAnimatedProgress(progress);
      step++;
      
      if (step >= steps) {
        clearInterval(interval);
        setAnimatedProgress(finalProgress); // Ensure exact final values
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [nutrition.carbohydrates, nutrition.protein, nutrition.fat]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {macros.map((macro, index) => {
        const currentProgress = animatedProgress[index];
        const isNearTarget = macro.progress >= 80;
        const circumference = 2 * Math.PI * 36;
        const strokeDasharray = `${(currentProgress / 100) * circumference} ${circumference}`;
        
        return (
          <div key={macro.name} className="text-center">
            <div className="relative inline-flex items-center justify-center mb-2">
              <svg 
                className="w-28 h-28 transform -rotate-90 transition-all duration-300" 
                style={{ 
                  filter: isNearTarget ? `drop-shadow(0 0 8px ${macro.glowColor})` : 'none'
                }}
              >
                <defs>
                  {/* Gradient definition */}
                  <linearGradient id={macro.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={macro.gradientColors[0]} />
                    <stop offset="100%" stopColor={macro.gradientColors[1]} />
                  </linearGradient>
                  
                  {/* Glow filter for achievement effect */}
                  <filter id={`glow-${index}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Background circle */}
                <circle
                  cx="56"
                  cy="56"
                  r="36"
                  fill="none"
                  strokeWidth="6"
                  stroke={macro.bgColor}
                />
                
                {/* Progress circle */}
                <circle
                  cx="56"
                  cy="56" 
                  r="36"
                  fill="none"
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  stroke={`url(#${macro.gradientId})`}
                  className={`transition-all duration-100 ${isNearTarget ? 'animate-pulse' : ''}`}
                  style={{
                    filter: isNearTarget ? `url(#glow-${index})` : 'none'
                  }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-neutral-800">
                  {macro.value}g
                </span>
                <span className="text-xs text-neutral-600 font-medium">
                  {Math.round(currentProgress)}%
                </span>
              </div>
            </div>
            
            <div className="mt-1">
              <div className="text-sm font-medium text-neutral-700">{macro.name}</div>
              {isNearTarget && (
                <div className="text-xs text-green-600 font-medium mt-1 animate-bounce">
                  🎯 On Track!
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}