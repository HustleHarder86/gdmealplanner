import { InputHTMLAttributes, forwardRef } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={`
                h-4 w-4 rounded border-neutral-300 text-primary-600
                focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : ''}
                ${className}
              `}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? `${props.id}-error` : description ? `${props.id}-description` : undefined
              }
              {...props}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-neutral-700">
              {label}
            </label>
            {description && (
              <p id={`${props.id}-description`} className="text-neutral-500">
                {description}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox