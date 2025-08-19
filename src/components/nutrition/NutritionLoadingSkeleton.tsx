import React from 'react';

export default function NutritionLoadingSkeleton() {
  return (
    <div className="container py-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 skeleton-loading rounded-lg"></div>
          <div className="h-4 w-80 skeleton-loading rounded-md"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-32 skeleton-loading rounded-lg"></div>
          <div className="h-12 w-24 skeleton-loading rounded-lg"></div>
        </div>
      </div>

      {/* Daily Summary Card Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200 mb-8">
        <div className="h-6 w-32 skeleton-loading rounded-md mb-4"></div>
        
        {/* Macro stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-16 skeleton-loading rounded-lg mx-auto"></div>
              <div className="h-4 w-12 skeleton-loading rounded-md mx-auto"></div>
              <div className="h-3 w-16 skeleton-loading rounded-sm mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Micronutrients skeleton */}
        <div className="pt-4 border-t border-neutral-200">
          <div className="h-4 w-40 skeleton-loading rounded-md mb-3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 w-24 skeleton-loading rounded-md"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Macro Progress Rings Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200 mb-8">
        <div className="h-6 w-36 skeleton-loading rounded-md mb-4"></div>
        
        {/* Progress rings skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="relative mx-auto mb-2">
                <div className="w-24 h-24 rounded-full skeleton-loading"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-4 w-8 skeleton-loading rounded-sm mb-1"></div>
                  <div className="h-3 w-6 skeleton-loading rounded-sm"></div>
                </div>
              </div>
              <div className="h-4 w-12 skeleton-loading rounded-md mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Water intake skeleton */}
        <div className="pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 skeleton-loading rounded-md"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 skeleton-loading rounded"></div>
              <div className="h-8 w-20 skeleton-loading rounded-lg"></div>
              <div className="w-8 h-8 skeleton-loading rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Log Cards Skeleton */}
      <div className="grid gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <div className="h-5 w-20 skeleton-loading rounded-md"></div>
                <div className="h-4 w-32 skeleton-loading rounded-sm"></div>
              </div>
              <div className="text-right space-y-1">
                <div className="h-4 w-24 skeleton-loading rounded-sm"></div>
                <div className="h-3 w-20 skeleton-loading rounded-sm"></div>
              </div>
            </div>
            
            <div className="h-4 w-40 skeleton-loading rounded-sm mb-3"></div>
            <div className="h-10 w-full skeleton-loading rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Quick Snacks Skeleton */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
        <div className="h-5 w-36 skeleton-loading rounded-md mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 skeleton-loading rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mt-8 flex flex-wrap gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-32 skeleton-loading rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}