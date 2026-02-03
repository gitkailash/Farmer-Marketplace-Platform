/**
 * Enhanced error handling utilities for cart and order operations
 * Provides logging, user-friendly messages, and error recovery mechanisms
 */

export interface ErrorContext {
  component: string
  operation: string
  userId?: string
  timestamp: Date
  userAgent: string
  url: string
}

export interface ErrorLogEntry {
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string
  technicalMessage: string
}

/**
 * Enhanced error logger that provides both technical logging and user-friendly messages
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private errorQueue: ErrorLogEntry[] = []
  private maxQueueSize = 100

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log an error with context and user-friendly messaging
   */
  logError(
    error: Error,
    context: Partial<ErrorContext>,
    severity: ErrorLogEntry['severity'] = 'medium',
    userMessage?: string
  ): ErrorLogEntry {
    const fullContext: ErrorContext = {
      component: context.component || 'Unknown',
      operation: context.operation || 'Unknown',
      userId: context.userId,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Test Environment',
      url: typeof window !== 'undefined' ? window.location.href : 'test://localhost',
      ...context
    }

    const logEntry: ErrorLogEntry = {
      error,
      context: fullContext,
      severity,
      userMessage: userMessage || this.generateUserMessage(error, context.operation),
      technicalMessage: `${error.name}: ${error.message}`
    }

    // Add to queue
    this.errorQueue.push(logEntry)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift() // Remove oldest entry
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${severity.toUpperCase()} Error in ${fullContext.component}`)
      console.error('Error:', error)
      console.log('Context:', fullContext)
      console.log('User Message:', logEntry.userMessage)
      console.groupEnd()
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry)
    }

    return logEntry
  }

  /**
   * Generate user-friendly error messages based on error type and operation
   */
  private generateUserMessage(error: Error, operation?: string): string {
    const errorMessage = error.message.toLowerCase()
    
    // Network-related errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return 'Connection issue detected. Please check your internet connection and try again.'
    }
    
    // Cart-specific errors
    if (operation?.includes('cart')) {
      if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
        return 'Unable to save cart changes. Your browser storage may be full.'
      }
      if (errorMessage.includes('stock') || errorMessage.includes('quantity')) {
        return 'This item is no longer available in the requested quantity.'
      }
      return 'There was an issue with your cart. Please try again.'
    }
    
    // Order-specific errors
    if (operation?.includes('order')) {
      if (errorMessage.includes('payment')) {
        return 'Payment processing failed. Please check your payment information.'
      }
      if (errorMessage.includes('address')) {
        return 'There was an issue with your delivery address. Please verify and try again.'
      }
      return 'Unable to process your order. Please try again in a moment.'
    }
    
    // Generic fallback
    return 'Something went wrong. Please try again, and contact support if the problem persists.'
  }

  /**
   * Send error to monitoring service (placeholder for production implementation)
   */
  private async sendToMonitoringService(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // In production, this would send to services like Sentry, LogRocket, etc.
      // For now, we'll just prepare the data structure
      const errorData = {
        message: logEntry.error.message,
        stack: logEntry.error.stack,
        context: logEntry.context,
        severity: logEntry.severity,
        userMessage: logEntry.userMessage,
        fingerprint: this.generateErrorFingerprint(logEntry.error, logEntry.context)
      }
      
      // Example API call (commented out for now):
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
      
      console.log('Error would be sent to monitoring service:', errorData)
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError)
    }
  }

  /**
   * Generate a unique fingerprint for error deduplication
   */
  private generateErrorFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}-${context.component}-${context.operation}-${error.message.slice(0, 50)}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): ErrorLogEntry[] {
    return this.errorQueue.slice(-count)
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = []
  }
}

/**
 * Cart-specific error handling utilities
 */
export class CartErrorHandler {
  private static logger = ErrorLogger.getInstance()

  /**
   * Handle cart operation errors with automatic retry and state preservation
   */
  static async handleCartOperation<T>(
    operation: () => Promise<T> | T,
    context: {
      operationName: string
      userId?: string
      fallbackValue?: T
      maxRetries?: number
    }
  ): Promise<{ success: boolean; data?: T; error?: ErrorLogEntry }> {
    const { operationName, userId, fallbackValue, maxRetries = 2 } = context
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        return { success: true, data: result }
      } catch (error) {
        lastError = error as Error
        
        // Log the error
        const errorEntry = this.logger.logError(
          lastError,
          {
            component: 'Cart',
            operation: operationName,
            userId
          },
          attempt === maxRetries ? 'high' : 'medium'
        )

        // If this is the last attempt, return the error
        if (attempt === maxRetries) {
          return { 
            success: false, 
            data: fallbackValue, 
            error: errorEntry 
          }
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    // This should never be reached, but TypeScript requires it
    return { 
      success: false, 
      data: fallbackValue, 
      error: this.logger.logError(
        lastError || new Error('Unknown error'),
        { component: 'Cart', operation: operationName, userId },
        'high'
      )
    }
  }

  /**
   * Preserve cart state during failures
   */
  static preserveCartState(items: any[]): void {
    try {
      const backup = {
        items,
        timestamp: Date.now(),
        version: '1.0'
      }
      localStorage.setItem('cart_backup', JSON.stringify(backup))
    } catch (error) {
      console.warn('Failed to preserve cart state:', error)
    }
  }

  /**
   * Restore cart state from backup
   */
  static restoreCartState(): any[] | null {
    try {
      const backup = localStorage.getItem('cart_backup')
      if (backup) {
        const parsed = JSON.parse(backup)
        // Only restore if backup is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.items
        }
      }
    } catch (error) {
      console.warn('Failed to restore cart state:', error)
    }
    return null
  }
}

/**
 * Order-specific error handling utilities
 */
export class OrderErrorHandler {
  private static logger = ErrorLogger.getInstance()

  /**
   * Handle order display errors with graceful degradation
   */
  static handleOrderDisplayError(
    error: Error,
    orderData: any,
    userId?: string
  ): { userMessage: string; fallbackData: any } {
    const errorEntry = this.logger.logError(
      error,
      {
        component: 'Orders',
        operation: 'displayOrder',
        userId
      },
      'medium'
    )

    // Provide fallback data structure
    const fallbackData = {
      _id: orderData?._id || 'unknown',
      status: orderData?.status || 'UNKNOWN',
      totalAmount: orderData?.totalAmount || 0,
      items: [],
      createdAt: orderData?.createdAt || new Date().toISOString(),
      deliveryAddress: orderData?.deliveryAddress || 'Address unavailable'
    }

    return {
      userMessage: errorEntry.userMessage,
      fallbackData
    }
  }

  /**
   * Handle order item processing errors
   */
  static handleOrderItemError(
    error: Error,
    itemData: any,
    userId?: string
  ): { userMessage: string; fallbackItem: any } {
    this.logger.logError(
      error,
      {
        component: 'Orders',
        operation: 'processOrderItem',
        userId
      },
      'low' // Low severity since we have fallbacks
    )

    const fallbackItem = {
      productId: itemData?.productId || 'unknown',
      productName: 'Product information unavailable',
      quantity: itemData?.quantity || 0,
      priceAtTime: itemData?.priceAtTime || 0
    }

    return {
      userMessage: 'Some product details could not be loaded',
      fallbackItem
    }
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = (): void => {
  const logger = ErrorLogger.getInstance()

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.logError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        component: 'Global',
        operation: 'unhandledRejection'
      },
      'high',
      'An unexpected error occurred. The page will continue to work normally.'
    )
    
    // Prevent the default browser behavior
    event.preventDefault()
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    logger.logError(
      event.error || new Error(event.message),
      {
        component: 'Global',
        operation: 'globalError'
      },
      'high'
    )
  })
}

// Export singleton instances
export const errorLogger = ErrorLogger.getInstance()
export const cartErrorHandler = CartErrorHandler
export const orderErrorHandler = OrderErrorHandler