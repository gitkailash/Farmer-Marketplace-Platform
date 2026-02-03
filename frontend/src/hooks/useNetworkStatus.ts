import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
  connectionType?: string
  effectiveType?: string
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // If we were offline, mark that we came back online
      if (!navigator.onLine) {
        setWasOffline(true)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get connection information if available
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType
  }
}

// Hook for handling retry logic with network awareness
export const useRetryWithNetwork = (
  retryFn: () => void | Promise<void>,
  maxRetries: number = 3
) => {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const { isOnline, wasOffline } = useNetworkStatus()

  const retry = async () => {
    if (retryCount >= maxRetries) {
      return false
    }

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
    }
  }

  const reset = () => {
    setRetryCount(0)
    setIsRetrying(false)
  }

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && retryCount > 0 && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        retry()
      }, 1000) // Wait 1 second after coming online

      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline, retryCount, maxRetries])

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    isOnline
  }
}

export default useNetworkStatus