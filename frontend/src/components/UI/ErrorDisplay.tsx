import React from 'react'

interface ErrorDisplayProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  showIcon?: boolean
  onRetry?: () => void
  retryText?: string
  onDismiss?: () => void
  className?: string
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  type = 'error',
  showIcon = true,
  onRetry,
  retryText = 'Try Again',
  onDismiss,
  className = ''
}) => {
  const typeStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '❌',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <span className={`text-xl ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className={`text-sm font-medium ${styles.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          
          <p className={`text-sm ${styles.messageColor}`}>
            {message}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${styles.buttonColor}`}
                >
                  {retryText}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay

// Specialized error components
export const PageError: React.FC<{
  title?: string
  message: string
  onRetry?: () => void
}> = ({ title = 'Something went wrong', message, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full">
      <ErrorDisplay
        title={title}
        message={message}
        onRetry={onRetry}
        className="text-center"
      />
    </div>
  </div>
)

export const SectionError: React.FC<{
  message: string
  onRetry?: () => void
}> = ({ message, onRetry }) => (
  <div className="py-12 px-4">
    <ErrorDisplay
      message={message}
      onRetry={onRetry}
      className="max-w-md mx-auto"
    />
  </div>
)

export const InlineError: React.FC<{
  message: string
  type?: 'error' | 'warning' | 'info'
}> = ({ message, type = 'error' }) => (
  <ErrorDisplay
    message={message}
    type={type}
    showIcon={false}
    className="text-sm"
  />
)