import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, LoadingSpinner, ErrorDisplay, EmptyState, Button } from '../components/UI'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { useAppTranslation } from '../contexts/I18nProvider'
import { getLocalizedText } from '../utils/multilingual'
import { notificationAwareOrderService } from '../services/notificationIntegration'
import { Order } from '../types/api'
import { processOrderItems, processOrderWithRetry, getShortProductId } from '../utils/orderUtils'
import OrderErrorBoundary from '../components/Orders/OrderErrorBoundary'
import { errorLogger } from '../utils/errorHandling'

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

const Orders: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { success: showSuccess, error: showError } = useToastContext()
  const { t, language } = useAppTranslation('buyer')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'ALL'>('ALL')

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
  }, [isAuthenticated, user, navigate])

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await notificationAwareOrderService.getMyOrders()
      
      if (response.success && response.data) {
        setOrders(response.data)
      } else {
        throw new Error(response.message || t('orders.page.errorLoading'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('orders.page.errorLoading')
      setError(errorMessage)
      
      // Log error with context
      errorLogger.logError(
        err as Error,
        {
          component: 'Orders',
          operation: 'loadOrders',
          userId: user?.id
        },
        'medium'
      )
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'BUYER' || user?.role === 'FARMER')) {
      loadOrders()
    }
  }, [isAuthenticated, user, loadOrders])

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await notificationAwareOrderService.acceptOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.actions.acceptSuccess'))
        loadOrders() // Refresh orders
      } else {
        throw new Error(response.message || t('orders.actions.acceptError'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('orders.actions.acceptError')
      showError(errorMessage)
      
      errorLogger.logError(
        err as Error,
        {
          component: 'Orders',
          operation: 'acceptOrder',
          userId: user?.id
        },
        'medium'
      )
    }
  }

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await notificationAwareOrderService.completeOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.actions.completeSuccess'))
        loadOrders() // Refresh orders
      } else {
        throw new Error(response.message || t('orders.actions.completeError'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('orders.actions.completeError')
      showError(errorMessage)
      
      errorLogger.logError(
        err as Error,
        {
          component: 'Orders',
          operation: 'completeOrder',
          userId: user?.id
        },
        'medium'
      )
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t('orders.actions.cancelConfirm'))) {
      return
    }

    try {
      const response = await notificationAwareOrderService.cancelOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.actions.cancelSuccess'))
        loadOrders() // Refresh orders
      } else {
        throw new Error(response.message || t('orders.actions.cancelError'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('orders.actions.cancelError')
      showError(errorMessage)
      
      errorLogger.logError(
        err as Error,
        {
          component: 'Orders',
          operation: 'cancelOrder',
          userId: user?.id
        },
        'medium'
      )
    }
  }

  // Filter orders by status
  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  if (!isAuthenticated || (user?.role !== 'BUYER' && user?.role !== 'FARMER')) {
    return null // Will redirect in useEffect
  }

  if (loading && orders.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <OrderErrorBoundary userId={user?.id}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.role === 'BUYER' ? t('orders.page.title') : t('orders.page.titleFarmer')}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'BUYER' 
                ? t('orders.page.subtitle')
                : t('orders.page.subtitleFarmer')
              }
            </p>
          </div>

          {/* Status Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('orders.filters.allOrders')} ({orders.length})
              </button>
              {(['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map((status) => {
                const count = orders.filter(order => order.status === status).length
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedStatus === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ORDER_STATUS_ICONS[status]} {t(`orders.status.${status.toLowerCase()}`)} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <ErrorDisplay 
              message={error}
              onRetry={loadOrders}
              className="mb-8"
            />
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 && !loading ? (
            <EmptyState
              icon="📦"
              title={selectedStatus === 'ALL' ? t('orders.empty.title') : t('orders.empty.titleFiltered', { status: t(`orders.status.${selectedStatus.toLowerCase()}`) })}
              description={
                user?.role === 'BUYER'
                  ? t('orders.empty.descriptionBuyer')
                  : t('orders.empty.descriptionFarmer')
              }
              actionLabel={user?.role === 'BUYER' ? t('orders.empty.startShopping') : undefined}
              onAction={user?.role === 'BUYER' ? () => navigate('/products') : undefined}
            />
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  userRole={user?.role as 'BUYER' | 'FARMER'}
                  userId={user?.id}
                  language={language}
                  onAccept={() => handleAcceptOrder(order._id)}
                  onComplete={() => handleCompleteOrder(order._id)}
                  onCancel={() => handleCancelOrder(order._id)}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Loading more orders */}
          {loading && orders.length > 0 && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </Layout>
    </OrderErrorBoundary>
  )
}

// Order Card Component with enhanced error handling and improved fallback displays
interface OrderCardProps {
  order: Order
  userRole: 'BUYER' | 'FARMER'
  userId?: string
  language: string
  onAccept: () => void
  onComplete: () => void
  onCancel: () => void
  t: (key: string, options?: any) => string
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  userRole, 
  userId,
  language,
  onAccept, 
  onComplete, 
  onCancel,
  t
}) => {
  const [processedItems, setProcessedItems] = useState<any[]>([])
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [hasDataIssues, setHasDataIssues] = useState(false)

  const canAccept = userRole === 'FARMER' && order.status === 'PENDING'
  const canComplete = userRole === 'FARMER' && order.status === 'ACCEPTED'
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED'

  // Enhanced order items processing with improved fallback handling
  useEffect(() => {
    const processItems = async () => {
      setIsProcessing(true)
      setProcessingError(null)
      setHasDataIssues(false)

      try {
        // First attempt: Use the enhanced processing with retry
        const result = await processOrderWithRetry(order, userId)
        
        if (result.success && result.processedOrder) {
          setProcessedItems(result.processedOrder.items)
          setHasDataIssues(result.processedOrder.hasErrors || false)
        } else {
          // Second attempt: Fallback to basic processing
          setProcessingError(result.error || 'Failed to process order items')
          
          try {
            const fallbackItems = processOrderItems(order.items || [], userId)
            setProcessedItems(fallbackItems)
            setHasDataIssues(fallbackItems.some(item => item.hasError))
          } catch (fallbackError) {
            // Final fallback: Create minimal display items from raw data
            const minimalItems = createMinimalDisplayItems(order.items || [], language as 'en' | 'ne')
            setProcessedItems(minimalItems)
            setHasDataIssues(true)
            setProcessingError('Using minimal display due to data processing issues')
          }
        }
      } catch (error) {
        // Complete failure: Create emergency fallback
        const emergencyItems = createEmergencyFallbackItems(order)
        setProcessedItems(emergencyItems)
        setHasDataIssues(true)
        setProcessingError('Order data could not be processed normally')
        
        errorLogger.logError(
          error as Error,
          {
            component: 'OrderCard',
            operation: 'processItems',
            userId
          },
          'high'
        )
      }
      
      setIsProcessing(false)
    }

    processItems()
  }, [order, userId])

  // Create minimal display items when processing fails
  const createMinimalDisplayItems = (items: any[], lang: 'en' | 'ne') => {
    return items.map((item, index) => {
      try {
        // Extract basic information regardless of data structure
        let productId = 'unknown'
        let productName = `Item ${index + 1}`
        
        if (typeof item.productId === 'string') {
          productId = item.productId
          productName = `Product #${getShortProductId(item.productId)}`
        } else if (item.productId && typeof item.productId === 'object') {
          productId = item.productId.id || item.productId.id || 'unknown'
          productName = getLocalizedText(item.productId.name, lang) || `Product #${getShortProductId(productId)}`
        } else if (item.product) {
          productId = item.product.id || 'unknown'
          productName = getLocalizedText(item.product.name, lang) || `Product #${getShortProductId(productId)}`
        }
        
        return {
          productId,
          productName,
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          priceAtTime: typeof item.priceAtTime === 'number' ? item.priceAtTime : 0,
          hasError: true,
          errorMessage: 'Minimal display mode'
        }
      } catch (error) {
        return {
          productId: `error-${index}`,
          productName: `Item ${index + 1} (Error)`,
          quantity: 1,
          priceAtTime: 0,
          hasError: true,
          errorMessage: 'Could not process item'
        }
      }
    })
  }

  // Create emergency fallback when even minimal processing fails
  const createEmergencyFallbackItems = (order: any) => {
    const itemCount = order.items?.length || 1
    return [{
      productId: 'emergency-fallback',
      productName: `${itemCount} item${itemCount !== 1 ? 's' : ''}`,
      quantity: itemCount,
      priceAtTime: order.totalAmount || 0,
      hasError: true,
      errorMessage: 'Emergency display mode'
    }]
  }

  return (
    <OrderErrorBoundary userId={userId} orderData={order}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('orders.card.orderNumber', { number: order._id.slice(-8) })}
              </h3>
              <p className="text-sm text-gray-600">
                {t('orders.card.placedOn', { date: new Date(order.createdAt).toLocaleDateString() })}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                {t(`orders.status.${order.status.toLowerCase()}`)}
              </span>
              <p className="text-lg font-bold text-primary-600 mt-1">
                Rs{order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                {userRole === 'BUYER' ? t('orders.card.farmer') : t('orders.card.buyer')}
              </span>
              <span className="ml-2 text-gray-600">
                #{(userRole === 'BUYER' ? order.farmerId : order.buyerId).slice(-8)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t('orders.card.items')}</span>
              <span className="ml-2 text-gray-600">
                {t('orders.card.itemCount', { count: order.items.length })}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">{t('orders.card.orderItems')}</h4>
          
          {/* Data quality indicators */}
          {hasDataIssues && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div className="text-sm text-amber-700">
                  <p className="font-medium">{t('orders.processing.dataQualityNotice')}</p>
                  <p>{t('orders.processing.dataQualityDesc')}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Processing error display */}
          {processingError && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 text-sm">🔧</span>
                <div className="text-sm text-orange-700">
                  <p className="font-medium">{t('orders.processing.processingNotice')}</p>
                  <p>{processingError}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isProcessing ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600">{t('orders.processing.title')}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {processedItems.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-4xl mb-2">📦</div>
                  <p className="text-gray-600 font-medium">{t('orders.processing.noItemsDisplayed')}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('orders.processing.orderTotal', { total: order.totalAmount.toFixed(2) })}
                  </p>
                </div>
              ) : (
                processedItems.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {/* Product Image with enhanced fallback */}
                        <div className="w-12 h-12 flex-shrink-0">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded-md border border-gray-200"
                              onError={(e) => {
                                // Replace with placeholder on error
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const placeholder = target.nextElementSibling as HTMLElement
                                if (placeholder) {
                                  placeholder.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs ${item.image ? 'hidden' : 'flex'}`}
                            style={{ display: item.image ? 'none' : 'flex' }}
                          >
                            📦
                          </div>
                        </div>
                        
                        {/* Product Information */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {item.productName}
                            </p>
                            {item.hasError && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 flex-shrink-0">
                                ⚠️ {item.errorMessage}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-600">
                              Rs{item.priceAtTime.toFixed(2)}
                              {item.unit ? ` per ${item.unit}` : ' each'}
                            </p>
                            
                            {/* Product ID for debugging/support */}
                            {item.productId !== 'unknown' && item.productId !== 'emergency-fallback' && (
                              <p className="text-xs text-gray-400 font-mono">
                                {t('orders.card.productId', { id: getShortProductId(item.productId) })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quantity and Total */}
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-medium text-gray-900">
                        {t('orders.card.quantity', { quantity: item.quantity })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Rs{(item.priceAtTime * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Order Summary */}
              <div className="pt-3 mt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{t('orders.card.orderTotal')}</span>
                  <span className="font-bold text-lg text-primary-600">
                    Rs{order.totalAmount.toFixed(2)}
                  </span>
                </div>
                {processedItems.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('orders.card.itemCount', { count: processedItems.length })} • 
                    {hasDataIssues ? t('orders.processing.someDetailsUnavailable') : t('orders.processing.allDetailsLoaded')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Information */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">{t('orders.card.deliveryAddress')}</h4>
          <p className="text-gray-600 whitespace-pre-line">{order.deliveryAddress}</p>
          {order.notes && (
            <>
              <h4 className="font-medium text-gray-900 mt-4 mb-2">{t('orders.card.specialInstructions')}</h4>
              <p className="text-gray-600 whitespace-pre-line">{order.notes}</p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/orders/${order._id}`}
              className="btn-outline"
            >
              {t('orders.card.viewDetails')}
            </Link>

            {canAccept && (
              <Button
                onClick={onAccept}
                variant="primary"
              >
                {t('orders.card.acceptOrder')}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={onComplete}
                variant="primary"
              >
                {t('orders.card.markCompleted')}
              </Button>
            )}

            {canCancel && (
              <Button
                onClick={onCancel}
                variant="secondary"
              >
                {t('orders.card.cancelOrder')}
              </Button>
            )}

            {order.status === 'COMPLETED' && (
              <Link
                to={`/orders/${order._id}/review`}
                className="btn-primary"
              >
                {t('orders.card.leaveReview')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </OrderErrorBoundary>
  )
}

export default Orders