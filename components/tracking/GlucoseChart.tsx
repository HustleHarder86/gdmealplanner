'use client'

import { GlucoseReading } from '@/src/types/firebase'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

interface GlucoseChartProps {
  readings: GlucoseReading[]
  targetRange?: { min: number; max: number }
  days?: 7 | 14 | 30
  className?: string
}

export function GlucoseChart({ 
  readings, 
  targetRange = { min: 70, max: 140 },
  days = 7,
  className = '' 
}: GlucoseChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  
  // Filter and sort readings for the selected time period
  const filteredReadings = useMemo(() => {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    return readings
      .filter(reading => {
        const date = reading.timestamp.toDate()
        return isWithinInterval(date, { 
          start: startOfDay(startDate), 
          end: endOfDay(endDate) 
        })
      })
      .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime())
  }, [readings, days])
  
  // Calculate chart dimensions and scales
  const chartHeight = 300
  const chartWidth = 800
  const padding = { top: 20, right: 20, bottom: 50, left: 60 }
  
  const { minValue, maxValue, points } = useMemo(() => {
    if (filteredReadings.length === 0) {
      return { minValue: 0, maxValue: 200, points: [] }
    }
    
    const values = filteredReadings.map(r => r.value)
    const min = Math.min(...values, targetRange.min) - 20
    const max = Math.max(...values, targetRange.max) + 20
    
    const xScale = (chartWidth - padding.left - padding.right) / (filteredReadings.length - 1 || 1)
    const yScale = (chartHeight - padding.top - padding.bottom) / (max - min)
    
    const points = filteredReadings.map((reading, index) => ({
      x: padding.left + index * xScale,
      y: chartHeight - padding.bottom - (reading.value - min) * yScale,
      value: reading.value,
      timestamp: reading.timestamp.toDate(),
      mealTag: reading.mealTag,
      notes: reading.notes
    }))
    
    return { minValue: min, maxValue: max, points }
  }, [filteredReadings, targetRange, chartWidth, chartHeight, padding])
  
  // Create path string for the line
  const pathData = points.length > 0
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : ''
  
  // Calculate target range positions
  const targetMinY = chartHeight - padding.bottom - (targetRange.min - minValue) * ((chartHeight - padding.top - padding.bottom) / (maxValue - minValue))
  const targetMaxY = chartHeight - padding.bottom - (targetRange.max - minValue) * ((chartHeight - padding.top - padding.bottom) / (maxValue - minValue))
  
  if (filteredReadings.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Glucose Readings</h3>
        <div className="flex items-center justify-center h-64 text-neutral-500">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No glucose readings for the selected period</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <motion.div 
      className={`bg-white rounded-lg shadow p-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Glucose Readings</h3>
        <div className="text-sm text-neutral-600">
          Last {days} days
        </div>
      </div>
      
      <div className="relative overflow-x-auto">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-auto max-w-full"
          style={{ minHeight: '300px' }}
        >
          {/* Target range background */}
          <rect
            x={padding.left}
            y={targetMaxY}
            width={chartWidth - padding.left - padding.right}
            height={targetMinY - targetMaxY}
            fill="rgb(134 239 172 / 0.2)"
            stroke="rgb(34 197 94)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          
          {/* Grid lines */}
          {[0, 50, 100, 150, 200, 250].map(value => {
            if (value < minValue || value > maxValue) return null
            const y = chartHeight - padding.bottom - (value - minValue) * ((chartHeight - padding.top - padding.bottom) / (maxValue - minValue))
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-neutral-600"
                >
                  {value}
                </text>
              </g>
            )
          })}
          
          {/* X-axis labels */}
          {points.map((point, index) => {
            if (index % Math.ceil(points.length / 7) !== 0) return null
            return (
              <text
                key={index}
                x={point.x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-neutral-600"
              >
                {format(point.timestamp, 'MMM d')}
              </text>
            )
          })}
          
          {/* Line */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="#e85b3c"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === index ? 6 : 4}
                fill={point.value >= targetRange.min && point.value <= targetRange.max ? '#5c955f' : '#e85b3c'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              {/* Tooltip */}
              {hoveredPoint === index && (
                <g>
                  <rect
                    x={point.x - 60}
                    y={point.y - 60}
                    width="120"
                    height="50"
                    rx="4"
                    fill="rgba(0, 0, 0, 0.8)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 40}
                    textAnchor="middle"
                    className="text-xs fill-white font-medium"
                  >
                    {point.value} mg/dL
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 25}
                    textAnchor="middle"
                    className="text-xs fill-white"
                  >
                    {format(point.timestamp, 'MMM d, h:mm a')}
                  </text>
                  {point.mealTag && (
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      className="text-xs fill-white"
                    >
                      {point.mealTag.replace(/_/g, ' ')}
                    </text>
                  )}
                </g>
              )}
            </g>
          ))}
          
          {/* Y-axis label */}
          <text
            x={20}
            y={chartHeight / 2}
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
            textAnchor="middle"
            className="text-sm fill-neutral-600"
          >
            Blood Glucose (mg/dL)
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-neutral-600">In target range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-600 rounded-full" />
          <span className="text-neutral-600">Out of range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-0.5 bg-green-500 opacity-30" />
          <span className="text-neutral-600">Target: {targetRange.min}-{targetRange.max} mg/dL</span>
        </div>
      </div>
    </motion.div>
  )
}

// Loading skeleton for GlucoseChart
export function GlucoseChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-neutral-200 rounded w-32" />
        <div className="h-4 bg-neutral-200 rounded w-20" />
      </div>
      <div className="h-64 bg-neutral-100 rounded" />
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="h-4 bg-neutral-200 rounded w-24" />
        <div className="h-4 bg-neutral-200 rounded w-24" />
        <div className="h-4 bg-neutral-200 rounded w-32" />
      </div>
    </div>
  )
}