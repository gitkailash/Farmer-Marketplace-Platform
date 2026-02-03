import React, { useState, useEffect } from 'react'
import { useRetryWithNetwork } from '../../hooks/useNetworkStatus'
import { AccessibleButton, AccessibleLoading, ScreenReaderOnly } from './Accessibility'

interface RetryMechanismProps {
  onRetry: () => Promise<void> | void
  maxRetries?: number
  autoRetry?: boolean
  autoRetryDelay?: number
  children: (props: {
    retry: () => void
    isRetrying: boolean
    retryCount: number
    canRetry: boolean
  }) => React.ReactNode
}

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
  onRetry,
  maxRetries = 3,
  autoRetry = false,
  autoRetryDelay = 2000,
  children
}) => {
  const { retry, retryCount, isRetrying, canRetry, isOnline } = useRetryWithNetwork(
    onRetry,
    maxRetries
  )

  useEffect(() => {
    if (autoRetry && canRetry && !isRetrying) {
      const timer = setTimeout(() => {
        retry()
      }, autoRetryDelay)

      return () => clearTimeout(timer)
    }
  }, [autoRetry, canRetry, isRetrying, autoRetryDelay, retry])

  return (
    <>
      {children({ retry, isRetrying, retryCount, canRetry })}
    </>
  )
}

// Retry Button Component
interface RetryButtonProps {
  onRetry: () => Promise<void> | void
  maxRetries?: number
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  maxRetries = 3,
  disabled = false,
  className = '',
  children = 'Try Again'
}) => {
  const { retry, retryCount, isRetrying, canRetry, isOnline } = useRetryWithNetwork(
    onRetry,
    maxRetries
  )

  return (
    <AccessibleButton
      onClick={retry}
      disabled={disabled || !canRetry || isRetrying || !isOnline}
      variant="primary"
      className={className}
      loading={isRetrying}
      loadingText="Retrying..."
    >
      {isRetrying ? (
        <>
          <AccessibleLoading size="sm" className="mr-2" />
          <ScreenReaderOnly>Retrying...</ScreenReaderOnly>
          Retrying...
        </>
      ) : (
        <>
          {children}
          {retryCount > 0 && (
            <span className="ml-2 text-sm opacity-75">
              ({retryCount}/{maxRetries})
            </span>
          )}
        </>
      )}
    </AccessibleButton>
  )
}

// Auto Retry Component
interface AutoRetryProps {
  onRetry: () => Promise<void> | void
  maxRetries?: number
  delay?: number
  onMaxRetriesReached?: () => void
  children?: React.ReactNode
}

export const AutoRetry: React.FC<AutoRetryProps> = ({
  onRetry,
  maxRetries = 3,
  delay = 2000,
  onMaxRetriesReached,
  children
}) => {
  const [countdown, setCountdown] = useState(delay / 1000)
  const { retry, retryCount, isRetrying, canRetry } = useRetryWithNetwork(
    onRetry,
    maxRetries
  )

  useEffect(() => {
    if (!canRetry && onMaxRetriesReached) {
      onMaxRetriesReached()
      return
    }

    if (canRetry && !isRetrying) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            retry()
            return delay / 1000
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [canRetry, isRetrying, retry, delay, onMaxRetriesReached])

  if (!canRetry) {
    return <>{children}</>
  }

  return (
    <div className="text-center p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <AccessibleLoading size="sm" />
        <span className="text-sm text-gray-600">
          {isRetrying ? 'Retrying...' : `Retrying in ${countdown}s`}
        </span>
      </div>
      
      <p className="text-xs text-gray-500">
        Attempt {retryCount + 1} of {maxRetries}
      </p>
      
      <ScreenReaderOnly>
        {isRetrying ? 
          'Currently retrying the operation' : 
          `Will retry in ${countdown} seconds. Attempt ${retryCount + 1} of ${maxRetries}.`
        }
      </ScreenReaderOnly>
    </div>
  )
}

// Exponential Backoff Retry Hook
export const useExponentialBackoff = (
  retryFn: () => Promise<void> | void,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [nextRetryIn, setNextRetryIn] = useState(0)

  const calculateDelay = (attempt: number) => {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
  }

  const retry = async () => {
    if (retryCount >= maxRetries) {
      return false
    }

    const delay = calculateDelay(retryCount)
    setNextRetryIn(delay / 1000)
    
    // Countdown
    const countdownInterval = setInterval(() => {
      setNextRetryIn(prev => Math.max(0, prev - 1))
    }, 1000)

    setTimeout(async () => {
      clearInterval(countdownInterval)
      setIsRetrying(true)
      setRetryCount(prev => prev + 1)

      try {
        await retryFn()
        setRetryCount(0) // Reset on success
        return true
      } catch (error) {
        console.error('Retry failed:', error)
        return false
      } finally {
        setIsRetrying(false)
        setNextRetryIn(0)
      }
    }, delay)

    return true
  }

  const reset = () => {
    setRetryCount(0)
    setIsRetrying(false)
    setNextRetryIn(0)
  }

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    nextRetryIn,
    canRetry: retryCount < maxRetries,
    nextDelay: calculateDelay(retryCount)
  }
}

export default RetryMechanism