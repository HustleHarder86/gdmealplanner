'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  labelPosition?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  id?: string
}

const sizeConfig = {
  sm: { 
    switch: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
    label: 'text-sm'
  },
  md: { 
    switch: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    label: 'text-sm'
  },
  lg: { 
    switch: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    label: 'text-base'
  }
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ 
    checked, 
    onChange, 
    label, 
    labelPosition = 'right',
    size = 'md', 
    disabled = false,
    className = '',
    id
  }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`
    const config = sizeConfig[size]
    
    const handleClick = () => {
      if (!disabled) {
        onChange(!checked)
      }
    }
    
    const switchElement = (
      <button
        ref={ref}
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        className={`
          relative inline-flex items-center rounded-full transition-colors
          ${config.switch}
          ${checked ? 'bg-primary-600' : 'bg-neutral-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${className}
        `}
      >
        <motion.span
          className={`
            inline-block rounded-full bg-white shadow-sm
            ${config.thumb}
          `}
          animate={{
            x: checked ? config.translate.replace('translate-x-', '') : '0.125rem'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    )
    
    if (!label) {
      return switchElement
    }
    
    return (
      <label
        htmlFor={switchId}
        className={`
          inline-flex items-center gap-3 cursor-pointer
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      >
        {labelPosition === 'left' && (
          <span className={`
            ${config.label}
            ${disabled ? 'text-neutral-500' : 'text-neutral-700'}
          `}>
            {label}
          </span>
        )}
        
        {switchElement}
        
        {labelPosition === 'right' && (
          <span className={`
            ${config.label}
            ${disabled ? 'text-neutral-500' : 'text-neutral-700'}
          `}>
            {label}
          </span>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'