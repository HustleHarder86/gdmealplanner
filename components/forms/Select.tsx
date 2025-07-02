'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  options: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, size = 'md', fullWidth, className = '', required, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={`
            bg-white border rounded-lg transition-colors
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:bg-neutral-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p 
            id={`${selectId}-error`}
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'