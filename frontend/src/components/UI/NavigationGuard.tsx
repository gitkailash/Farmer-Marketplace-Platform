import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthProvider'
import { useToastContext } from '../../contexts/ToastProvider'

interface NavigationGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectPath?: string
  requireAuth?: boolean
  onUnauthorized?: (reason: 'not_authenticated' | 'wrong_role') => void
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({
  children,
  allowedRoles = [],
  redirectPath,
  requireAuth = true,
  onUnauthorized
}) => {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { error: showError } = useToastContext()

  useEffect(() => {
    // Don't check while still loading auth state
    if (loading) return

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      onUnauthorized?.('not_authenticated')
      showError('Please log in to access this page')
      navigate('/login', { 
        state: { from: location },
        replace: true 
      })
      return
    }

    // Check role requirements
    if (isAuthenticated && user && allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.includes(user.role)
      
      if (!hasRequiredRole) {
        onUnauthorized?.('wrong_role')
        
        // Provide role-specific error messages and redirects
        const roleRedirects: Record<string, string> = {
          'BUYER': '/dashboard',
          'FARMER': '/farmer',
          'ADMIN': '/admin'
        }

        const defaultRedirect = redirectPath || roleRedirects[user.role] || '/dashboard'
        
        // Show specific error message based on attempted access
        if (allowedRoles.includes('BUYER') && user.role !== 'BUYER') {
          showError('This page is only available for buyers')
        } else if (allowedRoles.includes('FARMER') && user.role !== 'FARMER') {
          showError('This page is only available for farmers')
        } else if (allowedRoles.includes('ADMIN') && user.role !== 'ADMIN') {
          showError('This page is only available for administrators')
        } else {
          showError(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
        }

        navigate(defaultRedirect, { replace: true })
        return
      }
    }
  }, [
    loading, 
    isAuthenticated, 
    user, 
    allowedRoles, 
    requireAuth, 
    navigate, 
    location, 
    redirectPath, 
    onUnauthorized, 
    showError
  ])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated when auth is required
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // Don't render children if user doesn't have required role
  if (isAuthenticated && user && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user.role)
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}

export default NavigationGuard

// Specialized navigation guards for common patterns
export const BuyerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationGuard allowedRoles={['BUYER']}>
    {children}
  </NavigationGuard>
)

export const FarmerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationGuard allowedRoles={['FARMER']}>
    {children}
  </NavigationGuard>
)

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationGuard allowedRoles={['ADMIN']}>
    {children}
  </NavigationGuard>
)

export const ReviewGuard: React.FC<{ 
  children: React.ReactNode
  orderId?: string
  userRole?: string
}> = ({ children, orderId, userRole }) => {
  const navigate = useNavigate()
  const { error: showError } = useToastContext()

  const handleUnauthorized = (reason: 'not_authenticated' | 'wrong_role') => {
    if (reason === 'wrong_role') {
      if (userRole === 'FARMER') {
        showError('Farmers cannot leave reviews for orders. Only buyers can review completed orders.')
        navigate('/farmer/reviews')
      } else if (userRole === 'ADMIN') {
        showError('Administrators cannot leave reviews for orders.')
        navigate('/admin')
      } else {
        showError('You do not have permission to leave reviews for this order.')
        navigate('/orders')
      }
    }
  }

  return (
    <NavigationGuard 
      allowedRoles={['BUYER']} 
      onUnauthorized={handleUnauthorized}
    >
      {children}
    </NavigationGuard>
  )
}