import { NavigateFunction } from 'react-router-dom'

export interface DeepLinkConfig {
  path: string
  requiredRole?: string[]
  requireAuth?: boolean
  fallbackPath?: string
  preserveQuery?: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: { role: string; _id: string } | null
  loading: boolean
}

export interface DeepLinkResult {
  canAccess: boolean
  redirectTo?: string
  reason?: 'not_authenticated' | 'wrong_role' | 'loading'
  message?: string
}

/**
 * Validates if a user can access a deep link based on authentication and role requirements
 */
export const validateDeepLink = (
  config: DeepLinkConfig,
  authState: AuthState
): DeepLinkResult => {
  const { requiredRole = [], requireAuth = true, fallbackPath = '/' } = config
  const { isAuthenticated, user, loading } = authState

  // Still loading authentication state
  if (loading) {
    return {
      canAccess: false,
      reason: 'loading'
    }
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'not_authenticated',
      message: 'Please log in to access this page'
    }
  }

  // Check role requirements
  if (isAuthenticated && user && requiredRole.length > 0) {
    const hasRequiredRole = requiredRole.includes(user.role)
    
    if (!hasRequiredRole) {
      // Determine appropriate redirect based on user role
      const roleRedirects: Record<string, string> = {
        'BUYER': '/dashboard',
        'FARMER': '/farmer',
        'ADMIN': '/admin'
      }

      return {
        canAccess: false,
        redirectTo: roleRedirects[user.role] || fallbackPath,
        reason: 'wrong_role',
        message: `Access denied. This page requires: ${requiredRole.join(' or ')}`
      }
    }
  }

  return { canAccess: true }
}

/**
 * Handles deep linking with authentication checks and proper redirects
 */
export const handleDeepLink = (
  config: DeepLinkConfig,
  authState: AuthState,
  navigate: NavigateFunction,
  currentPath: string,
  showError?: (message: string) => void
): boolean => {
  const result = validateDeepLink(config, authState)

  if (!result.canAccess) {
    if (result.message && showError) {
      showError(result.message)
    }

    if (result.redirectTo) {
      // Preserve the intended destination for post-login redirect
      if (result.reason === 'not_authenticated') {
        navigate(result.redirectTo, {
          state: { from: { pathname: currentPath } },
          replace: true
        })
      } else {
        navigate(result.redirectTo, { replace: true })
      }
    }

    return false
  }

  return true
}

/**
 * Common deep link configurations for the application
 */
export const DEEP_LINK_CONFIGS: Record<string, DeepLinkConfig> = {
  // Order review routes
  ORDER_REVIEW: {
    path: '/orders/:id/review',
    requiredRole: ['BUYER'],
    requireAuth: true,
    fallbackPath: '/orders'
  },

  // Farmer routes
  FARMER_DASHBOARD: {
    path: '/farmer',
    requiredRole: ['FARMER'],
    requireAuth: true,
    fallbackPath: '/dashboard'
  },
  FARMER_REVIEWS: {
    path: '/farmer/reviews',
    requiredRole: ['FARMER'],
    requireAuth: true,
    fallbackPath: '/farmer'
  },
  FARMER_PRODUCTS: {
    path: '/farmer/products',
    requiredRole: ['FARMER'],
    requireAuth: true,
    fallbackPath: '/farmer'
  },
  FARMER_ORDERS: {
    path: '/farmer/orders',
    requiredRole: ['FARMER'],
    requireAuth: true,
    fallbackPath: '/farmer'
  },
  FARMER_MESSAGES: {
    path: '/farmer/messages',
    requiredRole: ['FARMER'],
    requireAuth: true,
    fallbackPath: '/farmer'
  },

  // Admin routes
  ADMIN_DASHBOARD: {
    path: '/admin',
    requiredRole: ['ADMIN'],
    requireAuth: true,
    fallbackPath: '/dashboard'
  },
  ADMIN_USERS: {
    path: '/admin/users',
    requiredRole: ['ADMIN'],
    requireAuth: true,
    fallbackPath: '/admin'
  },
  ADMIN_MODERATION: {
    path: '/admin/moderation',
    requiredRole: ['ADMIN'],
    requireAuth: true,
    fallbackPath: '/admin'
  },

  // Buyer routes
  BUYER_ORDERS: {
    path: '/orders',
    requiredRole: ['BUYER', 'FARMER'],
    requireAuth: true,
    fallbackPath: '/dashboard'
  },
  BUYER_MESSAGES: {
    path: '/messages',
    requiredRole: ['BUYER', 'FARMER'],
    requireAuth: true,
    fallbackPath: '/dashboard'
  },
  BUYER_REVIEWS: {
    path: '/reviews',
    requiredRole: ['BUYER'],
    requireAuth: true,
    fallbackPath: '/dashboard'
  }
}

/**
 * Gets the appropriate deep link config based on the current path
 */
export const getDeepLinkConfig = (currentPath: string): DeepLinkConfig | null => {
  // Match exact paths first
  for (const config of Object.values(DEEP_LINK_CONFIGS)) {
    if (config.path === currentPath) {
      return config
    }
  }

  // Match parameterized paths
  if (currentPath.match(/^\/orders\/[^/]+\/review$/)) {
    return DEEP_LINK_CONFIGS.ORDER_REVIEW
  }

  if (currentPath.startsWith('/farmer/')) {
    const section = currentPath.split('/')[2]
    if (section && DEEP_LINK_CONFIGS[`FARMER_${section.toUpperCase()}`]) {
      return DEEP_LINK_CONFIGS[`FARMER_${section.toUpperCase()}`]
    }
    return DEEP_LINK_CONFIGS.FARMER_DASHBOARD
  }

  if (currentPath.startsWith('/admin/')) {
    const section = currentPath.split('/')[2]
    if (section && DEEP_LINK_CONFIGS[`ADMIN_${section.toUpperCase()}`]) {
      return DEEP_LINK_CONFIGS[`ADMIN_${section.toUpperCase()}`]
    }
    return DEEP_LINK_CONFIGS.ADMIN_DASHBOARD
  }

  return null
}

/**
 * Hook for handling deep linking in components
 */
export const useDeepLinkValidation = (
  path: string,
  authState: AuthState,
  navigate: NavigateFunction,
  showError?: (message: string) => void
): boolean => {
  const config = getDeepLinkConfig(path)
  
  if (!config) {
    return true // No specific requirements for this path
  }

  return handleDeepLink(config, authState, navigate, path, showError)
}