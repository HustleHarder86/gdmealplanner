import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, className = "", ...props },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={`
            w-full rounded-lg border px-3 py-2
            ${error ? "border-red-500" : "border-neutral-300"}
            focus:outline-none focus:ring-2
            ${error ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-primary-500 focus:border-primary-500"}
            disabled:bg-neutral-50 disabled:text-neutral-500
            ${className}
          `}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${props.id}-hint`} className="mt-1 text-sm text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
