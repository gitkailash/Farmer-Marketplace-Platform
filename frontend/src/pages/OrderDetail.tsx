import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout, LoadingSpinner, ErrorDisplay, Button, OrderReviewSection, OrderBreadcrumb, NavigationGuard } from '../components/UI'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { orderService } from '../services/orderService'
import { Order } from '../types/api'
import { getShortProductId, getProductIdString } from '../utils/orderUtils'

const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const ORDER_STATUS_ICONS = {
  PENDING: '⏳',
  ACCEPTED: '✅',
  COMPLETED: '🎉',
  CANCELLED: '❌'
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { success: showSuccess, error: showError } = useToastContext()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Only buyers and farmers can view orders
    if (user?.role !== 'BUYER' && user?.role !== 'FARMER') {
      navigate('/dashboard')
      return
    }

    if (!id) {
      navigate('/orders')
      return
    }
  }, [isAuthenticated, user, id, navigate])

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const response = await orderService.getOrder(id)
        
        if (response.success && response.data) {
          setOrder(response.data)
        } else {
          throw new Error(response.message || 'Order not found')
        }
      } catch (err) {
        console.error('Failed to load order:', err)
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && (user?.role === 'BUYER' || user?.role === 'FARMER')) {
      loadOrder()
    }
  }, [id, isAuthenticated, user])

  const handleAcceptOrder = async () => {
    if (!order) return

    try {
      setActionLoading(true)
      const response = await orderService.acceptOrder(order._id)
      
      if (response.success && response.data) {
        setOrder(response.data)
        showSuccess('Order accepted successfully!')
      } else {
        throw new Error(response.message || 'Failed to accept order')
      }
    } catch (err) {
      console.error('Failed to accept order:', err)
      showError(err instanceof Error ? err.message : 'Failed to accept order')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!order) return

    try {
      setActionLoading(true)
      const response = await orderService.completeOrder(order._id)
      
      if (response.success && response.data) {
        setOrder(response.data)
        showSuccess('Order marked as completed!')
      } else {
        throw new Error(response.message || 'Failed to complete order')
      }
    } catch (err) {
      console.error('Failed to complete order:', err)
      showError(err instanceof Error ? err.message : 'Failed to complete order')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await orderService.cancelOrder(order._id)
      
      if (response.success && response.data) {
        setOrder(response.data)
        showSuccess('Order cancelled successfully')
      } else {
        throw new Error(response.message || 'Failed to cancel order')
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      showError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAuthenticated || (user?.role !== 'BUYER' && user?.role !== 'FARMER')) {
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

  const canAccept = user?.role === 'FARMER' && order.status === 'PENDING'
  const canComplete = user?.role === 'FARMER' && order.status === 'ACCEPTED'
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED'

  return (
    <NavigationGuard allowedRoles={['BUYER', 'FARMER']}>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <OrderBreadcrumb 
              orderId={order._id} 
              orderNumber={order._id.slice(-8)}
            />
          </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order._id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_ICONS[order.status]} {order.status}
              </span>
              <p className="text-2xl font-bold text-primary-600 mt-2">
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Order Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Buyer Information</h3>
              <p className="text-gray-600">Buyer ID: #{order.buyerId.slice(-8)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Farmer Information</h3>
              <p className="text-gray-600">Farmer ID: #{order.farmerId.slice(-8)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canAccept && (
              <Button
                onClick={handleAcceptOrder}
                variant="primary"
                disabled={actionLoading}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Accept Order'}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={handleCompleteOrder}
                variant="primary"
                disabled={actionLoading}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Mark as Completed'}
              </Button>
            )}

            {canCancel && (
              <Button
                onClick={handleCancelOrder}
                variant="secondary"
                disabled={actionLoading}
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Cancel Order'}
              </Button>
            )}

            {order.status === 'COMPLETED' && (
              <Link
                to={`/orders/${order._id}/review`}
                className="btn-primary"
              >
                Leave Review
              </Link>
            )}

            <Link
              to={`/messages?${user?.role === 'BUYER' ? 'farmer' : 'buyer'}=${user?.role === 'BUYER' ? order.farmerId : order.buyerId}`}
              className="btn-outline"
            >
              💬 Message {user?.role === 'BUYER' ? 'Farmer' : 'Buyer'}
            </Link>
          </div>
        </div>

        {/* Review Section for Completed Orders */}
        {order.status === 'COMPLETED' && user?.role === 'BUYER' && (
          <OrderReviewSection
            order={order}
            farmerName={`Farmer #${order.farmerId.slice(-8)}`}
            className="mb-8"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Order Items ({order.items.length})
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Product #{getShortProductId(item.productId)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Price at time of order: ${item.priceAtTime.toFixed(2)}
                      </p>
                      <Link
                        to={`/products/${getProductIdString(item.productId)}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View Product Details →
                      </Link>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900 mb-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-lg font-bold text-primary-600">
                        ${(item.priceAtTime * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Delivery Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Address:</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {order.deliveryAddress}
                  </p>
                </div>

                {order.notes && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Special Instructions:</h3>
                    <p className="text-gray-600 whitespace-pre-line">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm">📝</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.status !== 'PENDING' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">✅</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Accepted'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">🎉</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Completed</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="block w-full text-center btn-outline"
                >
                  ← Back to Orders
                </Link>
                
                {order.status === 'COMPLETED' && (
                  <Link
                    to={`/orders/${order._id}/review`}
                    className="block w-full text-center btn-primary"
                  >
                    Leave Review
                  </Link>
                )}
                
                <Link
                  to="/products"
                  className="block w-full text-center btn-outline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  </NavigationGuard>
)
}

export default OrderDetail