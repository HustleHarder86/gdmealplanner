'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  indeterminate?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}

const labelSizeClasses = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base'
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, size = 'md', indeterminate, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div>
        <div className="flex items-center">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={`
                appearance-none bg-white border-2 rounded transition-colors cursor-pointer
                ${error ? 'border-red-300' : 'border-neutral-300'}
                ${sizeClasses[size]}
                checked:bg-primary-600 checked:border-primary-600
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:bg-neutral-100 disabled:cursor-not-allowed
                ${className}
              `}
              aria-invalid={!!error}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              {...props}
            />
            
            {/* Check mark */}
            <svg
              className={`
                absolute inset-0 pointer-events-none text-white
                ${sizeClasses[size]}
                ${props.checked ? 'opacity-100' : 'opacity-0'}
                transition-opacity
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {indeterminate ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 12h14" 
                />
              ) : (
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: props.checked ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </svg>
          </div>
          
          {label && (
            <label
              htmlFor={checkboxId}
              className={`
                ml-2 cursor-pointer select-none
                ${labelSizeClasses[size]}
                ${props.disabled ? 'text-neutral-500' : 'text-neutral-700'}
              `}
            >
              {label}
            </label>
          )}
        </div>
        
        {error && (
          <p 
            id={`${checkboxId}-error`}
            className="mt-1 text-sm text-red-600 ml-6" 
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'