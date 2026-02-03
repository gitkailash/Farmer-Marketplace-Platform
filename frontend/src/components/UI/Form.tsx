import React from 'react'

// Input Field Component
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: string
  required?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helpText,
  icon,
  required,
  className = '',
  ...props
}) => {
  const inputId = props.id || props.name
  const errorId = error ? `${inputId}-error` : undefined
  const helpId = helpText ? `${inputId}-help` : undefined
  const describedBy = [errorId, helpId].filter(Boolean).join(' ')

  return (
    <div className="space-y-3">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-lg font-medium text-secondary-700 sm:text-base label-accessible"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1 required-indicator" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none sm:pl-4" aria-hidden="true">
            <span className="text-secondary-400 text-2xl sm:text-xl">{icon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={`
            w-full px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
            border-2 rounded-2xl text-lg sm:text-lg lg:text-base
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
            hover:border-secondary-400
            min-h-[64px] sm:min-h-[56px] lg:min-h-[48px]
            bg-white
            touch-manipulation
            -webkit-tap-highlight-color-transparent
            keyboard-nav
            ${icon ? 'pl-14 sm:pl-12 lg:pl-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p id={errorId} className="text-base text-red-600 flex items-center gap-2 sm:text-sm" role="alert">
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={helpId} className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}
    </div>
  )
}

// Textarea Field Component
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helpText?: string
  required?: boolean
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) => {
  const textareaId = props.id || props.name

  return (
    <div className="space-y-3">
      {label && (
        <label 
          htmlFor={textareaId} 
          className="block text-lg font-medium text-secondary-700 sm:text-base"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={`
          w-full px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
          border-2 rounded-2xl text-lg sm:text-lg lg:text-base
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
          hover:border-secondary-400
          min-h-[140px] resize-y
          bg-white
          touch-manipulation
          -webkit-tap-highlight-color-transparent
          ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}
    </div>
  )
}

// Select Field Component
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helpText?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
  required?: boolean
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  error,
  helpText,
  options,
  placeholder,
  required,
  className = '',
  ...props
}) => {
  const selectId = props.id || props.name

  return (
    <div className="space-y-3">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-lg font-medium text-secondary-700 sm:text-base"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          className={`
            w-full px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
            border-2 rounded-2xl text-lg sm:text-lg lg:text-base bg-white 
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
            hover:border-secondary-400
            min-h-[64px] sm:min-h-[56px] lg:min-h-[48px]
            appearance-none cursor-pointer
            touch-manipulation
            -webkit-tap-highlight-color-transparent
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none sm:pr-4">
          <svg className="w-6 h-6 text-secondary-400 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}
    </div>
  )
}

// Checkbox Field Component
interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  error,
  helpText,
  className = '',
  ...props
}) => {
  const checkboxId = props.id || props.name

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          className={`
            h-7 w-7 text-primary-600 border-2 border-secondary-300 rounded-lg mt-1
            focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
            transition-all duration-200 ease-in-out
            cursor-pointer
            touch-manipulation
            sm:h-6 sm:w-6 sm:mt-0.5
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          id={checkboxId}
          {...props}
        />
        
        <label 
          htmlFor={checkboxId} 
          className="text-lg font-medium text-secondary-700 cursor-pointer leading-relaxed sm:text-base"
        >
          {label}
        </label>
      </div>
      
      {error && (
        <p className="text-base text-red-600 flex items-center gap-2 ml-11 sm:text-sm sm:ml-9">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-base text-secondary-500 ml-11 sm:text-sm sm:ml-9">{helpText}</p>
      )}
    </div>
  )
}

// Form Group Component
interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => (
  <div className={`space-y-8 sm:space-y-6 lg:space-y-4 ${className}`}>
    {children}
  </div>
)

// Form Actions Component
interface FormActionsProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  children, 
  align = 'right',
  className = '' 
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  return (
    <div className={`flex flex-col gap-5 sm:flex-row sm:gap-4 lg:gap-3 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  )
}