import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '../UI'
import { orderErrorHandler, errorLogger } from '../../utils/errorHandling'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  userId?: string
  orderData?: any
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  userMessage: string
  fallbackData?: any
}

/**
 * Specialized error boundary for order components
 * Provides order-specific error handling with graceful degradation
 */
export class OrderErrorBoundary extends Component<Props, State> {
  private maxRetries = 2

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      userMessage: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Handle order display error with graceful degradation
    const { userMessage, fallbackData } = orderErrorHandler.handleOrderDisplayError(
      error,
      this.props.orderData,
      this.props.userId
    )

    this.setState({ 
      errorInfo,
      userMessage,
      fallbackData
    })

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        userMessage: '',
        fallbackData: undefined
      }))
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg" role="alert">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl" aria-hidden="true">📦⚠️</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-orange-800 mb-2">
                Order Display Issue
              </h3>
              
              <p className="text-orange-700 mb-4">
                {this.state.userMessage || 'Some order information could not be displayed properly.'}
              </p>

              {/* Show fallback order data if available */}
              {this.state.fallbackData && (
                <div className="mb-4 p-4 bg-white border border-orange-200 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Available Order Information:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Order ID:</strong> #{this.state.fallbackData._id.slice(-8)}</p>
                    <p><strong>Status:</strong> {this.state.fallbackData.status}</p>
                    <p><strong>Total:</strong> ${this.state.fallbackData.totalAmount.toFixed(2)}</p>
                    <p><strong>Date:</strong> {new Date(this.state.fallbackData.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 p-3 bg-orange-100 rounded text-sm">
                  <summary className="cursor-pointer font-medium text-orange-800">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs text-orange-600 overflow-auto mt-1 p-2 bg-orange-50 rounded">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="text-xs text-orange-600 overflow-auto mt-1 p-2 bg-orange-50 rounded max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    size="sm"
                  >
                    Try Again ({this.state.retryCount + 1}/{this.maxRetries + 1})
                  </Button>
                )}
                
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/orders'}
                  variant="outline"
                  size="sm"
                >
                  Back to Orders
                </Button>
              </div>

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <p className="text-sm text-orange-600 mt-3">
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </p>
              )}

              {/* Max retries reached */}
              {!canRetry && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Unable to display order details properly. Please refresh the page or contact support.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping order components with error boundary
 */
export const withOrderErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P & { userId?: string; orderData?: any }) => (
    <OrderErrorBoundary 
      fallback={fallback} 
      userId={props.userId}
      orderData={props.orderData}
    >
      <Component {...props} />
    </OrderErrorBoundary>
  )
  
  WrappedComponent.displayName = `withOrderErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default OrderErrorBoundary