import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, LoadingSpinner, ErrorDisplay, Button, OrderBreadcrumb, ReviewGuard, BackNavigation } from '../components/UI'
import { ReviewForm } from '../components/Reviews/ReviewForm'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { orderService } from '../services/orderService'
import { reviewService, ReviewCreateRequest } from '../services/reviewService'
import { Order, Review } from '../types/api'
import { processOrderItem } from '../utils/orderUtils'

interface ReviewEligibility {
  canReview: boolean
  reason?: 'not_completed' | 'already_reviewed' | 'not_buyer' | 'order_not_found'
  existingReview?: Review
}

const OrderReviewPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { success: showSuccess, error: showError } = useToastContext()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    // Only buyers can leave reviews
    if (user?.role !== 'BUYER') {
      navigate('/dashboard')
      return
    }

    if (!orderId) {
      navigate('/orders')
      return
    }
  }, [isAuthenticated, user, orderId, navigate])

  useEffect(() => {
    const loadOrderAndCheckEligibility = async () => {
      if (!orderId || !user) return

      try {
        setLoading(true)
        setError(null)

        // Load order details
        const orderResponse = await orderService.getOrder(orderId)
        
        if (!orderResponse.success || !orderResponse.data) {
          throw new Error(orderResponse.message || 'Order not found')
        }

        const orderData = orderResponse.data
        setOrder(orderData)

        // Check review eligibility
        const eligibilityResult = await checkReviewEligibility(orderId, user.id, orderData)
        setEligibility(eligibilityResult)

        // If not eligible, handle redirects (but only show error once)
        if (!eligibilityResult.canReview && eligibilityResult.reason !== 'already_reviewed') {
          switch (eligibilityResult.reason) {
            case 'not_completed':
              showError('You can only review completed orders')
              setTimeout(() => navigate(`/orders/${orderId}`), 2000)
              break
            case 'not_buyer':
              showError('You can only review orders you placed')
              setTimeout(() => navigate('/orders'), 2000)
              break
            case 'order_not_found':
              showError('Order not found')
              setTimeout(() => navigate('/orders'), 2000)
              break
            // For 'already_reviewed', we'll show the existing review without error
          }
        }
      } catch (err) {
        console.error('Failed to load order or check eligibility:', err)
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.role === 'BUYER') {
      loadOrderAndCheckEligibility()
    }
  }, [orderId, user, isAuthenticated, navigate, showError])

  const checkReviewEligibility = async (
    orderId: string, 
    userId: string, 
    order: Order
  ): Promise<ReviewEligibility> => {
    try {
      // Use the new canReviewOrder API endpoint
      const response = await reviewService.canReviewOrder(orderId);
      
      if (response.success && response.data) {
        if (response.data.canReview) {
          return { canReview: true };
        } else {
          // Map the reason from the API to our local reasons
          let reason: ReviewEligibility['reason'] = 'order_not_found';
          
          if (response.data.reason?.includes('already reviewed')) {
            reason = 'already_reviewed';
          } else if (response.data.reason?.includes('completed')) {
            reason = 'not_completed';
          } else if (response.data.reason?.includes('only review orders you placed')) {
            reason = 'not_buyer';
          } else if (response.data.reason?.includes('not found')) {
            reason = 'order_not_found';
          }
          
          return { 
            canReview: false, 
            reason,
            // If already reviewed, we could try to fetch the existing review
            // but for now we'll just indicate it exists
          };
        }
      } else {
        throw new Error(response.message || 'Failed to check review eligibility');
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      // Fallback to manual checks if API fails
      return await checkReviewEligibilityFallback(orderId, userId, order);
    }
  };

  const checkReviewEligibilityFallback = async (
    orderId: string, 
    userId: string, 
    order: Order
  ): Promise<ReviewEligibility> => {
    // Check if order exists
    if (!order) {
      return { canReview: false, reason: 'order_not_found' }
    }

    // Check if user is the buyer - convert both to strings for comparison
    if (String(order.buyerId) !== String(userId)) {
      return { canReview: false, reason: 'not_buyer' }
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED') {
      return { canReview: false, reason: 'not_completed' }
    }

    // Check if review already exists
    try {
      const reviewsResponse = await reviewService.getReviews({
        reviewerId: userId,
        revieweeId: order.farmerId
      })

      if (reviewsResponse.success && reviewsResponse.data) {
        const existingReview = reviewsResponse.data.find(
          review => review.orderId === orderId
        )

        if (existingReview) {
          return { 
            canReview: false, 
            reason: 'already_reviewed',
            existingReview 
          }
        }
      }
    } catch (err) {
      console.error('Error checking existing reviews:', err)
      // Continue with review process if we can't check existing reviews
    }

    return { canReview: true }
  }

  const handleSubmitReview = async (reviewData: ReviewCreateRequest) => {
    if (!order) return

    try {
      setSubmitting(true);
      setError(null); // Clear any previous errors
      
      const response = await reviewService.submitReview(reviewData);

      if (response.success && response.data) {
        showSuccess('Your review has been submitted successfully!');
        navigate(`/orders/${orderId}`);
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      
      // Let the ReviewForm handle the error display
      // We'll still show a toast for user feedback
      if (err.message?.includes('duplicate') || err.message?.includes('already reviewed')) {
        showError('You have already submitted a review for this order.');
      } else if (err.message?.includes('network') || err.message?.includes('Network')) {
        showError('Network error. Please check your connection.');
      } else {
        showError('Failed to submit review. Please try again.');
      }
      
      // Re-throw to let ReviewForm handle it
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const getFarmerName = (): string => {
    // Try to get farmer name from populated farmer.userId.profile.name (new backend structure)
    if (order?.farmer?.userId?.profile?.name) {
      return order.farmer.userId.profile.name;
    }
    
    // Fallback to old structure if available
    if (order?.farmer?.profile?.name) {
      return order.farmer.profile.name;
    }
    
    // Fallback: try to get from product data (if populated)
    if (order?.items && order.items.length > 0) {
      const firstItem = order.items[0];
      
      // Check if product is populated and has farmer info
      if (firstItem.product?.farmer?.userId?.profile?.name) {
        return firstItem.product.farmer.userId.profile.name;
      }
      
      // Check if productId is populated as object with farmer info
      if (typeof firstItem.productId === 'object' && firstItem.productId) {
        const productObj = firstItem.productId as any;
        if (productObj.farmer?.userId?.profile?.name) {
          return productObj.farmer.userId.profile.name;
        }
      }
    }
    
    // Simple fallback
    return 'Farmer'
  }

  if (!isAuthenticated || user?.role !== 'BUYER') {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay 
            message={error || 'Order not found'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </Layout>
    )
  }

  if (!eligibility) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <ReviewGuard orderId={orderId} userRole={user?.role}>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <OrderBreadcrumb 
              orderId={orderId!} 
              orderNumber={order?._id.slice(-8)}
              showReview={true}
            />
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Review Your Order
                </h1>
                <p className="text-gray-600">
                  Order #{order._id.slice(-8)} • Completed on {new Date(order.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <BackNavigation
                to={`/orders/${orderId}`}
                label="Back to Order"
                variant="button"
              />
            </div>
          </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Farmer</h3>
              <p className="text-gray-900">{getFarmerName()}</p>
              {order.farmer?.location && (
                <p className="text-sm text-gray-600">
                  {order.farmer.location.municipality}, {order.farmer.location.district}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Order Total</h3>
              <p className="text-2xl font-bold text-primary-600">
                Rs{order.totalAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Order Items Summary */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Items Ordered</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => {
                // Use the utility function to safely process the order item
                const processedItem = processOrderItem(item, user?.id);
                
                return (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="text-gray-900">
                        {processedItem.productName}
                      </span>
                      {processedItem.hasError && (
                        <span className="text-xs text-amber-600 ml-2">
                          (Data issue)
                        </span>
                      )}
                      <span className="text-gray-600 ml-2">
                        × {processedItem.quantity} {processedItem.unit || 'units'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      Rs{(processedItem.priceAtTime * processedItem.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Review Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {eligibility.canReview ? (
            <ReviewForm
              orderId={order._id}
              revieweeId={order.farmer?.userId?._id || order.farmerId}
              revieweeName={getFarmerName()}
              reviewerType="BUYER"
              onSubmit={handleSubmitReview}
              onCancel={() => navigate(`/orders/${orderId}`)}
              loading={submitting}
            />
          ) : eligibility.reason === 'already_reviewed' && eligibility.existingReview ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Review
              </h2>
              <p className="text-gray-600 mb-6">
                You have already reviewed this order. Here's your review:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xl ${
                          star <= eligibility.existingReview!.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {eligibility.existingReview.rating} out of 5 stars
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-4">
                  {eligibility.existingReview.comment}
                </p>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Reviewed on {new Date(eligibility.existingReview.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1">
                    Status: {eligibility.existingReview.isApproved ? (
                      <span className="text-green-600 font-medium">Approved</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">Pending Approval</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => navigate(`/orders/${orderId}`)}
                  variant="primary"
                >
                  Back to Order
                </Button>
                <Button
                  onClick={() => navigate('/orders')}
                  variant="secondary"
                >
                  View All Orders
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review Not Available
              </h2>
              <p className="text-gray-600 mb-6">
                {eligibility.reason === 'not_completed' && 'You can only review completed orders.'}
                {eligibility.reason === 'not_buyer' && 'You can only review orders you placed.'}
                {eligibility.reason === 'order_not_found' && 'Order not found.'}
              </p>
              <Button
                onClick={() => navigate(`/orders/${orderId}`)}
                variant="primary"
              >
                Back to Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </ReviewGuard>
)
}

export default OrderReviewPage