import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:5000/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          _id: 'user123',
          email: 'farmer@test.com',
          role: 'FARMER',
          profile: { name: 'Test Farmer' }
        },
        token: 'mock-jwt-token'
      }
    })
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'user123',
        email: 'farmer@test.com',
        role: 'FARMER',
        profile: { name: 'Test Farmer' }
      }
    })
  }),

  // Review endpoints
  http.get(`${API_BASE}/reviews/my-reviews`, ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    
    if (type === 'received') {
      return HttpResponse.json({
        success: true,
        data: [
          {
            _id: 'review1',
            rating: 5,
            comment: 'Great farmer, excellent products!',
            reviewerId: 'buyer123',
            revieweeId: 'user123',
            orderId: 'order123',
            createdAt: '2023-12-01T10:00:00Z',
            isApproved: true,
            reviewer: {
              profile: { name: 'Test Buyer' }
            }
          },
          {
            _id: 'review2',
            rating: 4,
            comment: 'Good quality vegetables',
            reviewerId: 'buyer456',
            revieweeId: 'user123',
            orderId: 'order456',
            createdAt: '2023-11-15T14:30:00Z',
            isApproved: true,
            reviewer: {
              profile: { name: 'Another Buyer' }
            }
          }
        ]
      })
    }

    return HttpResponse.json({
      success: true,
      data: []
    })
  }),

  // Order endpoints
  http.get(`${API_BASE}/orders/:id`, ({ params }) => {
    const { id } = params
    
    return HttpResponse.json({
      success: true,
      data: {
        _id: id,
        buyerId: 'buyer123',
        farmerId: 'farmer123',
        status: 'COMPLETED',
        totalAmount: 25.50,
        items: [
          {
            productId: 'product123',
            quantity: 2,
            priceAtTime: 10.00,
            product: {
              name: 'Fresh Tomatoes',
              unit: 'kg'
            }
          },
          {
            productId: 'product456',
            quantity: 1,
            priceAtTime: 5.50,
            product: {
              name: 'Organic Lettuce',
              unit: 'head'
            }
          }
        ],
        farmer: {
          profile: { name: 'Test Farmer' },
          location: {
            municipality: 'Test City',
            district: 'Test District'
          }
        },
        createdAt: '2023-11-01T10:00:00Z',
        updatedAt: '2023-11-15T16:00:00Z'
      }
    })
  }),

  // Review submission
  http.post(`${API_BASE}/reviews`, async ({ request }) => {
    const body = await request.json() as any
    
    // Simulate duplicate review check
    if (body.orderId === 'duplicate-order') {
      return HttpResponse.json(
        { success: false, message: 'You have already reviewed this order' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'new-review-id',
        ...body,
        createdAt: new Date().toISOString(),
        isApproved: false
      }
    })
  }),

  // Review eligibility check
  http.get(`${API_BASE}/reviews`, ({ request }) => {
    const url = new URL(request.url)
    const reviewerId = url.searchParams.get('reviewerId')
    const revieweeId = url.searchParams.get('revieweeId')
    
    // Return empty array for new reviews, or existing review for duplicates
    if (reviewerId === 'duplicate-buyer') {
      return HttpResponse.json({
        success: true,
        data: [
          {
            _id: 'existing-review',
            orderId: 'order123',
            rating: 4,
            comment: 'Already reviewed',
            createdAt: '2023-10-01T10:00:00Z',
            isApproved: true
          }
        ]
      })
    }

    return HttpResponse.json({
      success: true,
      data: []
    })
  }),

  // Network error simulation
  http.get(`${API_BASE}/reviews/network-error`, () => {
    return HttpResponse.error()
  }),

  // Server error simulation
  http.post(`${API_BASE}/reviews/server-error`, () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  })
]