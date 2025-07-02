'use client'

import { useState, useRef, useEffect } from 'react'
import { format, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, getDay, isBefore, isAfter } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  pregnancyDueDate?: Date
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  pregnancyDueDate,
  label,
  placeholder = 'Select date',
  disabled = false,
  required = false,
  error,
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate pregnancy-safe date range if due date is provided
  const safeMinDate = pregnancyDueDate 
    ? subDays(pregnancyDueDate, 280) // ~40 weeks before due date
    : minDate
  
  const safeMaxDate = pregnancyDueDate
    ? pregnancyDueDate
    : maxDate
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = []
    
    // Add empty cells for days before month starts
    const startDay = getDay(start)
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    
    // Add all days in month
    let day = start
    while (day <= end) {
      days.push(new Date(day))
      day = addDays(day, 1)
    }
    
    return days
  }
  
  const isDateDisabled = (date: Date) => {
    if (safeMinDate && isBefore(date, safeMinDate)) return true
    if (safeMaxDate && isAfter(date, safeMaxDate)) return true
    return false
  }
  
  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date)
      setIsOpen(false)
    }
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-lg transition-colors
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}
          ${disabled ? 'bg-neutral-50 cursor-not-allowed' : 'hover:border-neutral-400'}
          focus:outline-none focus:ring-2 focus:ring-offset-2
        `}
        aria-label={label || 'Select date'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-neutral-900' : 'text-neutral-500'}>
            {value ? format(value, 'MMM d, yyyy') : placeholder}
          </span>
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
      
      {/* Calendar dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-neutral-200 p-4"
            style={{ minWidth: '280px' }}
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Previous month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="font-medium text-neutral-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
                aria-label="Next month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-neutral-600 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} />
                }
                
                const isSelected = value && isSameDay(date, value)
                const isDisabled = isDateDisabled(date)
                const isToday = isSameDay(date, new Date())
                
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`
                      relative p-2 text-sm rounded transition-colors
                      ${isSelected ? 'bg-primary-600 text-white font-medium' : ''}
                      ${!isSelected && isToday ? 'bg-primary-50 text-primary-700 font-medium' : ''}
                      ${!isSelected && !isToday && !isDisabled ? 'hover:bg-neutral-100' : ''}
                      ${isDisabled ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-900'}
                    `}
                    aria-label={format(date, 'MMMM d, yyyy')}
                    aria-selected={isSelected}
                  >
                    {format(date, 'd')}
                    {pregnancyDueDate && isSameDay(date, pregnancyDueDate) && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Quick selections */}
            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-1">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDateSelect(addDays(new Date(), 1))}
                className="w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleDateSelect(addDays(new Date(), 7))}
                className="w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                Next week
              </button>
            </div>
            
            {pregnancyDueDate && (
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <div className="w-1 h-1 bg-accent-500 rounded-full" />
                  <span>Due date: {format(pregnancyDueDate, 'MMM d, yyyy')}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Loading skeleton for DatePicker
export function DatePickerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-20 mb-1" />
      <div className="h-10 bg-neutral-200 rounded-lg" />
    </div>
  )
}