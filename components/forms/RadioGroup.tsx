'use client'

import { forwardRef, createContext, useContext, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupProps {
  name: string
  value?: string
  onChange: (value: string) => void
  options: RadioOption[]
  label?: string
  error?: string
  required?: boolean
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface RadioContextValue {
  name: string
  value?: string
  onChange: (value: string) => void
  size: 'sm' | 'md' | 'lg'
}

const RadioContext = createContext<RadioContextValue | null>(null)

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

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  error,
  required = false,
  orientation = 'vertical',
  size = 'md',
  className = ''
}: RadioGroupProps) {
  const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <RadioContext.Provider value={{ name, value, onChange, size }}>
      <div 
        role="radiogroup" 
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${groupId}-error` : undefined}
        className={className}
      >
        {label && (
          <label 
            id={`${groupId}-label`}
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className={`
          ${orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
        `}>
          {options.map(option => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              disabled={option.disabled}
            />
          ))}
        </div>
        
        {error && (
          <p 
            id={`${groupId}-error`}
            className="mt-2 text-sm text-red-600" 
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </RadioContext.Provider>
  )
}

interface RadioOptionProps {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

function RadioOption({ value, label, description, disabled }: RadioOptionProps) {
  const context = useContext(RadioContext)
  if (!context) throw new Error('RadioOption must be used within RadioGroup')
  
  const { name, value: selectedValue, onChange, size } = context
  const isChecked = selectedValue === value
  const optionId = `${name}-${value}`
  
  return (
    <label 
      htmlFor={optionId}
      className={`
        flex items-start cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="relative mt-0.5">
        <input
          type="radio"
          id={optionId}
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => !disabled && onChange(value)}
          disabled={disabled}
          className="sr-only"
        />
        
        <div className={`
          ${sizeClasses[size]}
          border-2 rounded-full transition-colors
          ${isChecked ? 'border-primary-600' : 'border-neutral-300'}
          ${!disabled && 'hover:border-neutral-400'}
        `}>
          <motion.div
            className="w-full h-full rounded-full bg-primary-600"
            initial={{ scale: 0 }}
            animate={{ scale: isChecked ? 0.6 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
      
      <div className="ml-3">
        <div className={`
          ${labelSizeClasses[size]}
          ${disabled ? 'text-neutral-500' : 'text-neutral-900'}
        `}>
          {label}
        </div>
        {description && (
          <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  )
}