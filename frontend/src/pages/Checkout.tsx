import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Layout, LoadingSpinner, ErrorDisplay, Button } from '../components/UI'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { useAppTranslation, useI18n } from '../contexts/I18nProvider'
import { orderService, type OrderCreateRequest } from '../services/orderService'
import { selectCartItems, selectCartTotalAmount, clearCart } from '../store/slices/cartSlice'
import { CartItem } from '../store/slices/cartSlice'

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useAuth()
  const { success: showSuccess } = useToastContext()
  const { t } = useAppTranslation('common')
  const { language } = useI18n()
  const cartItems = useSelector(selectCartItems)
  const totalAmount = useSelector(selectCartTotalAmount)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Group cart items by farmer
  const itemsByFarmer = cartItems.reduce((acc, item) => {
    if (!acc[item.farmerId]) {
      acc[item.farmerId] = []
    }
    acc[item.farmerId].push(item)
    return acc
  }, {} as Record<string, CartItem[]>)

  useEffect(() => {
    // Redirect if not authenticated or not a buyer
    if (!isAuthenticated || user?.role !== 'BUYER') {
      navigate('/login')
      return
    }

    // Redirect if cart is empty
    if (cartItems.length === 0) {
      navigate('/products')
      return
    }

    // Pre-fill delivery address from user profile
    if (user?.profile?.address) {
      setDeliveryAddress(user.profile.address)
    }
  }, [isAuthenticated, user, cartItems.length, navigate])

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError((t('checkout.deliveryAddressError') as string) || 'Please provide a delivery address')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create separate orders for each farmer
      const orderPromises = Object.entries(itemsByFarmer).map(([farmerId, items]) => {
        const orderData: OrderCreateRequest = {
          farmerId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          deliveryAddress: deliveryAddress.trim(),
          notes: notes.trim() || undefined
        }

        return orderService.createOrder(orderData)
      })

      const results = await Promise.all(orderPromises)

      // Check if all orders were successful
      const failedOrders = results.filter(result => !result.success)
      if (failedOrders.length > 0) {
        throw new Error((t('checkout.orderFailed', { count: failedOrders.length }) as string) || `Failed to place ${failedOrders.length} order(s). Please try again.`)
      }

      // Clear cart and show success message
      dispatch(clearCart())
      showSuccess((t('checkout.orderSuccess') as string) || 'Orders placed successfully! Farmers will be notified.')
      
      // Navigate to orders page
      navigate('/orders')

    } catch (err) {
      console.error('Failed to place order:', err)
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'BUYER') {
    return null // Will redirect in useEffect
  }

  if (cartItems.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {(t('common.checkout.title') as string) || 'Checkout'}
          </h1>
          <p className={`text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
            {(t('common.checkout.subtitle') as string) || 'Review your order and provide delivery details'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className={`text-xl font-semibold text-gray-900 mb-4 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('common.checkout.deliveryInformation') as string) || 'Delivery Information'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="deliveryAddress" className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('common.checkout.deliveryAddressRequired') as string) || 'Delivery Address *'}
                  </label>
                  <textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={(t('common.checkout.deliveryAddressPlaceholder') as string) || 'Enter your complete delivery address...'}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${language === 'ne' ? 'font-nepali' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('common.checkout.specialInstructions') as string) || 'Special Instructions (Optional)'}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={(t('common.checkout.specialInstructionsPlaceholder') as string) || 'Any special delivery instructions or notes for the farmer...'}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${language === 'ne' ? 'font-nepali' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Orders by Farmer */}
            <div className="space-y-4">
              <h2 className={`text-xl font-semibold text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('common.checkout.orderDetails') as string) || 'Order Details'}
              </h2>
              
              {Object.entries(itemsByFarmer).map(([farmerId, items]) => {
                const farmerTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                
                return (
                  <div key={farmerId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                        {(t('common.checkout.farmerOrder', { farmerId: farmerId.slice(-8) }) as string) || `Farmer #${farmerId.slice(-8)}`}
                      </h3>
                      <span className="text-lg font-semibold text-primary-600">
                        Rs{farmerTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <h4 className={`font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                Rs{item.price}/{item.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {item.quantity} {item.unit}
                            </p>
                            <p className="text-sm text-gray-600">
                              Rs{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Error Display */}
            {error && (
              <ErrorDisplay 
                message={error}
                onRetry={() => setError(null)}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className={`text-xl font-semibold text-gray-900 mb-4 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('common.checkout.orderSummary') as string) || 'Order Summary'}
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className={`text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('common.cart.items') as string) || 'Items'} ({cartItems.length})
                  </span>
                  <span className="text-gray-900">Rs{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`text-gray-600 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('common.cart.delivery') as string) || 'Delivery'}
                  </span>
                  <span className={`text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('common.cart.free') as string) || 'Free'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={`text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                      {(t('common.cart.total') as string) || 'Total'}
                    </span>
                    <span className="text-primary-600">Rs{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePlaceOrder}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={loading || !deliveryAddress.trim()}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {(t('common.checkout.placingOrder') as string) || 'Placing Order...'}
                    </>
                  ) : (
                    (t('common.checkout.placeOrder') as string) || 'Place Order'
                  )}
                </Button>
                
                <Button
                  onClick={() => navigate('/products')}
                  variant="outline"
                  size="lg"
                  fullWidth
                >
                  {(t('common.checkout.continueShopping') as string) || 'Continue Shopping'}
                </Button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p className={`mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {(t('common.checkout.notes.ordersToFarmers') as string) || '📦 Orders will be sent to individual farmers for acceptance'}
                </p>
                <p className={`mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
                  {(t('common.checkout.notes.deliveryArrangements') as string) || '🚚 Delivery arrangements will be made directly with farmers'}
                </p>
                <p className={`${language === 'ne' ? 'font-nepali' : ''}`}>
                  {(t('common.checkout.notes.messageFarmers') as string) || '💬 You can message farmers about your orders after placement'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Checkout