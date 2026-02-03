import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Products from '../Products'
import { Product } from '../../types/api'
import * as productService from '../../services/productService'

// Mock the product service
jest.mock('../../services/productService')
const mockProductService = productService as jest.Mocked<typeof productService>

// Create a mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, token: null, isAuthenticated: false }) => state,
    cart: (state = { items: [], totalItems: 0, totalAmount: 0, isOpen: false }) => state,
    notifications: (state = { notifications: [], unreadCount: 0 }) => state,
  },
})

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
)

describe('Products - Farmer Profile Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays farmer name when complete farmer profile is available', async () => {
    const mockProduct: Product = {
      _id: '1',
      farmerId: 'farmer123',
      name: 'Test Product',
      description: 'Test Description',
      category: 'Vegetables',
      price: 10,
      unit: 'kg',
      stock: 5,
      images: ['test.jpg'],
      status: 'PUBLISHED',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      farmer: {
        _id: 'farmer123',
        userId: {
          profile: {
            name: 'John Farmer'
          }
        },
        rating: 4.5,
        reviewCount: 10,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      }
    }

    mockProductService.getProducts.mockResolvedValue({
      success: true,
      data: [mockProduct],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 }
    })

    render(<Products />, { wrapper: TestWrapper })

    // Wait for the product to be loaded and displayed
    await screen.findByText('Test Product')
    
    // Check that the farmer name is displayed correctly
    expect(screen.getByText('by John Farmer')).toBeInTheDocument()
  })

  it('displays fallback farmer ID when farmer profile is missing', async () => {
    const mockProduct: Product = {
      _id: '1',
      farmerId: 'farmer123456789',
      name: 'Test Product',
      description: 'Test Description',
      category: 'Vegetables',
      price: 10,
      unit: 'kg',
      stock: 5,
      images: ['test.jpg'],
      status: 'PUBLISHED',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      // No farmer property - simulating missing farmer data
    }

    mockProductService.getProducts.mockResolvedValue({
      success: true,
      data: [mockProduct],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 }
    })

    render(<Products />, { wrapper: TestWrapper })

    await screen.findByText('Test Product')
    
    // Check that the fallback farmer ID is displayed (last 8 characters)
    expect(screen.getByText('by Farmer #56789')).toBeInTheDocument()
  })

  it('displays fallback farmer ID when userId is missing', async () => {
    const mockProduct: Product = {
      _id: '1',
      farmerId: 'farmer987654321',
      name: 'Test Product',
      description: 'Test Description',
      category: 'Vegetables',
      price: 10,
      unit: 'kg',
      stock: 5,
      images: ['test.jpg'],
      status: 'PUBLISHED',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      farmer: {
        _id: 'farmer987654321',
        // Missing userId property
        userId: undefined as any,
        rating: 4.5,
        reviewCount: 10,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      }
    }

    mockProductService.getProducts.mockResolvedValue({
      success: true,
      data: [mockProduct],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 }
    })

    render(<Products />, { wrapper: TestWrapper })

    await screen.findByText('Test Product')
    
    // Check that the fallback farmer ID is displayed
    expect(screen.getByText('by Farmer #54321')).toBeInTheDocument()
  })

  it('displays fallback farmer ID when profile is missing', async () => {
    const mockProduct: Product = {
      _id: '1',
      farmerId: 'farmer111222333',
      name: 'Test Product',
      description: 'Test Description',
      category: 'Vegetables',
      price: 10,
      unit: 'kg',
      stock: 5,
      images: ['test.jpg'],
      status: 'PUBLISHED',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      farmer: {
        _id: 'farmer111222333',
        userId: {
          // Missing profile property
          profile: undefined as any
        },
        rating: 4.5,
        reviewCount: 10,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      }
    }

    mockProductService.getProducts.mockResolvedValue({
      success: true,
      data: [mockProduct],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 }
    })

    render(<Products />, { wrapper: TestWrapper })

    await screen.findByText('Test Product')
    
    // Check that the fallback farmer ID is displayed
    expect(screen.getByText('by Farmer #22333')).toBeInTheDocument()
  })
})