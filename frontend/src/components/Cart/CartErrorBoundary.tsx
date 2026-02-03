import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '../UI'
import { cartErrorHandler, errorLogger } from '../../utils/errorHandling'
import { ShoppingCart } from 'lucide-react';
interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  userId?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
  userMessage: string
}

/**
 * Specialized error boundary for cart components
 * Provides cart-specific error handling and recovery mechanisms
 */
export class CartErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

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
    // Log error with cart-specific context
    const errorEntry = errorLogger.logError(
      error,
      {
        component: 'Cart',
        operation: 'componentRender',
        userId: this.props.userId
      },
      'high'
    )

    this.setState({ 
      errorInfo,
      userMessage: errorEntry.userMessage
    })

    // Preserve cart state before error
    try {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]')
      cartErrorHandler.preserveCartState(cartItems)
    } catch (preserveError) {
      console.warn('Failed to preserve cart state during error:', preserveError)
    }

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      // Try to restore cart state
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems) {
        try {
          localStorage.setItem('cart', JSON.stringify(restoredItems))
        } catch (restoreError) {
          console.warn('Failed to restore cart state:', restoreError)
        }
      }

      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        userMessage: ''
      }))
    }
  }

  handleClearCart = () => {
    try {
      localStorage.removeItem('cart')
      localStorage.removeItem('cart_backup')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl" aria-hidden="true">
                <ShoppingCart className="h-6 w-6" />❌
                </span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Cart Error
              </h3>
              
              <p className="text-red-700 mb-4">
                {this.state.userMessage || 'There was an issue with your cart. Your items have been preserved.'}
              </p>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 p-3 bg-red-100 rounded text-sm">
                  <summary className="cursor-pointer font-medium text-red-800">
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
                  onClick={this.handleClearCart}
                  variant="secondary"
                  size="sm"
                >
                  Clear Cart & Refresh
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/products'}
                  variant="outline"
                  size="sm"
                >
                  Continue Shopping
                </Button>
              </div>

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <p className="text-sm text-red-600 mt-3">
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </p>
              )}

              {/* Max retries reached */}
              {!canRetry && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Maximum retry attempts reached. Please refresh the page or contact support if the problem persists.
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
 * Higher-order component for wrapping cart components with error boundary
 */
export const withCartErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P & { userId?: string }) => (
    <CartErrorBoundary fallback={fallback} userId={props.userId}>
      <Component {...props} />
    </CartErrorBoundary>
  )
  
  WrappedComponent.displayName = `withCartErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default CartErrorBoundary