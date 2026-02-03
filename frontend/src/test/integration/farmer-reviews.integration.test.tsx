/**
 * Integration Tests: Farmer Reviews Page Loading and Display
 * 
 * Tests the complete farmer reviews workflow including:
 * - Loading reviews from API
 * - Displaying review summary and individual reviews
 * - Error handling and retry mechanisms
 * - Empty state handling
 * - Data processing robustness
 * 
 * **Feature: review-dashboard-fixes, Integration Test: Farmer Reviews**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import FarmerReviews from '../../pages/farmer/FarmerReviews'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock store setup
const createMockStore = (authState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {
        user: { _id: 'farmer123', role: 'FARMER', profile: { name: 'Test Farmer' } },
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

const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
)

describe('Integration: Farmer Reviews Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Review Loading and Display', () => {
    it('should load and display farmer reviews with summary', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Should show loading state initially
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Wait for reviews to load
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should display rating overview
      expect(screen.getByText('Your Rating Overview')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument() // Average rating
      expect(screen.getByText('Based on 2 reviews')).toBeInTheDocument()

      // Should display individual reviews
      expect(screen.getByText('Great farmer, excellent products!')).toBeInTheDocument()
      expect(screen.getByText('Good quality vegetables')).toBeInTheDocument()

      // Should show approved status
      expect(screen.getAllByText('Approved')).toHaveLength(2)
    })

    it('should handle empty reviews state correctly', async () => {
      // Mock empty reviews response
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
      expect(screen.getByText('Check for Reviews')).toBeInTheDocument()
    })

    it('should refresh reviews when refresh button is clicked', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Find and click refresh button
      const refreshButtons = screen.getAllByText('🔄 Refresh')
      fireEvent.click(refreshButtons[0])

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('🔄 Loading...')).toBeInTheDocument()
      })

      // Should reload reviews
      await waitFor(() => {
        expect(screen.getByText('🔄 Refresh')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle API errors with retry mechanism', async () => {
      // Mock API error
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
          )
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

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

    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.error()
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Failed to load reviews/)).toBeInTheDocument()
      })

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should show partial data with error warning when refresh fails', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Mock error for refresh
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json(
            { success: false, message: 'Refresh failed' },
            { status: 500 }
          )
        })
      )

      // Click refresh
      const refreshButtons = screen.getAllByText('🔄 Refresh')
      fireEvent.click(refreshButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Refresh failed (Showing cached data)')).toBeInTheDocument()
      })

      // Should still show the original reviews
      expect(screen.getByText('Great farmer, excellent products!')).toBeInTheDocument()
    })
  })

  describe('Data Processing Robustness', () => {
    it('should handle malformed review data gracefully', async () => {
      // Mock malformed data response
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
                createdAt: 'invalid-date', // Invalid date
                isApproved: true
              },
              {
                _id: 'review2',
                rating: 4,
                comment: '', // Empty comment
                reviewerId: { _id: 'buyer456' }, // Object instead of string
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

      // Should show processing error warning
      expect(screen.getByText('Some review data had formatting issues but was processed successfully')).toBeInTheDocument()

      // Should still display processable reviews
      expect(screen.getByText('Your Rating Overview')).toBeInTheDocument()
    })

    it('should handle missing reviewer information with fallbacks', async () => {
      server.use(
        http.get('http://localhost:5000/api/reviews/my-reviews', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                _id: 'review1',
                rating: 5,
                comment: 'Great service!',
                reviewerId: 'buyer123456789',
                revieweeId: 'farmer123',
                orderId: 'order123',
                createdAt: '2023-12-01T10:00:00Z',
                isApproved: true
                // No reviewer object - should use fallback
              }
            ]
          })
        })
      )

      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should display review with fallback reviewer name
      expect(screen.getByText('Great service!')).toBeInTheDocument()
      expect(screen.getByText('From: Customer')).toBeInTheDocument() // Fallback name
    })
  })

  describe('Tab Navigation and Review Management', () => {
    it('should switch between received and written reviews tabs', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Should start on "Reviews About Me" tab
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument()

      // Click on "Reviews I've Written" tab
      fireEvent.click(screen.getByText('Reviews I\'ve Written'))

      // Should switch to written reviews tab
      expect(screen.getByText('Reviews you\'ve written about buyers after completing orders.')).toBeInTheDocument()
    })

    it('should maintain tab state during refresh operations', async () => {
      render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Switch to written reviews tab
      fireEvent.click(screen.getByText('Reviews I\'ve Written'))

      // Refresh reviews
      const refreshButtons = screen.getAllByText('🔄 Refresh')
      fireEvent.click(refreshButtons[0])

      // Should stay on written reviews tab
      await waitFor(() => {
        expect(screen.getByText('Reviews you\'ve written about buyers after completing orders.')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Integration', () => {
    it('should not load reviews when user is not authenticated', async () => {
      const unauthenticatedStore = createMockStore({
        user: null,
        isAuthenticated: false
      })

      render(<FarmerReviews />, { 
        wrapper: ({ children }) => (
          <TestWrapper store={unauthenticatedStore}>
            {children}
          </TestWrapper>
        )
      })

      // Should show loading state but not make API calls
      expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()

      // Should not show reviews after waiting
      await waitFor(() => {
        expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle user ID changes correctly', async () => {
      const { rerender } = render(<FarmerReviews />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument()
      })

      // Change user ID
      const newStore = createMockStore({
        user: { _id: 'different-farmer', role: 'FARMER', profile: { name: 'Different Farmer' } }
      })

      rerender(
        <TestWrapper store={newStore}>
          <FarmerReviews />
        </TestWrapper>
      )

      // Should reload reviews for new user
      await waitFor(() => {
        expect(screen.getByText('Loading your reviews...')).toBeInTheDocument()
      })
    })
  })
})