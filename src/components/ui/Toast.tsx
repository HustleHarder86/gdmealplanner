"use client";

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'nutrition-success confetti-burst';
      case 'warning':
        return 'nutrition-warning';
      case 'error':
        return 'nutrition-danger';
      case 'info':
        return 'nutrition-info';
      default:
        return 'nutrition-info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl border-2 shadow-lg transition-all duration-300 ${
        isVisible ? 'toast-slide-in opacity-100' : 'opacity-0 translate-y-[-100%]'
      } ${getTypeStyles()}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-lg opacity-60 hover:opacity-100 transition-opacity duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}