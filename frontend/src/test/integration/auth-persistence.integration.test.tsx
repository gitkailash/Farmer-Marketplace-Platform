/**
 * Integration Tests: Dashboard Authentication Persistence Across Refreshes
 * 
 * Tests the complete authentication persistence workflow including:
 * - Token persistence in localStorage
 * - Authentication state restoration on page refresh
 * - Token validation and refresh logic
 * - Error handling for expired tokens
 * - Redirect behavior for protected routes
 * 
 * **Feature: review-dashboard-fixes, Integration Test: Authentication Persistence**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AuthProvider } from '../../contexts/AuthProvider'
import FarmerReviews from '../../pages/farmer/FarmerReviews'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import authSlice from '../../store/slices/authSlice'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock navigation
const mockNavigate = vi.fn()
const mockReplace = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/farmer/reviews',
      state: null
    })
  }
})

// Create store with auth slice
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      cart: (state = { items: [], totalItems: 0, totalAmount: 0, isOpen: false }) => state,
      notifications: (state = { notifications: [], unreadCount: 0 }) => state,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState
      }
    }
  })
}

const TestWrapper: React.FC<{ 
  children: React.ReactNode
  store?: any
  initialEntries?: string[]
}> = ({ 
  children, 
  store = createTestStore(),
  initialEntries = ['/farmer/reviews']
}) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  </Provider>
)

describe('Integration: Authentication Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    mockNavigate.mockClear()
  })

  describe('Successful Authentication Restoration', () => {
    it('should restore authentication state from valid token on page refresh', async () => {
      // Mock valid token in localStorage
      localStorageMock.getItem.mockReturnValue('valid-jwt-token')

      // Mock successful token validation
      server.use(
        http.get('http://localhost:5000/api/auth/me', ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          if (authHeader === 'Bearer valid-jwt-token') {
            return HttpResponse.json({
              success: true,
              data: {
                _id: 'farmer123',
                email: 'farmer@test.com',
                role: 'FARMER',
                profile: { name: 'Test Farmer' }
              }
            })
          }
          return HttpResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          )
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should show loading state initially
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Should restore authentication and load reviews
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should not redirect to login
      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })

    it('should handle authentication restoration with loading states', async () => {
      localStorageMock.getItem.mockReturnValue('valid-jwt-token')

      // Mock slow auth response
      server.use(
        http.get('http://localhost:5000/api/auth/me', async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Test Farmer' }
            }
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should show loading state during auth restoration
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Should eventually load content
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should maintain user session across multiple page refreshes', async () => {
      localStorageMock.getItem.mockReturnValue('persistent-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Persistent Farmer' }
            }
          })
        })
      )

      const { rerender } = render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Simulate page refresh by re-rendering
      rerender(
        <TestWrapper>
          <FarmerReviews />
        </TestWrapper>
      )

      // Should maintain authentication without additional login
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should not redirect to login
      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })

  describe('Expired Token Handling', () => {
    it('should redirect to login when token is expired', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token')

      // Mock expired token response
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          )
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should redirect to login with return URL
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })

    it('should handle token refresh attempts', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token')

      // Mock token refresh scenario
      let callCount = 0
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          callCount++
          if (callCount === 1) {
            // First call fails with expired token
            return HttpResponse.json(
              { success: false, message: 'Token expired' },
              { status: 401 }
            )
          }
          // Subsequent calls succeed (after refresh)
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Refreshed Farmer' }
            }
          })
        }),
        
        http.post('http://localhost:5000/api/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: {
              token: 'new-refreshed-token',
              user: {
                _id: 'farmer123',
                email: 'farmer@test.com',
                role: 'FARMER',
                profile: { name: 'Refreshed Farmer' }
              }
            }
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should eventually succeed after refresh
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should not redirect to login if refresh succeeds
      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })

    it('should clear localStorage and redirect when refresh fails', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-refresh-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          )
        }),
        
        http.post('http://localhost:5000/api/auth/refresh', () => {
          return HttpResponse.json(
            { success: false, message: 'Refresh token invalid' },
            { status: 401 }
          )
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should clear localStorage and redirect
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network errors during authentication restoration gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('network-error-token')

      // Mock network error
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.error()
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should handle network error and redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })

    it('should retry authentication on network recovery', async () => {
      localStorageMock.getItem.mockReturnValue('retry-token')

      let networkError = true
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          if (networkError) {
            networkError = false
            return HttpResponse.error()
          }
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Recovered Farmer' }
            }
          })
        })
      )

      const { rerender } = render(<FarmerReviews />, { wrapper: TestWrapper })

      // First attempt should fail
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object))
      })

      // Reset navigation mock
      mockNavigate.mockClear()

      // Simulate retry (e.g., user navigating back)
      rerender(
        <TestWrapper>
          <FarmerReviews />
        </TestWrapper>
      )

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })

  describe('Missing User Data Recovery', () => {
    it('should fetch user data when token exists but user data is missing', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token-no-user')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Recovered User Data' }
            }
          })
        })
      )

      // Start with store that has token but no user
      const storeWithTokenOnly = createTestStore({
        token: 'valid-token-no-user',
        user: null,
        isAuthenticated: false
      })

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTokenOnly}>
            {children}
          </TestWrapper>
        )
      })

      // Should fetch user data and restore session
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should not redirect to login
      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })

    it('should handle user data fetch failures', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-user-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          )
        })
      )

      const storeWithTokenOnly = createTestStore({
        token: 'invalid-user-token',
        user: null,
        isAuthenticated: false
      })

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTokenOnly}>
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to login when user data can't be fetched
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })
  })

  describe('Route Protection Integration', () => {
    it('should protect farmer routes from non-farmer users', async () => {
      localStorageMock.getItem.mockReturnValue('buyer-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'buyer123',
              email: 'buyer@test.com',
              role: 'BUYER', // Wrong role for farmer route
              profile: { name: 'Test Buyer' }
            }
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should redirect buyer away from farmer route
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should allow access to appropriate routes based on user role', async () => {
      localStorageMock.getItem.mockReturnValue('farmer-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER', // Correct role
              profile: { name: 'Test Farmer' }
            }
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should allow access to farmer route
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Deep Linking with Authentication', () => {
    it('should handle deep links to protected routes with valid authentication', async () => {
      localStorageMock.getItem.mockReturnValue('deep-link-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Deep Link Farmer' }
            }
          })
        })
      )

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/farmer/reviews']}>
            {children}
          </TestWrapper>
        )
      })

      // Should load the deep-linked page directly
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should redirect to login for deep links without authentication', async () => {
      localStorageMock.getItem.mockReturnValue(null) // No token

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/farmer/reviews']}>
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to login with return URL
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })

    it('should return to intended page after login', async () => {
      // Simulate login flow with return URL
      localStorageMock.getItem.mockReturnValue('post-login-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Post Login Farmer' }
            }
          })
        })
      )

      // Simulate coming back from login
      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/farmer/reviews']}>
            {children}
          </TestWrapper>
        )
      })

      // Should load the intended page
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })
})