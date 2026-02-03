import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { validateDeepLink, getDeepLinkConfig } from '../utils/deepLinking'

export interface NavigationOptions {
  replace?: boolean
  preserveQuery?: boolean
  showError?: boolean
  fallbackPath?: string
}

export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, loading } = useAuth()
  const { error: showError, success: showSuccess } = useToastContext()

  /**
   * Navigate with role-based validation
   */
  const navigateWithValidation = (
    path: string, 
    options: NavigationOptions = {}
  ) => {
    const { 
      replace = false, 
      preserveQuery = false, 
      showError: showErrorMessage = true,
      fallbackPath = '/dashboard'
    } = options

    // Get deep link configuration for the target path
    const config = getDeepLinkConfig(path)
    
    if (config) {
      const authState = { isAuthenticated, user, loading }
      const validation = validateDeepLink(config, authState)
      
      if (!validation.canAccess) {
        if (validation.message && showErrorMessage) {
          showError(validation.message)
        }

        if (validation.redirectTo) {
          navigate(validation.redirectTo, { replace: true })
          return false
        }
        
        navigate(fallbackPath, { replace: true })
        return false
      }
    }

    // Build the navigation path
    let targetPath = path
    if (preserveQuery && location.search) {
      targetPath += location.search
    }

    navigate(targetPath, { replace })
    return true
  }

  /**
   * Navigate to role-specific dashboard
   */
  const navigateToDashboard = () => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    const dashboardPaths: Record<string, string> = {
      'BUYER': '/dashboard',
      'FARMER': '/farmer',
      'ADMIN': '/admin'
    }

    const dashboardPath = dashboardPaths[user.role] || '/dashboard'
    navigate(dashboardPath, { replace: true })
  }

  /**
   * Navigate back with fallback
   */
  const navigateBack = (fallbackPath?: string) => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      const fallback = fallbackPath || (user ? getDashboardPath(user.role) : '/')
      navigate(fallback, { replace: true })
    }
  }

  /**
   * Navigate to order review with validation
   */
  const navigateToOrderReview = (orderId: string) => {
    if (!user || user.role !== 'BUYER') {
      showError('Only buyers can leave reviews for orders')
      return false
    }

    return navigateWithValidation(`/orders/${orderId}/review`)
  }

  /**
   * Navigate to farmer section with validation
   */
  const navigateToFarmerSection = (section: string) => {
    if (!user || user.role !== 'FARMER') {
      showError('This section is only available for farmers')
      return false
    }

    return navigateWithValidation(`/farmer/${section}`)
  }

  /**
   * Navigate to admin section with validation
   */
  const navigateToAdminSection = (section: string, itemId?: string) => {
    if (!user || user.role !== 'ADMIN') {
      showError('This section is only available for administrators')
      return false
    }

    const path = itemId 
      ? `/admin/${section}/${itemId}`
      : `/admin/${section}`

    return navigateWithValidation(path)
  }

  /**
   * Check if user can access a specific path
   */
  const canAccessPath = (path: string): boolean => {
    const config = getDeepLinkConfig(path)
    
    if (!config) {
      return true // No specific requirements
    }

    const authState = { isAuthenticated, user, loading }
    const validation = validateDeepLink(config, authState)
    
    return validation.canAccess
  }

  /**
   * Get appropriate dashboard path for a role
   */
  const getDashboardPath = (role: string): string => {
    const dashboardPaths: Record<string, string> = {
      'BUYER': '/dashboard',
      'FARMER': '/farmer',
      'ADMIN': '/admin'
    }

    return dashboardPaths[role] || '/dashboard'
  }

  /**
   * Navigate with success message
   */
  const navigateWithSuccess = (path: string, message: string, options?: NavigationOptions) => {
    const success = navigateWithValidation(path, options)
    if (success) {
      showSuccess(message)
    }
    return success
  }

  /**
   * Get breadcrumb items for current location
   */
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const items = []

    // Always start with home
    items.push({ label: 'Home', href: '/' })

    // Build breadcrumb based on path segments
    let currentPath = ''
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}`
      
      // Skip IDs in breadcrumbs (they're usually long strings)
      if (segment.length > 20) {
        continue
      }

      const isLast = i === pathSegments.length - 1
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      items.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast
      })
    }

    return items
  }

  return {
    navigateWithValidation,
    navigateToDashboard,
    navigateBack,
    navigateToOrderReview,
    navigateToFarmerSection,
    navigateToAdminSection,
    navigateWithSuccess,
    canAccessPath,
    getDashboardPath,
    getBreadcrumbItems,
    currentPath: location.pathname,
    currentUser: user
  }
}

export default useNavigation