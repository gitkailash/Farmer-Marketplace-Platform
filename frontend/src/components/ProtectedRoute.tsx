import React, { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { validateDeepLink, getDeepLinkConfig } from '../utils/deepLinking'
import { selectIsRestoring } from '../store/slices/authSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
  fallbackPath
}) => {
  const { isAuthenticated, user, loading } = useAuth()
  const isRestoring = useSelector(selectIsRestoring)
  const location = useLocation()
  const { error: showError } = useToastContext()
  const errorShownRef = useRef(false)

  // Use deep linking validation if available
  const deepLinkConfig = getDeepLinkConfig(location.pathname)
  const validation = deepLinkConfig ? validateDeepLink(deepLinkConfig, { isAuthenticated, user, loading }) : null

  // Reset error flag when location changes
  useEffect(() => {
    errorShownRef.current = false
  }, [location.pathname])

  // Handle deep link validation errors
  useEffect(() => {
    if (validation && !validation.canAccess && validation.message && !errorShownRef.current) {
      // Don't show error messages if we're already on the login page or being redirected to it
      if (location.pathname === '/login' || validation.redirectTo === '/login') {
        return
      }
      
      // Don't show error messages during logout process
      if (location.state?.fromLogout) {
        return
      }
      
      showError(validation.message)
      errorShownRef.current = true
    }
  }, [validation?.message, showError, location.pathname, location.state])

  // Handle role-based access control errors
  useEffect(() => {
    if (isAuthenticated && user && allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.includes(user.role)
      
      if (!hasRequiredRole && !errorShownRef.current) {
        // Don't show error messages if we're on the login page
        if (location.pathname === '/login') {
          return
        }
        
        // Don't show error messages during logout process
        if (location.state?.fromLogout) {
          return
        }
        
        if (allowedRoles.includes('BUYER') && user.role !== 'BUYER') {
          showError('This page is only available for buyers')
        } else if (allowedRoles.includes('FARMER') && user.role !== 'FARMER') {
          showError('This page is only available for farmers')
        } else if (allowedRoles.includes('ADMIN') && user.role !== 'ADMIN') {
          showError('This page is only available for administrators')
        } else {
          showError(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
        }
        errorShownRef.current = true
      }
    }
  }, [isAuthenticated, user, allowedRoles, showError, location.pathname, location.state])

  // Show loading spinner while checking authentication or restoring
  if (loading || isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRestoring ? 'Restoring your session...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (deepLinkConfig && validation && !validation.canAccess) {
    if (validation.redirectTo) {
      // Preserve the intended destination for post-login redirect
      if (validation.reason === 'not_authenticated') {
        return (
          <Navigate
            to={validation.redirectTo}
            state={{ from: location }}
            replace
          />
        )
      } else {
        return <Navigate to={validation.redirectTo} replace />
      }
    }
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // If user is authenticated but doesn't have required role
  if (isAuthenticated && user && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user.role)
    
    if (!hasRequiredRole) {
      // Determine appropriate redirect based on user role
      const roleRedirects: Record<string, string> = {
        'BUYER': '/dashboard',
        'FARMER': '/farmer',
        'ADMIN': '/admin'
      }

      const redirectTo = fallbackPath || roleRedirects[user.role] || '/dashboard'

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this page. 
                {allowedRoles.length === 1 
                  ? ` This page is only available for ${allowedRoles[0].toLowerCase()}s.`
                  : ` This page requires one of the following roles: ${allowedRoles.join(', ').toLowerCase()}.`
                }
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="btn-secondary w-full"
                >
                  Go Back
                </button>
                <Navigate to={redirectTo} replace />
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // If all checks pass, render the protected content
  return <>{children}</>
}

export default ProtectedRoute

// Convenience components for specific roles
export const BuyerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['BUYER']}>
    {children}
  </ProtectedRoute>
)

export const FarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['FARMER']}>
    {children}
  </ProtectedRoute>
)

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>
    {children}
  </ProtectedRoute>
)

export const BuyerOrFarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['BUYER', 'FARMER']}>
    {children}
  </ProtectedRoute>
)

export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
)

// Public route that redirects authenticated users
export const PublicRoute: React.FC<{ 
  children: React.ReactNode
  redirectTo?: string 
}> = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, loading } = useAuth()
  const isRestoring = useSelector(selectIsRestoring)

  if (loading || isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRestoring ? 'Restoring your session...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}