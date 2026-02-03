import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppDispatch } from '../store'
import { 
  logout, 
  selectUser, 
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsRestoring,
  restoreAuthState,
  refreshAuthToken,
  clearError
} from '../store/slices/authSlice'
import { User } from '../types/api'

// Auth context interface
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  clearError: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isRestoring = useSelector(selectIsRestoring)
  const navigate = useNavigate()
  const location = useLocation()

  // Validate token if we're in restoring state
  useEffect(() => {
    if (isRestoring) {
      dispatch(restoreAuthState())
    }
  }, [dispatch, isRestoring])

  // Only redirect after restoration fails
  useEffect(() => {
    if (!isRestoring && !isAuthenticated && error) {
      const isProtectedRoute = location.pathname.startsWith('/farmer') || 
                              location.pathname.startsWith('/admin') || 
                              location.pathname.startsWith('/dashboard')
      
      if (isProtectedRoute) {
        navigate('/login', { 
          state: { from: location },
          replace: true 
        })
      }
    }
  }, [isRestoring, isAuthenticated, error, navigate, location])

  // Auth methods
  const login = async (email: string, password: string): Promise<void> => {
    const { loginUser } = await import('../store/slices/authSlice')
    await dispatch(loginUser({ email, password })).unwrap()
  }

  const register = async (userData: any): Promise<void> => {
    const { registerUser } = await import('../store/slices/authSlice')
    await dispatch(registerUser(userData)).unwrap()
  }

  const handleLogout = useCallback((): void => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      await dispatch(refreshAuthToken()).unwrap()
    } catch (error) {
      console.error('Token refresh failed:', error)
      handleLogout()
      throw error
    }
  }, [dispatch, handleLogout])

  const handleClearError = useCallback((): void => {
    dispatch(clearError())
  }, [dispatch])

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  // Context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    refreshAuth,
    clearError: handleClearError,
    hasRole,
    hasAnyRole,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for components that require authentication
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// HOC for role-based access control
export const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[]
): React.FC<P> => {
  return (props: P) => {
    const { user, isAuthenticated, loading, hasAnyRole } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      )
    }

    if (!hasAnyRole(allowedRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}