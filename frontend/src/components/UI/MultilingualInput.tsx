import React, { useState } from 'react'
import { useI18n } from '../../contexts/I18nProvider'

// Multilingual Input Field Component
interface MultilingualInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  value: {
    en: string
    ne: string
  }
  onChange: (value: { en: string; ne: string }) => void
  error?: {
    en?: string
    ne?: string
  }
  helpText?: string
  icon?: string
  required?: boolean
  showLanguageIndicator?: boolean
}

export const MultilingualInputField: React.FC<MultilingualInputFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helpText,
  icon,
  required,
  showLanguageIndicator = true,
  className = '',
  ...props
}) => {
  const { language } = useI18n()
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ne'>(language)
  
  const inputId = props.id || props.name
  const errorId = error?.[activeLanguage] ? `${inputId}-error` : undefined
  const helpId = helpText ? `${inputId}-help` : undefined
  const describedBy = [errorId, helpId].filter(Boolean).join(' ')

  const handleInputChange = (lang: 'en' | 'ne', inputValue: string) => {
    onChange({
      ...value,
      [lang]: inputValue
    })
  }

  const getLanguageLabel = (lang: 'en' | 'ne') => {
    return lang === 'en' ? 'English' : 'नेपाली'
  }

  const hasContent = (lang: 'en' | 'ne') => {
    return value[lang] && value[lang].trim().length > 0
  }

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

      {showLanguageIndicator && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setActiveLanguage('en')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'en'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            English {hasContent('en') && '✓'}
          </button>
          <button
            type="button"
            onClick={() => setActiveLanguage('ne')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'ne'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            नेपाली {hasContent('ne') && '✓'}
          </button>
        </div>
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
          aria-invalid={!!error?.[activeLanguage]}
          aria-describedby={describedBy || undefined}
          value={value[activeLanguage]}
          onChange={(e) => handleInputChange(activeLanguage, e.target.value)}
          placeholder={`${props.placeholder || ''} (${getLanguageLabel(activeLanguage)})`}
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
            ${activeLanguage === 'ne' ? 'font-nepali' : ''}
            ${icon ? 'pl-14 sm:pl-12 lg:pl-10' : ''}
            ${error?.[activeLanguage] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error?.[activeLanguage] && (
        <p id={errorId} className="text-base text-red-600 flex items-center gap-2 sm:text-sm" role="alert">
          <span aria-hidden="true">⚠️</span>
          {error[activeLanguage]}
        </p>
      )}
      
      {helpText && !error?.[activeLanguage] && (
        <p id={helpId} className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}

      {/* Show completion status */}
      {showLanguageIndicator && (
        <div className="text-sm text-gray-500">
          {hasContent('en') && hasContent('ne') && (
            <span className="text-green-600">✓ Available in both languages</span>
          )}
          {hasContent('en') && !hasContent('ne') && (
            <span className="text-yellow-600">⚠ English only</span>
          )}
          {!hasContent('en') && hasContent('ne') && (
            <span className="text-yellow-600">⚠ Nepali only</span>
          )}
          {!hasContent('en') && !hasContent('ne') && required && (
            <span className="text-red-600">⚠ Required field</span>
          )}
        </div>
      )}
    </div>
  )
}

// Multilingual Textarea Field Component
interface MultilingualTextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  label?: string
  value: {
    en: string
    ne: string
  }
  onChange: (value: { en: string; ne: string }) => void
  error?: {
    en?: string
    ne?: string
  }
  helpText?: string
  required?: boolean
  showLanguageIndicator?: boolean
}

export const MultilingualTextareaField: React.FC<MultilingualTextareaFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helpText,
  required,
  showLanguageIndicator = true,
  className = '',
  ...props
}) => {
  const { language } = useI18n()
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ne'>(language)
  
  const textareaId = props.id || props.name

  const handleInputChange = (lang: 'en' | 'ne', inputValue: string) => {
    onChange({
      ...value,
      [lang]: inputValue
    })
  }

  const getLanguageLabel = (lang: 'en' | 'ne') => {
    return lang === 'en' ? 'English' : 'नेपाली'
  }

  const hasContent = (lang: 'en' | 'ne') => {
    return value[lang] && value[lang].trim().length > 0
  }

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

      {showLanguageIndicator && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setActiveLanguage('en')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'en'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            English {hasContent('en') && '✓'}
          </button>
          <button
            type="button"
            onClick={() => setActiveLanguage('ne')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'ne'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            नेपाली {hasContent('ne') && '✓'}
          </button>
        </div>
      )}
      
      <textarea
        id={textareaId}
        value={value[activeLanguage]}
        onChange={(e) => handleInputChange(activeLanguage, e.target.value)}
        placeholder={`${props.placeholder || ''} (${getLanguageLabel(activeLanguage)})`}
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
          ${activeLanguage === 'ne' ? 'font-nepali' : ''}
          ${error?.[activeLanguage] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
          ${className}
        `}
        {...props}
      />
      
      {error?.[activeLanguage] && (
        <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
          <span>⚠️</span>
          {error[activeLanguage]}
        </p>
      )}
      
      {helpText && !error?.[activeLanguage] && (
        <p className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}

      {/* Show completion status */}
      {showLanguageIndicator && (
        <div className="text-sm text-gray-500">
          {hasContent('en') && hasContent('ne') && (
            <span className="text-green-600">✓ Available in both languages</span>
          )}
          {hasContent('en') && !hasContent('ne') && (
            <span className="text-yellow-600">⚠ English only</span>
          )}
          {!hasContent('en') && hasContent('ne') && (
            <span className="text-yellow-600">⚠ Nepali only</span>
          )}
          {!hasContent('en') && !hasContent('ne') && required && (
            <span className="text-red-600">⚠ Required field</span>
          )}
        </div>
      )}
    </div>
  )
}