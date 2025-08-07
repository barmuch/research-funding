'use client'

import { ReactNode, ChangeEvent } from 'react'

interface FormFieldProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'textarea' | 'select'
  value?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  rows?: number
  min?: string | number
  max?: string | number
  step?: string | number
  options?: { value: string; label: string }[]
  children?: ReactNode
  error?: string[]
}

export default function FormField({ 
  label, 
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  rows = 3,
  min,
  max,
  step,
  options = [],
  children,
  error
}: FormFieldProps) {
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"

  const renderInput = () => {
    if (children) {
      return children
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={inputClasses}
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={inputClasses}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={inputClasses}
          />
        )
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && error.length > 0 && (
        <div className="mt-1">
          {error.map((err, index) => (
            <p key={index} className="text-sm text-red-600">{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}
