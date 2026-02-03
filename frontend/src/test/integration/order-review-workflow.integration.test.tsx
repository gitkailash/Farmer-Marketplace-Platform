/**
 * Integration Tests: Buyer Order Review Workflow End-to-End
 * 
 * Tests the complete buyer review submission workflow including:
 * - Order review route access and validation
 * - Review form display and submission
 * - Order eligibility checking
 * - Error handling and validation
 * - Navigation and redirects
 * 
 * **Feature: review-dashboard-fixes, Integration Test: Order Review Workflow**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import OrderReviewPage from '../../pages/OrderReviewPage'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

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

// Mock store setup
const createMockStore = (authState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {
        user: { _id: 'buyer123', role: 'BUYER', profile: { name: 'Test Buyer' } },
        isAuthenticated: true,
        loading: false,
        error: null,
        ...authState
      }) => state,
      cart: (state = { items: [], totalItems: 0, totalAmount: 0, isOpen: false }) => state,
      notifications: (state = { notifications: [], unreadCount: 0 }) => state,
    },
  })
}

const TestWrapper: React.FC<{ 
  children: React.ReactNode
  store?: any
  initialEntries?: string[]
}> = ({ 
  children, 
  store = createMockStore(),
  initialEntries = ['/orders/order123/review']
}) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  </Provider>
)

describe('Integration: Order Review Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockShowSuccess.mockClear()
    mockShowError.mockClear()
  })

  describe('Successful Review Submission Workflow', () => {
    it('should complete full review submission workflow', async () => {
      const user = userEvent.setup()
      
      render(<OrderReviewPage />, { wrapper: TestWrapper })

      // Should load order and show review form
      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Should display order summary
      expect(screen.getByText('Order #order123')).toBeInTheDocument()
      expect(screen.getByText('Test Farmer')).toBeInTheDocument()
      expect(screen.getByText('$25.50')).toBeInTheDocument()
      expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument()
      expect(screen.getByText('Organic Lettuce')).toBeInTheDocument()

      // Should show review form
      expect(screen.getByText('Rate your experience')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Tell other buyers about your experience/)).toBeInTheDocument()

      // Fill out review form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4]) // 5 stars

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Excellent farmer with high quality products. Fast delivery and great communication!')

      // Submit review
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument()

      // Should show success message and navigate
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Your review has been submitted successfully!')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/orders/order123')
    })

    it('should handle review form validation correctly', async () => {
      const user = userEvent.setup()
      
      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Try to submit without rating
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Please select a rating from 1 to 5 stars')).toBeInTheDocument()
      })

      // Add rating but no comment
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[3]) // 4 stars

      await user.click(submitButton)

      // Should show comment validation error
      await waitFor(() => {
        expect(screen.getByText('Please write a comment about your experience')).toBeInTheDocument()
      })

      // Add short comment
      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Good')

      await user.click(submitButton)

      // Should show minimum length error
      await waitFor(() => {
        expect(screen.getByText('Comment must be at least 10 characters long')).toBeInTheDocument()
      })
    })
  })

  describe('Order Eligibility and Access Control', () => {
    it('should redirect non-buyers to dashboard', async () => {
      const farmerStore = createMockStore({
        user: { _id: 'farmer123', role: 'FARMER', profile: { name: 'Test Farmer' } }
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={farmerStore}>
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should redirect unauthenticated users to login', async () => {
      const unauthenticatedStore = createMockStore({
        user: null,
        isAuthenticated: false
      })

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={unauthenticatedStore}>
            {children}
          </TestWrapper>
        )
      })

      // Should redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: expect.any(Object) } })
      })
    })

    it('should handle non-completed orders correctly', async () => {
      // Mock non-completed order
      server.use(
        http.get('http://localhost:5000/api/orders/pending-order', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'pending-order',
              buyerId: 'buyer123',
              farmerId: 'farmer123',
              status: 'PENDING', // Not completed
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
          <TestWrapper initialEntries={['/orders/pending-order/review']}>
            {children}
          </TestWrapper>
        )
      })

      // Should show error and redirect
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('You can only review completed orders')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders/pending-order')
      }, { timeout: 3000 })
    })

    it('should handle orders from different buyers correctly', async () => {
      // Mock order from different buyer
      server.use(
        http.get('http://localhost:5000/api/orders/other-buyer-order', () => {
          return HttpResponse.json({
            success: true,
            data: {
              _id: 'other-buyer-order',
              buyerId: 'different-buyer', // Different buyer
              farmerId: 'farmer123',
              status: 'COMPLETED',
              totalAmount: 25.50,
              items: [],
              farmer: { profile: { name: 'Test Farmer' } },
              createdAt: '2023-11-01T10:00:00Z',
              updatedAt: '2023-11-15T16:00:00Z'
            }
          })
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/orders/other-buyer-order/review']}>
            {children}
          </TestWrapper>
        )
      })

      // Should show error and redirect
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('You can only review orders you placed')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders')
      }, { timeout: 3000 })
    })

    it('should display existing review when already reviewed', async () => {
      // Mock existing review check
      server.use(
        http.get('http://localhost:5000/api/reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'existing-review',
                orderId: 'order123',
                rating: 4,
                comment: 'Already submitted this review',
                createdAt: '2023-10-01T10:00:00Z',
                isApproved: true
              }
            ]
          })
        })
      )

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Your Review')).toBeInTheDocument()
      })

      // Should display existing review
      expect(screen.getByText('You have already reviewed this order. Here\'s your review:')).toBeInTheDocument()
      expect(screen.getByText('Already submitted this review')).toBeInTheDocument()
      expect(screen.getByText('4 out of 5 stars')).toBeInTheDocument()
      expect(screen.getByText('Approved')).toBeInTheDocument()

      // Should show navigation buttons
      expect(screen.getByText('Back to Order')).toBeInTheDocument()
      expect(screen.getByText('View All Orders')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during submission', async () => {
      const user = userEvent.setup()

      // Mock network error for review submission
      server.use(
        http.post('http://localhost:5000/api/reviews', () => {
          return HttpResponse.error()
        })
      )

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill out and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience with this farmer!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show network error
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Network error. Please check your connection.')
      })

      // Form should still be available for retry
      expect(screen.getByText('Submit Review')).toBeInTheDocument()
    })

    it('should handle duplicate review errors', async () => {
      const user = userEvent.setup()

      // Mock duplicate review error
      server.use(
        http.post('http://localhost:5000/api/reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'You have already reviewed this order' },
            { status: 400 }
          )
        })
      )

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill out and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience with this farmer!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show duplicate error
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('You have already submitted a review for this order.')
      })
    })

    it('should handle server errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock server error
      server.use(
        http.post('http://localhost:5000/api/reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill out and submit form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Great experience with this farmer!')

      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show generic error
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to submit review. Please try again.')
      })
    })

    it('should handle order not found errors', async () => {
      // Mock order not found
      server.use(
        http.get('http://localhost:5000/api/orders/nonexistent', () => {
          return HttpResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 }
          )
        })
      )

      render(<OrderReviewPage />, { 
        wrapper: ({ children }) => (
          <TestWrapper initialEntries={['/orders/nonexistent/review']}>
            {children}
          </TestWrapper>
        )
      })

      // Should show error display
      await waitFor(() => {
        expect(screen.getByText('Order not found')).toBeInTheDocument()
      })

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  describe('Navigation and Breadcrumbs', () => {
    it('should display correct breadcrumb navigation', async () => {
      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Should show breadcrumb with order number
      expect(screen.getByText('Order #order123')).toBeInTheDocument()
    })

    it('should handle back navigation correctly', async () => {
      const user = userEvent.setup()

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Click back button
      const backButton = screen.getByText('Back to Order')
      await user.click(backButton)

      // Should navigate back to order detail
      expect(mockNavigate).toHaveBeenCalledWith('/orders/order123')
    })

    it('should handle cancel button correctly', async () => {
      const user = userEvent.setup()

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Click cancel button
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Should navigate back to order detail
      expect(mockNavigate).toHaveBeenCalledWith('/orders/order123')
    })
  })

  describe('Form State Management', () => {
    it('should maintain form state during loading operations', async () => {
      const user = userEvent.setup()

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill out form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[3]) // 4 stars

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Good experience overall')

      // Verify form state is maintained
      expect(screen.getByDisplayValue('Good experience overall')).toBeInTheDocument()
      
      // Check that 4th star is selected (visual feedback)
      const fourthStar = stars[3]
      expect(fourthStar).toHaveClass('text-yellow-400') // Assuming this class indicates selection
    })

    it('should disable form during submission', async () => {
      const user = userEvent.setup()

      // Mock slow response
      server.use(
        http.post('http://localhost:5000/api/reviews', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return HttpResponse.json({
            success: true,
            data: { _id: 'new-review', createdAt: new Date().toISOString() }
          })
        })
      )

      render(<OrderReviewPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument()
      })

      // Fill out form
      const stars = screen.getAllByRole('button', { name: /star/i })
      await user.click(stars[4])

      const commentField = screen.getByPlaceholderText(/Tell other buyers about your experience/)
      await user.type(commentField, 'Excellent service and quality!')

      // Submit form
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)

      // Should show loading state and disable form
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })
})