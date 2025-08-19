"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage?: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const metrics: PerformanceMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
        };

        // Observe LCP
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              metrics.largestContentfulPaint = entries[entries.length - 1].startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Observe CLS
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            metrics.cumulativeLayoutShift = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Observe FID
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              metrics.firstInputDelay = (entries[0] as any).processingStart - entries[0].startTime;
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        }

        setTimeout(() => setMetrics(metrics), 3000); // Wait for metrics to settle
      }
    };

    measurePerformance();
  }, []);

  const getScoreColor = (metric: string, value: number) => {
    switch (metric) {
      case 'fcp':
        return value < 1800 ? 'text-green-600' : value < 3000 ? 'text-yellow-600' : 'text-red-600';
      case 'lcp':
        return value < 2500 ? 'text-green-600' : value < 4000 ? 'text-yellow-600' : 'text-red-600';
      case 'cls':
        return value < 0.1 ? 'text-green-600' : value < 0.25 ? 'text-yellow-600' : 'text-red-600';
      case 'fid':
        return value < 100 ? 'text-green-600' : value < 300 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-neutral-600';
    }
  };

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') return Math.round(value) + 'ms';
    if (unit === 'MB') return Math.round(value / 1024 / 1024) + 'MB';
    if (unit === 'score') return value.toFixed(3);
    return value.toString();
  };

  if (!metrics) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors no-print"
        title="Performance Metrics"
      >
        📊
      </button>

      {isVisible && (
        <div className="absolute bottom-14 left-0 bg-white rounded-xl shadow-lg border border-neutral-200 p-4 min-w-80 no-print">
          <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
            ⚡ Performance Metrics
            <button
              onClick={() => setIsVisible(false)}
              className="ml-auto text-neutral-400 hover:text-neutral-600"
            >
              ×
            </button>
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">First Contentful Paint</span>
              <span className={`text-sm font-bold ${getScoreColor('fcp', metrics.firstContentfulPaint)}`}>
                {formatMetric(metrics.firstContentfulPaint, 'ms')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Largest Contentful Paint</span>
              <span className={`text-sm font-bold ${getScoreColor('lcp', metrics.largestContentfulPaint)}`}>
                {formatMetric(metrics.largestContentfulPaint, 'ms')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Cumulative Layout Shift</span>
              <span className={`text-sm font-bold ${getScoreColor('cls', metrics.cumulativeLayoutShift)}`}>
                {formatMetric(metrics.cumulativeLayoutShift, 'score')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">First Input Delay</span>
              <span className={`text-sm font-bold ${getScoreColor('fid', metrics.firstInputDelay)}`}>
                {formatMetric(metrics.firstInputDelay, 'ms')}
              </span>
            </div>

            {metrics.memoryUsage && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Memory Usage</span>
                <span className="text-sm font-bold text-neutral-800">
                  {formatMetric(metrics.memoryUsage, 'MB')}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
            <div className="flex gap-4">
              <span>🟢 Good</span>
              <span>🟡 Needs Improvement</span>
              <span>🔴 Poor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}