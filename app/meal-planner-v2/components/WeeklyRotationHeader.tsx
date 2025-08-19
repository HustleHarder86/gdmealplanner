"use client";

import { useState } from 'react';
import { CurrentWeekInfo, ROTATION_TRACKS, RotationTrack } from '@/src/types/weekly-rotation';
import { ChevronDown, Calendar, RotateCcw, Eye, Sparkles, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface WeeklyRotationHeaderProps {
  currentWeekInfo: CurrentWeekInfo | null;
  loading: boolean;
  onTrackSwitch: (track: RotationTrack) => void;
  onPreviewNext: () => void;
  showingNextWeek?: boolean;
  onAddRecipe?: () => void;
}

export default function WeeklyRotationHeader({
  currentWeekInfo,
  loading,
  onTrackSwitch,
  onPreviewNext,
  showingNextWeek = false,
  onAddRecipe,
}: WeeklyRotationHeaderProps) {
  const [showTrackSelector, setShowTrackSelector] = useState(false);

  if (loading) {
    return (
      <Card className="mb-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  if (!currentWeekInfo) {
    return (
      <Card className="mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Meal Plan Available
            </h2>
            <p className="text-gray-600">
              We&apos;re preparing your weekly rotation. Please check back soon!
            </p>
          </div>
          
          {onAddRecipe && (
            <Button
              onClick={onAddRecipe}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const currentTrack = ROTATION_TRACKS.find(t => t.track === currentWeekInfo.rotationTrack);
  const weekPlan = currentWeekInfo.currentWeek;

  return (
    <Card className="mb-6 p-6">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {showingNextWeek ? 'Coming Next Week' : 'This Week\'s Plan'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {weekPlan.title}
          </h1>
          <p className="text-gray-600">
            {weekPlan.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onAddRecipe && (
            <Button
              onClick={onAddRecipe}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          )}
          
          {!showingNextWeek && currentWeekInfo.nextWeek && (
            <Button
              onClick={onPreviewNext}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Next Week
            </Button>
          )}
          
          <div className="relative">
            <Button
              onClick={() => setShowTrackSelector(!showTrackSelector)}
              variant="secondary"
              className="flex items-center gap-2 min-w-[160px] justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{currentTrack?.icon}</span>
                <span>{currentTrack?.name}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                showTrackSelector ? 'rotate-180' : ''
              }`} />
            </Button>

            {/* Track Selector Dropdown */}
            {showTrackSelector && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                    Switch Meal Plan Style
                  </div>
                  {ROTATION_TRACKS.map((track) => (
                    <button
                      key={track.track}
                      onClick={() => {
                        onTrackSwitch(track.track);
                        setShowTrackSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        track.track === currentWeekInfo.rotationTrack
                          ? 'bg-green-50 text-green-900 border border-green-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{track.icon}</span>
                        <span className="font-medium">{track.name}</span>
                        {track.track === currentWeekInfo.rotationTrack && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {track.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week Progress & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 mb-2 sm:mb-0">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RotateCcw className="h-4 w-4" />
            <span>
              Week {currentWeekInfo.weekProgress.current} of {currentWeekInfo.weekProgress.total}
            </span>
          </div>
          
          {weekPlan.tags && weekPlan.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {weekPlan.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {weekPlan.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{weekPlan.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles className="h-4 w-4" />
          <span>Curated for optimal GD nutrition</span>
        </div>
      </div>

      {/* Next Week Teaser */}
      {!showingNextWeek && currentWeekInfo.nextWeek && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Coming next week:</div>
              <div className="font-medium text-gray-900">
                {currentWeekInfo.nextWeek.title}
              </div>
            </div>
            <Button
              onClick={onPreviewNext}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              Preview →
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}