"use client";

import { useState } from 'react';

interface QuickSnackButtonProps {
  snack: {
    name: string;
    emoji: string;
    carbs: number;
    calories: number;
  };
  onClick: (snack: any) => void;
}

export default function QuickSnackButton({ snack, onClick }: QuickSnackButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick(snack);
    
    // Reset animation after it completes
    setTimeout(() => setIsClicked(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-4 bg-white rounded-xl border-2 border-neutral-200 quick-snack-hover button-ripple transition-all duration-200 ${
        isClicked ? 'success-bounce' : ''
      }`}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{snack.emoji}</div>
        <div className="text-sm font-semibold text-neutral-800">{snack.name}</div>
        <div className="text-xs text-neutral-600 mt-1">
          {snack.carbs}g carbs • {snack.calories} cal
        </div>
      </div>
    </button>
  );
}