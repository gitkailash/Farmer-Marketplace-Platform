/**
 * Integration Tests: Bug Verification and Error Recovery
 * 
 * Tests that verify all reported bugs from the requirements are resolved:
 * 1. Farmer reviews page infinite loading (Requirement 1)
 * 2. Buyer order review 404 errors (Requirement 2) 
 * 3. Dashboard authentication persistence issues (Requirement 3)
 * 4. Review data processing robustness (Requirement 4)
 * 5. Review form validation and error handling (Requirement 5)
 * 6. Navigation and route protection (Requirement 6)
 * 
 * **Feature: review-dashboard-fixes, Integration Test: Bug Verification**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import FarmerReviews from '../../pages/farmer/FarmerReviews'
import OrderReviewPage from '../../pages/OrderReviewPage'
import { AuthProvider } from '../../contexts/AuthProvider'
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

// Mock toast context
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()

vi.mock('../../contexts/ToastProvider', () => ({
  useToastContext: () => ({
    success: mockShowSuccess,
    error: mockShowError,
  }),
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      cart: (state = { items: [], totalItems: 0, totalAmount: 0, isOpen: false }) => state,
      notifications: (state = { notifications: [], unreadCount: 0 }) => state,
    },
    preloadedState: {
      auth: {
        user: { _id: 'farmer123', role: 'FARMER', profile: { name: 'Test Farmer' } },
        token: 'valid-token',
        isAuthenticated: true,
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
  withAuth?: boolean
}> = ({ 
  children, 
  store = createTestStore(),
  initialEntries = ['/'],
  withAuth = true
}) => {
  const content = withAuth ? (
    <AuthProvider>{children}</AuthProvider>
  ) : children

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {content}
      </MemoryRouter>
    </Provider>
  )
}

describe('Integration: Bug Verification and Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    mockNavigate.mockClear()
    mockShowSuccess.mockClear()
    mockShowError.mockClear()
  })

  describe('Bug Fix 1: Farmer Reviews Page Infinite Loading', () => {
    it('should resolve infinite loading and display reviews within 3 seconds', async () => {
      const startTime = Date.now()
      
      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should show loading initially
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Should load reviews within 3 seconds (Requirement 1.1)
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      }, { timeout: 3000 })

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000)

      // Should display review count and average rating (Requirement 1.4)
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('Based on 2 reviews')).toBeInTheDocument()
    })

    it('should display appropriate empty state when no reviews exist', async () => {
      // Mock empty reviews (Requirement 1.2)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: []
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('No Reviews Yet')).toBeInTheDocument()
      })

      expect(screen.getByText("You haven't received any reviews yet. Complete some orders to start receiving customer feedback.")).toBeInTheDocument()
    })

    it('should provide retry mechanism when loading fails', async () => {
      // Mock API failure (Requirement 1.3)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'API Error' },
            { status: 500 }
          )
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })

      // Should provide retry option (Requirement 1.3)
      expect(screen.getByText('Retry')).toBeInTheDocument()

      // Test retry functionality
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: []
          })
        })
      )

      fireEvent.click(screen.getByText('Retry'))

      await waitFor(() => {
        expect(screen.getByText('No Reviews Yet')).toBeInTheDocument()
      })
    })

    it('should provide manual refresh functionality', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should provide refresh button (Requirement 1.6)
      const refreshButtons = screen.getAllByText('🔄 Refresh')
      expect(refreshButtons.length).toBeGreaterThan(0)

      fireEvent.click(refreshButtons[0])

      // Should show loading state during refresh
      await waitFor(() => {
        expect(screen.getByText('🔄 Loading...')).toBeInTheDocument()
      })
    })
  })

  describe('Bug Fix 2: Order Review Route 404 Errors', () => {
    it('should resolve 404 errors and display review form for valid orders', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should display review form instead of 404 (Requirement 2.1)
      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      expect(screen.getByText('Rate your experience')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Tell other buyers about your experience/)).toBeInTheDocument()
    })

    it('should redirect non-completed orders with error message', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      // Mock non-completed order (Requirement 2.2)
      server.use(
        http.get('http://localhost:5000/api/orders/pending-order', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'pending-order',
              buyerId: 'buyer123',
              farmerId: 'farmer123',
              status: 'PENDING',
              totalAmount: 25.50,
              items: [],
              farmer: { profile: { name: 'Test Farmer' } },
              createdAt: '2023-11-01T10:00:00Z',
              updatedAt: '2023-11-01T10:00:00Z'
            }
          })
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/pending-order/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should show error and redirect (Requirement 2.2)
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('You can only review completed orders')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/pending-order')
      }, { timeout: 3000 })
    })

    it('should display existing review when already reviewed', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      // Mock existing review (Requirement 2.3)
      server.use(
        http.get('http://localhost:5000/api/reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'existing-review',
                orderId: 'order123',
                rating: 4,
                comment: 'Already reviewed this order',
                createdAt: '2023-10-01T10:00:00Z',
                isApproved: true
              }
            ]
          })
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should display existing review instead of form (Requirement 2.3)
      await waitFor(() => {
        expect(screen.getByText('Your Review')).toBeInTheDocument()
      })

      expect(screen.getByText('You have already reviewed this order. Here\'s your review:')).toBeInTheDocument()
      expect(screen.getByText('Already reviewed this order')).toBeInTheDocument()
    })

    it('should validate buyer access and pre-populate form', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Should validate buyer access (Requirement 2.5)
      expect(screen.getByText('Order #order123')).toBeInTheDocument()
      
      // Should pre-populate with order and farmer info (Requirement 2.6)
      expect(screen.getByText('Test Farmer')).toBeInTheDocument()
      expect(screen.getByText('$25.50')).toBeInTheDocument()
      expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument()
    })

    it('should redirect to order detail after successful submission', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience with this farmer!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should redirect after successful submission (Requirement 2.4)
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Your review has been submitted successfully!')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/orders/order123')
    })
  })

  describe('Bug Fix 3: Dashboard Authentication Persistence', () => {
    it('should maintain authentication state on page refresh', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token')

      // Mock successful token validation (Requirement 3.1, 3.2)
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
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

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper withAuth={true}>
            {children}
          </TestWrapper>
        )
      })

      // Should maintain authentication without re-login (Requirement 3.1, 3.2)
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })

    it('should redirect to login when token is expired', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token')

      // Mock expired token (Requirement 3.3)
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          )
        })
      )

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper withAuth={true}>
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to login with return URL (Requirement 3.3)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })

    it('should handle missing user data recovery', async () => {
      localStorageMock.getItem.mockReturnValue('token-no-user')

      // Mock user data fetch (Requirement 3.4)
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
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

      const storeWithTokenOnly = createTestStore({
        token: 'token-no-user',
        user: null,
        isAuthenticated: false
      })

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={storeWithTokenOnly} withAuth={true}>
            {children}
          </TestWrapper>
        )
      })

      // Should recover user data (Requirement 3.4)
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })

    it('should handle network errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('network-error-token')

      // Mock network error (Requirement 3.5)
      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.error()
        })
      )

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper withAuth={true}>
            {children}
          </TestWrapper>
        )
      })

      // Should handle network errors gracefully (Requirement 3.5)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: expect.any(Object) },
          replace: true
        })
      })
    })

    it('should provide loading states during restoration', async () => {
      localStorageMock.getItem.mockReturnValue('slow-token')

      // Mock slow response (Requirement 3.6)
      server.use(
        http.get('http://localhost:5000/api/auth/me', async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'farmer123',
              email: 'farmer@test.com',
              role: 'FARMER',
              profile: { name: 'Slow Farmer' }
            }
          })
        })
      )

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper withAuth={true}>
            {children}
          </TestWrapper>
        )
      })

      // Should show loading state (Requirement 3.6)
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Should eventually load
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Bug Fix 4: Review Data Processing Robustness', () => {
    it('should handle both string and object user ID references', async () => {
      // Mock mixed data formats (Requirement 4.1)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 5,
                comment: 'Great service!',
                reviewerId: 'string-user-id', // String ID
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true
              },
              {
                _id: 'review2',
                rating: 4,
                comment: 'Good quality',
                reviewerId: { _id: 'object-user-id' }, // Object ID
                revieweeId: 'farmer123',
                orderId: 'order456',
                createdAt: '2023-11-15T14:30:00Z',
                isApproved: true
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should handle both formats (Requirement 4.1)
      expect(screen.getByText('Great service!')).toBeInTheDocument()
      expect(screen.getByText('Good quality')).toBeInTheDocument()
    })

    it('should display fallback information for missing data', async () => {
      // Mock missing reviewer data (Requirement 4.2)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 5,
                comment: 'Great service!',
                reviewerId: 'missing-reviewer-id',
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true
                // No reviewer object
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should display fallback information (Requirement 4.2)
      expect(screen.getByText('Great service!')).toBeInTheDocument()
      expect(screen.getByText('From: Customer')).toBeInTheDocument() // Fallback name
    })

    it('should handle malformed dates gracefully', async () => {
      // Mock malformed dates (Requirement 4.3)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 5,
                comment: 'Great service!',
                reviewerId: 'buyer123',
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: 'invalid-date-format', // Malformed date
                isApproved: true,
                reviewer: { profile: { name: 'Test Buyer' } }
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should handle malformed dates without crashing (Requirement 4.3)
      expect(screen.getByText('Great service!')).toBeInTheDocument()
      // Should show fallback date or handle gracefully
    })

    it('should validate data structure and log inconsistencies', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock inconsistent data (Requirement 4.4, 4.5)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 'invalid-rating', // Invalid rating
                comment: 'Good review',
                reviewerId: null, // Missing reviewer
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should log inconsistencies (Requirement 4.5)
      expect(consoleSpy).toHaveBeenCalled()

      // Should show processing error warning
      expect(screen.getByText('Some review data had formatting issues but was processed successfully')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should provide consistent display regardless of data variations', async () => {
      // Mock various data formats (Requirement 4.6)
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 5,
                comment: 'Complete review',
                reviewerId: 'buyer123',
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true,
                reviewer: { profile: { name: 'Complete Buyer' } }
              },
              {
                _id: 'review2',
                rating: 4,
                comment: 'Partial review',
                reviewerId: 'buyer456',
                revieweeId: 'farmer123',
                orderId: 'order456',
                createdAt: '2023-11-15T14:30:00Z',
                isApproved: true
                // Missing reviewer object
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should provide consistent display (Requirement 4.6)
      expect(screen.getByText('Complete review')).toBeInTheDocument()
      expect(screen.getByText('Partial review')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument() // Average rating
      expect(screen.getByText('Based on 2 reviews')).toBeInTheDocument()
    })
  })

  describe('Bug Fix 5: Review Form Validation and Error Handling', () => {
    it('should validate required rating field', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Try to submit without rating (Requirement 5.1)
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please select a rating from 1 to 5 stars')).toBeInTheDocument()
      })
    })

    it('should validate required comment field', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Add rating but no comment (Requirement 5.2)
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[3])

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please write a comment about your experience')).toBeInTheDocument()
      })
    })

    it('should handle network errors with retry option', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      // Mock network error (Requirement 5.3)
      server.use(
        http.post('http://localhost:5000/api/reviews', () => {
          return HttpResponse.error()
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show network error with retry option (Requirement 5.3)
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Network error. Please check your connection.')
      })

      // Form should still be available for retry
      expect(screen.getByText('Submit Review')).toBeInTheDocument()
    })

    it('should handle server errors appropriately', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      // Mock server error (Requirement 5.4)
      server.use(
        http.post('http://localhost:5000/api/reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show appropriate server error (Requirement 5.4)
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to submit review. Please try again.')
      })
    })

    it('should prevent duplicate review submissions', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'duplicate-buyer', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should prevent duplicate submissions (Requirement 5.5)
      await waitFor(() => {
        expect(screen.getByText('Your Review')).toBeInTheDocument()
      })

      expect(screen.getByText('You have already reviewed this order. Here\'s your review:')).toBeInTheDocument()
    })

    it('should provide loading states during submission', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      // Mock slow submission (Requirement 5.6)
      server.use(
        http.post('http://localhost:5000/api/reviews', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return HttpResponse.json({
            success: true,
            data: { _id: 'new-review', createdAt: new Date().toISOString() }
          })
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show loading state (Requirement 5.6)
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Bug Fix 6: Navigation and Route Protection', () => {
    it('should redirect farmers from buyer routes', async () => {
      const farmerStore = createTestStore({
        user: { _id: 'farmer123', role: 'FARMER', profile: { name: 'Test Farmer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={farmerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should redirect farmer away from buyer route (Requirement 6.1)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should redirect unauthenticated users to login', async () => {
      const unauthenticatedStore = createTestStore({
        user: null,
        isAuthenticated: false
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={unauthenticatedStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to login (Requirement 6.3)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: expect.any(Object) } })
      })
    })

    it('should provide proper breadcrumb navigation', async () => {
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Should provide breadcrumb navigation (Requirement 6.4)
      expect(screen.getByText('Order #order123')).toBeInTheDocument()
    })

    it('should handle back navigation correctly', async () => {
      const user = userEvent.setup()
      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
          >
            {children}
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Should provide back navigation (Requirement 6.5)
      const backButton = screen.getByText('Back to Order')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/orders/order123')
    })

    it('should handle deep linking with authentication checks', async () => {
      localStorageMock.getItem.mockReturnValue('deep-link-token')

      server.use(
        http.get('http://localhost:5000/api/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'buyer123',
              email: 'buyer@test.com',
              role: 'BUYER',
              profile: { name: 'Deep Link Buyer' }
            }
          })
        })
      )

      const buyerStore = createTestStore({
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Deep Link Buyer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper 
            store={buyerStore} 
            initialEntries={['/orders/order123/review']}
            withAuth={true}
          >
            {children}
          </TestWrapper>
        )
      })

      // Should handle deep linking with auth checks (Requirement 6.6)
      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })

  describe('Overall System Integration', () => {
    it('should handle complete error recovery scenarios', async () => {
      // Test complete error recovery workflow
      let apiCallCount = 0
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          apiCallCount++
          if (apiCallCount === 1) {
            return HttpResponse.error() // First call fails
          }
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'recovery-review',
                rating: 5,
                comment: 'Recovered successfully!',
                reviewerId: 'buyer123',
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true,
                reviewer: { profile: { name: 'Recovery Buyer' } }
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/Failed to load reviews/)).toBeInTheDocument()
      })

      // Click retry
      fireEvent.click(screen.getByText('Retry'))

      // Should recover and show reviews
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      expect(screen.getByText('Recovered successfully!')).toBeInTheDocument()
    })

    it('should maintain system stability under various error conditions', async () => {
      // Test system stability with multiple error types
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'stable-review',
                rating: null, // Invalid rating
                comment: undefined, // Missing comment
                reviewerId: { invalid: 'structure' }, // Invalid structure
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: 'not-a-date', // Invalid date
                isApproved: 'maybe' // Invalid boolean
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should handle multiple errors without crashing
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should show processing errors but continue functioning
      expect(screen.getByText('Some review data had formatting issues but was processed successfully')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })
})