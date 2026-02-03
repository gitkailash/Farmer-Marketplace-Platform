import React from 'react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { AccessibleError, AccessibleButton, ScreenReaderOnly } from './Accessibility'

interface OfflineFallbackProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showBanner?: boolean
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  children,
  fallback,
  showBanner = true
}) => {
  const { isOffline } = useNetworkStatus()

  if (isOffline) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 mobile-card">
            {/* Offline Icon */}
            <div className="text-gray-500 mb-6">
              <span className="text-6xl" aria-hidden="true">📡</span>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You're Offline
            </h2>
            
            {/* Description */}
            <p className="text-gray-600 mb-6">
              It looks like you're not connected to the internet. 
              Please check your connection and try again.
            </p>

            {/* Connection Status */}
            <AccessibleError 
              message="No internet connection detected"
              className="mb-6"
            />
            
            {/* Actions */}
            <div className="space-y-4">
              <AccessibleButton
                onClick={() => window.location.reload()}
                variant="primary"
                className="w-full"
              >
                Try Again
              </AccessibleButton>
              
              <p className="text-sm text-gray-500" role="status" aria-live="polite">
                The page will automatically refresh when your connection is restored
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showBanner && <OfflineBanner />}
      {children}
    </>
  )
}

// Offline Banner Component
const OfflineBanner: React.FC = () => {
  const { isOffline, wasOffline } = useNetworkStatus()

  if (!isOffline && !wasOffline) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOffline ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`px-4 py-3 text-center text-white ${
        isOffline ? 'bg-red-600' : 'bg-green-600'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          <span aria-hidden="true">
            {isOffline ? '📡' : '✅'}
          </span>
          <span className="font-medium">
            {isOffline ? 'No internet connection' : 'Connection restored'}
          </span>
        </div>
        <ScreenReaderOnly>
          {isOffline ? 
            'You are currently offline. Some features may not work.' : 
            'Internet connection has been restored.'
          }
        </ScreenReaderOnly>
      </div>
    </div>
  )
}

// Offline-aware component wrapper
interface OfflineAwareProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showOfflineMessage?: boolean
}

export const OfflineAware: React.FC<OfflineAwareProps> = ({
  children,
  fallback,
  showOfflineMessage = true
}) => {
  const { isOffline } = useNetworkStatus()

  if (isOffline) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showOfflineMessage) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl" role="alert">
          <div className="flex items-center space-x-2 text-yellow-800">
            <span aria-hidden="true">📡</span>
            <span className="font-medium">Offline Mode</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            You're currently offline. This content may not be up to date.
          </p>
        </div>
      )
    }

    return null
  }

  return <>{children}</>
}

// Hook for offline-aware data fetching
export const useOfflineAwareFetch = <T,>(
  fetchFn: () => Promise<T>,
  fallbackData?: T,
  cacheKey?: string
) => {
  const [data, setData] = React.useState<T | undefined>(fallbackData)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const { isOnline } = useNetworkStatus()

  const fetchData = React.useCallback(async () => {
    if (!isOnline) {
      // Try to get cached data
      if (cacheKey) {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            setData(JSON.parse(cached))
            return
          }
        } catch (e) {
          console.warn('Failed to load cached data:', e)
        }
      }
      
      if (fallbackData) {
        setData(fallbackData)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      setData(result)
      
      // Cache the result if online
      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result))
        } catch (e) {
          console.warn('Failed to cache data:', e)
        }
      }
    } catch (err) {
      setError(err as Error)
      
      // Try to use cached data on error
      if (cacheKey) {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            setData(JSON.parse(cached))
          }
        } catch (e) {
          console.warn('Failed to load cached data on error:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFn, isOnline, cacheKey, fallbackData])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, isOnline }
}

export default OfflineFallback