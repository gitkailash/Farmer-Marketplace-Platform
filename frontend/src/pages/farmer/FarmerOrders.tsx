import React, { useState, useEffect, useCallback } from 'react'
import { 
  LoadingSpinner, 
  ErrorDisplay, 
  EmptyState, 
  Button, 
  Modal,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  InputField
} from '../../components/UI'
import { useToastContext } from '../../contexts/ToastProvider'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { getLocalizedText } from '../../utils/multilingual'
import { notificationAwareOrderService } from '../../services/notificationIntegration'
import { Order } from '../../types/api'
import { processOrderItem, getShortProductId } from '../../utils/orderUtils'

const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
}

const ORDER_STATUS_ICONS = {
  PENDING: '⏳',
  ACCEPTED: '✅',
  COMPLETED: '🎉',
  CANCELLED: '❌'
}

interface OrderFilters {
  status: Order['status'] | 'ALL'
  dateRange: 'all' | 'today' | 'week' | 'month'
  searchQuery: string
}

const FarmerOrders: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastContext()
  const { t, language } = useAppTranslation('farmer')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Enhanced filtering state
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'ALL',
    dateRange: 'all',
    searchQuery: ''
  })
  
  // Notification state
  const [notifications, setNotifications] = useState<{
    newOrders: number
    urgentOrders: number
  }>({ newOrders: 0, urgentOrders: 0 })

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await notificationAwareOrderService.getMyOrders()
      
      if (response.success && response.data) {
        // Sort orders by creation date (newest first)
        const sortedOrders = response.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setOrders(sortedOrders)
        
        // Calculate notifications
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        
        const newOrders = sortedOrders.filter(order => 
          order.status === 'PENDING' && new Date(order.createdAt) > oneDayAgo
        ).length
        
        const urgentOrders = sortedOrders.filter(order => 
          order.status === 'PENDING' && new Date(order.createdAt) < threeDaysAgo
        ).length
        
        setNotifications({ newOrders, urgentOrders })
      } else {
        throw new Error(response.message || t('orders.messages.loadFailed'))
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(err instanceof Error ? err.message : t('orders.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    
    // Set up polling for new orders every 2 minutes (reduced frequency to prevent message handler violations)
    const interval = setInterval(loadOrders, 120000) // Changed from 30000 to 120000 (2 minutes)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const response = await notificationAwareOrderService.acceptOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.messages.acceptSuccess'))
        loadOrders() // Refresh orders
        setShowOrderModal(false)
      } else {
        throw new Error(response.message || t('orders.messages.acceptFailed'))
      }
    } catch (err) {
      console.error('Failed to accept order:', err)
      showError(err instanceof Error ? err.message : t('orders.messages.acceptFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      const response = await notificationAwareOrderService.completeOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.messages.completeSuccess'))
        loadOrders() // Refresh orders
        setShowOrderModal(false)
      } else {
        throw new Error(response.message || t('orders.messages.completeFailed'))
      }
    } catch (err) {
      console.error('Failed to complete order:', err)
      showError(err instanceof Error ? err.message : t('orders.messages.completeFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t('orders.messages.cancelConfirm'))) {
      return
    }

    try {
      setActionLoading(orderId)
      const response = await notificationAwareOrderService.cancelOrder(orderId)
      
      if (response.success) {
        showSuccess(t('orders.messages.cancelSuccess'))
        loadOrders() // Refresh orders
        setShowOrderModal(false)
      } else {
        throw new Error(response.message || t('orders.messages.cancelFailed'))
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      showError(err instanceof Error ? err.message : t('orders.messages.cancelFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  // Enhanced filtering logic
  const getFilteredOrders = () => {
    let filtered = orders

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      filtered = filtered.filter(order => new Date(order.createdAt) >= cutoffDate)
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(query) ||
        order.buyerId.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query) ||
        order.items.some(item => {
          // Handle both string productId and populated product objects
          if (typeof item.productId === 'string') {
            return item.productId.toLowerCase().includes(query)
          } else if (item.productId && typeof item.productId === 'object') {
            const productObj = item.productId as any
            const localizedName = getLocalizedText(productObj.name, language)
            return (localizedName && localizedName.toLowerCase().includes(query)) ||
                   (productObj._id && productObj._id.toLowerCase().includes(query))
          } else if (item.product) {
            const localizedName = getLocalizedText(item.product.name, language)
            return (localizedName && localizedName.toLowerCase().includes(query)) ||
                   (item.product._id && item.product._id.toLowerCase().includes(query))
          }
          return false
        })
      )
    }

    return filtered
  }

  const filteredOrders = getFilteredOrders()

  // Get order counts by status for the current filtered set
  const getOrderCounts = () => {
    const baseFiltered = orders.filter(order => {
      // Apply date and search filters but not status filter
      let matches = true

      if (filters.dateRange !== 'all') {
        const now = new Date()
        let cutoffDate: Date

        switch (filters.dateRange) {
          case 'today':
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          default:
            cutoffDate = new Date(0)
        }

        matches = matches && new Date(order.createdAt) >= cutoffDate
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        matches = matches && (
          order._id.toLowerCase().includes(query) ||
          order.buyerId.toLowerCase().includes(query) ||
          order.deliveryAddress.toLowerCase().includes(query) ||
          order.items.some(item => {
            // Handle both string productId and populated product objects
            if (typeof item.productId === 'string') {
              return item.productId.toLowerCase().includes(query)
            } else if (item.productId && typeof item.productId === 'object') {
              const productObj = item.productId as any
              const localizedName = getLocalizedText(productObj.name, language)
              return (localizedName && localizedName.toLowerCase().includes(query)) ||
                     (productObj._id && productObj._id.toLowerCase().includes(query))
            } else if (item.product) {
              const localizedName = getLocalizedText(item.product.name, language)
              return (localizedName && localizedName.toLowerCase().includes(query)) ||
                     (item.product._id && item.product._id.toLowerCase().includes(query))
            }
            return false
          })
        )
      }

      return matches
    })

    return {
      ALL: baseFiltered.length,
      PENDING: baseFiltered.filter(o => o.status === 'PENDING').length,
      ACCEPTED: baseFiltered.filter(o => o.status === 'ACCEPTED').length,
      COMPLETED: baseFiltered.filter(o => o.status === 'COMPLETED').length,
      CANCELLED: baseFiltered.filter(o => o.status === 'CANCELLED').length,
    }
  }

  const orderCounts = getOrderCounts()

  // Update filter function
  const updateFilter = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.management.title')}</h1>
          <p className="text-gray-600">{t('orders.management.subtitle')}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.management.title')}</h1>
          <p className="text-gray-600">{t('orders.management.subtitle')}</p>
        </div>
        
        {/* Notification Badges */}
        <div className="flex gap-3">
          {notifications.newOrders > 0 && (
            <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-lg">🔔</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t('orders.notifications.newOrders', { count: notifications.newOrders })}
                  </p>
                  <p className="text-xs text-blue-700">{t('orders.notifications.newOrdersDesc')}</p>
                </div>
              </div>
            </div>
          )}
          
          {notifications.urgentOrders > 0 && (
            <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {t('orders.notifications.urgentOrders', { count: notifications.urgentOrders })}
                  </p>
                  <p className="text-xs text-red-700">{t('orders.notifications.urgentOrdersDesc')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <InputField
              name="search"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder={t('orders.filters.searchPlaceholder')}
              icon="🔍"
            />
          </div>
          
          {/* Status and Date Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('orders.filters.statusFilter')}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateFilter('status', status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      filters.status === status
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status !== 'ALL' && <span>{ORDER_STATUS_ICONS[status]}</span>}
                    {status === 'ALL' ? t('orders.filters.all', 'All') : t(`orders.status.${status.toLowerCase()}`, status)} ({orderCounts[status]})
                  </button>
                ))}
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('orders.filters.dateRange', 'Date Range')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t('orders.filters.allTime', 'All Time') },
                  { value: 'today', label: t('orders.filters.today', 'Today') },
                  { value: 'week', label: t('orders.filters.thisWeek', 'This Week') },
                  { value: 'month', label: t('orders.filters.thisMonth', 'This Month') }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => updateFilter('dateRange', range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.dateRange === range.value
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorDisplay 
          message={error}
          onRetry={loadOrders}
        />
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 && !loading ? (
        <EmptyState
          icon="📦"
          title={filters.status === 'ALL' && filters.dateRange === 'all' && !filters.searchQuery ? t('orders.empty.title', 'No orders yet') : t('orders.empty.filtered', 'No orders found')}
          description={
            filters.status === 'ALL' && filters.dateRange === 'all' && !filters.searchQuery
              ? t('orders.empty.description', 'Orders from buyers will appear here. Make sure your products are published and visible to attract customers.')
              : t('orders.empty.filteredDesc', 'No orders match your current filters. Try adjusting your search criteria or date range.')
          }
          actionLabel={filters.status !== 'ALL' || filters.dateRange !== 'all' || filters.searchQuery ? t('orders.filters.clearFilters', 'Clear Filters') : t('orders.empty.manageProducts', 'Manage Products')}
          onAction={() => {
            if (filters.status !== 'ALL' || filters.dateRange !== 'all' || filters.searchQuery) {
              setFilters({ status: 'ALL', dateRange: 'all', searchQuery: '' })
            } else {
              window.location.href = '/farmer/products'
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Order Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('orders.stats.totalOrders', 'Total Orders')}</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('orders.stats.totalRevenue', 'Total Revenue')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('orders.stats.pendingOrders', 'Pending Orders')}</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredOrders.filter(o => o.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('orders.stats.completed', 'Completed')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredOrders.filter(o => o.status === 'COMPLETED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Orders List */}
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onViewDetails={() => openOrderDetails(order)}
              onAccept={() => handleAcceptOrder(order._id)}
              onComplete={() => handleCompleteOrder(order._id)}
              onCancel={() => handleCancelOrder(order._id)}
              isLoading={actionLoading === order._id}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedOrder(null)
          }}
          onAccept={() => handleAcceptOrder(selectedOrder._id)}
          onComplete={() => handleCompleteOrder(selectedOrder._id)}
          onCancel={() => handleCancelOrder(selectedOrder._id)}
          isLoading={actionLoading === selectedOrder._id}
        />
      )}
    </div>
  )
}

// Order Card Component
interface OrderCardProps {
  order: Order
  onViewDetails: () => void
  onAccept: () => void
  onComplete: () => void
  onCancel: () => void
  isLoading: boolean
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onViewDetails,
  onAccept, 
  onComplete, 
  onCancel,
  isLoading
}) => {
  const { t } = useAppTranslation('farmer')
  const canAccept = order.status === 'PENDING'
  const canComplete = order.status === 'ACCEPTED'
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED'
  
  // Calculate order age for urgency indication
  const orderAge = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const isUrgent = order.status === 'PENDING' && orderAge >= 3
  const isNew = order.status === 'PENDING' && orderAge === 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
      isUrgent ? 'border-red-300 ring-2 ring-red-100' : 
      isNew ? 'border-blue-300 ring-2 ring-blue-100' : 
      'border-gray-200'
    }`}>
      <div className="p-6">
        {/* Order Header with Priority Indicators */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {t('orders.card.orderNumber', { number: typeof order._id === 'string' ? order._id.slice(-8).toUpperCase() : String(order._id).slice(-8).toUpperCase() })}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_ICONS[order.status]} {t(`orders.status.${order.status.toLowerCase()}`, order.status)}
              </span>
              
              {/* Priority Badges */}
              {isNew && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {t('orders.card.new', '🆕 New')}
                </span>
              )}
              {isUrgent && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {t('orders.card.urgent', { days: orderAge })}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('orders.card.placed', 'Placed:')} </span>{new Date(order.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">{t('orders.card.items', 'Items:')} </span>{order.items.length}
              </div>
              <div>
                <span className="font-medium">{t('orders.card.buyerName')} </span>{order.buyer?.profile.name}
              </div>
              <div>
                <span className="font-medium">{t('orders.card.orderAge')} </span>{orderAge === 0 ? t('orders.card.today') : t('orders.card.days', { count: orderAge })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              ${order.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Enhanced Order Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">{t('orders.card.deliveryAddress', 'Delivery Address:')}</span>
              <p className="text-gray-600 mt-1 line-clamp-3">{order.deliveryAddress}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t('orders.card.orderItems', 'Order Items:')}</span>
              <div className="text-gray-600 mt-1">
                {order.items.slice(0, 3).map((item, index) => {
                  // Use the enhanced processing function to safely extract product info
                  const processedItem = processOrderItem ? processOrderItem(item) : {
                    productName: item.product?.name || `Product #${getShortProductId(item.productId)}`,
                    quantity: item.quantity,
                    priceAtTime: item.priceAtTime
                  }
                  
                  // Ensure productName is always a string
                  const productName = typeof processedItem.productName === 'string' 
                    ? processedItem.productName 
                    : getLocalizedText(processedItem.productName, 'en') || `Product #${getShortProductId(item.productId)}`
                  
                  return (
                    <div key={index} className="flex justify-between">
                      <span>{productName}</span>
                      <span>×{processedItem.quantity} @ ${processedItem.priceAtTime}</span>
                    </div>
                  )
                })}
                {order.items.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('orders.card.moreItems', { count: order.items.length - 3 })}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Special Notes */}
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="font-medium text-gray-700">{t('orders.card.specialInstructions', 'Special Instructions:')}</span>
              <p className="text-gray-600 mt-1 text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
          >
            {t('orders.card.viewDetails', 'View Details')}
          </Button>

          {canAccept && (
            <PrimaryButton
              onClick={onAccept}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? t('orders.card.accepting', 'Accepting...') : t('orders.card.acceptOrder', 'Accept Order')}
            </PrimaryButton>
          )}

          {canComplete && (
            <PrimaryButton
              onClick={onComplete}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? t('orders.card.completing', 'Completing...') : t('orders.card.markCompleted', 'Mark Completed')}
            </PrimaryButton>
          )}

          {canCancel && (
            <DangerButton
              onClick={onCancel}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? t('orders.card.cancelling', 'Cancelling...') : t('orders.card.cancelOrder', 'Cancel Order')}
            </DangerButton>
          )}
        </div>
      </div>
    </div>
  )
}

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  onComplete: () => void
  onCancel: () => void
  isLoading: boolean
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onAccept,
  onComplete,
  onCancel,
  isLoading
}) => {
  const { t } = useAppTranslation('farmer')
  const canAccept = order.status === 'PENDING'
  const canComplete = order.status === 'ACCEPTED'
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('orders.card.orderNumber', { number: typeof order._id === 'string' ? order._id.slice(-8).toUpperCase() : String(order._id).slice(-8).toUpperCase() })}
      size="lg"
    >
      <div className="space-y-6">
        {/* Order Status and Basic Info */}
        <div className="flex items-center justify-between">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
               {t(`orders.status.${order.status.toLowerCase()}`, order.status)}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              {t('orders.modal.placedOn', { 
                date: new Date(order.createdAt).toLocaleDateString(), 
                time: new Date(order.createdAt).toLocaleTimeString() 
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              ${order.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">{t('orders.modal.buyerInformation', 'Buyer Information')}</h3>
          <div className="text-sm text-gray-600">
            <p className="text-sm text-gray-600">{t('orders.card.buyerName')} {order.buyer?.profile.name}</p>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">{t('orders.modal.orderItems', 'Order Items')}</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const processedItem = processOrderItem(item)
              return (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {processedItem.productName}
                      {processedItem.hasError && (
                        <span className="ml-2 text-xs text-amber-600">
                          {t('orders.modal.productError', { message: processedItem.errorMessage })}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${processedItem.priceAtTime.toFixed(2)} {processedItem.unit ? t('orders.modal.perUnit', { unit: processedItem.unit }) : 'per unit'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {t('orders.modal.quantity', { quantity: processedItem.quantity })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('orders.modal.subtotal', { amount: (processedItem.priceAtTime * processedItem.quantity).toFixed(2) })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Delivery Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{t('orders.modal.deliveryInformation', 'Delivery Information')}</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-line">{order.deliveryAddress}</p>
          </div>
        </div>

        {/* Special Instructions */}
        {order.notes && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('orders.modal.specialInstructions', 'Special Instructions')}</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <SecondaryButton onClick={onClose}>
            {t('orders.modal.close', 'Close')}
          </SecondaryButton>

          {canAccept && (
            <PrimaryButton
              onClick={onAccept}
              disabled={isLoading}
            >
              {isLoading ? t('orders.card.accepting', 'Accepting...') : t('orders.modal.acceptOrder', 'Accept Order')}
            </PrimaryButton>
          )}

          {canComplete && (
            <PrimaryButton
              onClick={onComplete}
              disabled={isLoading}
            >
              {isLoading ? t('orders.card.completing', 'Completing...') : t('orders.modal.markAsCompleted', 'Mark as Completed')}
            </PrimaryButton>
          )}

          {canCancel && (
            <DangerButton
              onClick={onCancel}
              disabled={isLoading}
            >
              {isLoading ? t('orders.card.cancelling', 'Cancelling...') : t('orders.modal.cancelOrder', 'Cancel Order')}
            </DangerButton>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default FarmerOrders