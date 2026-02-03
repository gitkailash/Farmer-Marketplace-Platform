import React from 'react'

interface LanguageIndicatorProps {
  language: 'en' | 'ne'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LanguageIndicator: React.FC<LanguageIndicatorProps> = ({ 
  language, 
  size = 'sm', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const languageConfig = {
    en: {
      label: 'EN',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      title: 'Content available in English only'
    },
    ne: {
      label: 'नेपाली',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      title: 'Content available in Nepali only'
    }
  }

  const config = languageConfig[language]

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
        ${className}
      `}
      title={config.title}
      aria-label={config.title}
    >
      {config.label}
    </span>
  )
}

export default LanguageIndicator