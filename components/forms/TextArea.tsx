'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    label, 
    error, 
    helperText,
    fullWidth, 
    resize = 'vertical',
    className = '', 
    required, 
    id, 
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3 py-2 bg-white border rounded-lg transition-colors
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:bg-neutral-50 disabled:cursor-not-allowed
            ${resize === 'none' ? 'resize-none' : ''}
            ${resize === 'vertical' ? 'resize-y' : ''}
            ${resize === 'horizontal' ? 'resize-x' : ''}
            ${resize === 'both' ? 'resize' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : 
            helperText ? `${textareaId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {helperText && !error && (
          <p 
            id={`${textareaId}-helper`}
            className="mt-1 text-sm text-neutral-600"
          >
            {helperText}
          </p>
        )}
        
        {error && (
          <p 
            id={`${textareaId}-error`}
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

TextArea.displayName = 'TextArea'