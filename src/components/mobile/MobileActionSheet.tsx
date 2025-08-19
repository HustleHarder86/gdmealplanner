"use client";

import { useEffect, useRef } from 'react';

interface ActionItem {
  icon: string;
  label: string;
  action: () => void;
  destructive?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionItem[];
}

export default function MobileActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  actions 
}: MobileActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`mobile-action-sheet w-full max-h-[80vh] ${isOpen ? '' : 'closed'}`}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-neutral-300 rounded-full"></div>
        </div>

        {/* Title */}
        {title && (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 mb-6">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                onClose();
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl text-left touch-feedback transition-colors ${
                action.destructive 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span className="text-xl w-6 text-center">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full p-4 bg-neutral-100 text-neutral-700 font-semibold rounded-xl touch-feedback"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}