import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AccessibleError, AccessibleButton, ScreenReaderOnly } from './Accessibility'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showReportButton?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  isOffline: boolean
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isOffline: !navigator.onLine
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    // Clean up event listeners and timeouts
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  handleOnline = () => {
    this.setState({ isOffline: false })
    
    // Auto-retry if we were offline and had an error
    if (this.state.hasError) {
      setTimeout(() => {
        this.handleRetry()
      }, 1000)
    }
  }

  handleOffline = () => {
    this.setState({ isOffline: true })
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to your error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      // Example: Send to monitoring service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
      
      console.log('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleAutoRetry = (delay: number = 2000) => {
    const timeout = setTimeout(() => {
      this.handleRetry()
    }, delay)
    
    this.retryTimeouts.push(timeout)
  }

  handleReportError = () => {
    if (this.state.error) {
      const subject = encodeURIComponent('Error Report: ' + this.state.error.message)
      const body = encodeURIComponent(`
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
      `)
      
      window.open(`mailto:support@farmermarket.com?subject=${subject}&body=${body}`)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries
      const isNetworkError = this.state.error?.message.includes('fetch') || 
                            this.state.error?.message.includes('network') ||
                            this.state.isOffline

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 mobile-card">
              {/* Error Icon */}
              <div className="text-red-500 mb-6">
                <span className="text-6xl" aria-hidden="true">
                  {this.state.isOffline ? '📡' : '😵'}
                </span>
              </div>
              
              {/* Error Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {this.state.isOffline ? 'You\'re Offline' : 'Something went wrong'}
              </h2>
              
              {/* Error Description */}
              <div className="text-gray-600 mb-6 space-y-2">
                {this.state.isOffline ? (
                  <p>
                    Please check your internet connection and try again.
                  </p>
                ) : (
                  <>
                    <p>
                      We're sorry, but something unexpected happened. 
                    </p>
                    {this.state.retryCount > 0 && (
                      <p className="text-sm">
                        Retry attempt {this.state.retryCount} of {maxRetries}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Network Status */}
              {isNetworkError && (
                <AccessibleError 
                  message={this.state.isOffline ? 
                    "No internet connection detected" : 
                    "Network error occurred"
                  }
                  className="mb-6"
                />
              )}
              
              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-100 rounded-xl">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2 keyboard-nav">
                    <ScreenReaderOnly>Show </ScreenReaderOnly>
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs text-red-600 overflow-auto mt-1 p-2 bg-red-50 rounded">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="text-xs text-red-600 overflow-auto mt-1 p-2 bg-red-50 rounded max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-4">
                {canRetry && (
                  <AccessibleButton
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full"
                    disabled={this.state.isOffline}
                  >
                    {this.state.isOffline ? 'Waiting for Connection...' : 'Try Again'}
                  </AccessibleButton>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AccessibleButton
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    className="w-full"
                  >
                    Refresh Page
                  </AccessibleButton>
                  
                  <AccessibleButton
                    onClick={() => window.location.href = '/'}
                    variant="secondary"
                    className="w-full"
                  >
                    Go to Home
                  </AccessibleButton>
                </div>

                {this.props.showReportButton && !canRetry && (
                  <AccessibleButton
                    onClick={this.handleReportError}
                    variant="secondary"
                    className="w-full"
                  >
                    📧 Report Error
                  </AccessibleButton>
                )}
              </div>

              {/* Auto-retry notification */}
              {isNetworkError && canRetry && (
                <p className="text-sm text-gray-500 mt-4" role="status" aria-live="polite">
                  Will automatically retry when connection is restored
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Specialized Error Boundary Components
export const PageErrorBoundary: React.FC<{ 
  children: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}> = ({ children, onError }) => (
  <ErrorBoundary 
    onError={onError}
    maxRetries={3}
    showReportButton={true}
  >
    {children}
  </ErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{ 
  children: ReactNode
  fallback?: ReactNode
  maxRetries?: number
}> = ({ children, fallback, maxRetries = 2 }) => (
  <ErrorBoundary
    maxRetries={maxRetries}
    fallback={
      fallback || (
        <div className="py-12 px-4 text-center" role="alert">
          <div className="max-w-md mx-auto mobile-card bg-white p-6 rounded-2xl">
            <div className="text-red-500 mb-4">
              <span className="text-4xl" aria-hidden="true">😵</span>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Section Error
            </h3>
            
            <p className="text-gray-600 mb-4">
              This section encountered an error and couldn't load properly.
            </p>
            
            <AccessibleButton
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Refresh Page
            </AccessibleButton>
          </div>
        </div>
      )
    }
  >
    {children}
  </ErrorBoundary>
)

// Component Error Boundary for individual components
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode
  componentName?: string
}> = ({ children, componentName = 'Component' }) => (
  <ErrorBoundary
    maxRetries={1}
    fallback={
      <div className="p-4 border border-red-200 bg-red-50 rounded-xl" role="alert">
        <div className="flex items-center space-x-2 text-red-700">
          <span aria-hidden="true">⚠️</span>
          <span className="font-medium">{componentName} Error</span>
        </div>
        <p className="text-red-600 text-sm mt-1">
          This component failed to load. Please refresh the page.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)