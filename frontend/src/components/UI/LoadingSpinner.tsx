import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`mt-3 text-gray-600 ${textSizeClasses[size]} text-center`}>
          {text}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner

// Specialized loading components
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="xl" text={text} />
  </div>
)

export const SectionLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="lg" text={text} />
  </div>
)

export const ButtonLoader: React.FC = () => (
  <LoadingSpinner size="sm" color="white" className="inline-flex" />
)

export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size="sm" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
)