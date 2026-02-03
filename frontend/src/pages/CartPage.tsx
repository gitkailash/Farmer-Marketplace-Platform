import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Layout } from '../components/UI'
import { useAuth } from '../contexts/AuthProvider'
import { useAppTranslation } from '../contexts/I18nProvider'
import { useResilientCart } from '../hooks/useResilientCart'
import CartErrorBoundary from '../components/Cart/CartErrorBoundary'
import { ShoppingCart } from 'lucide-react';

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { t } = useAppTranslation('buyer')
  
  // Use resilient cart operations
  const {
    items,
    totalAmount,
    totalItems,
    isLoading,
    lastError,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearError,
    hasBackup,
    recoverCart
  } = useResilientCart()

  const handleRemoveItem = async (productId: string) => {
    await removeFromCart(productId)
  }

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    await updateQuantity(productId, quantity)
  }

  const handleClearCart = async () => {
    await clearCart()
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'BUYER') {
      alert(t('cart.messages.onlyBuyersCheckout'))
      return
    }

    navigate('/checkout')
  }

  const handleRecoverCart = async () => {
    await recoverCart()
  }

  return (
    <CartErrorBoundary userId={user?._id}>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('cart.title')}
            </h1>
            <p className="text-gray-600">
              {t('cart.subtitle')}
            </p>
          </div>

          {/* Error display */}
          {lastError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-sm text-red-700">{lastError}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
              {hasBackup() && (
                <div className="mt-3">
                  <Button
                    onClick={handleRecoverCart}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    {t('cart.messages.recoverFromBackup')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-700">{t('cart.messages.updatingCart')}</p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-6">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">
                {t('cart.empty.title')}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {t('cart.empty.description')}
              </p>
              
              {/* Recovery option */}
              {hasBackup() && (
                <div className="mb-6">
                  <Button
                    onClick={handleRecoverCart}
                    variant="outline"
                    size="md"
                    disabled={isLoading}
                  >
                    {t('cart.empty.recoverPrevious')}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('cart.empty.recoverDescription')}
                  </p>
                </div>
              )}
              
              <Link
                to="/products"
                className="inline-block"
              >
                <Button variant="primary" size="lg">
                  {t('cart.empty.browseProducts')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      {t('cart.page.cartItems', { count: totalItems })}
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <CartItem
                        key={item.productId}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      {t('cart.page.orderSummary')}
                    </h2>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('cart.page.subtotal', { count: totalItems })}</span>
                        <span className="text-gray-900">${totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('cart.page.shipping')}</span>
                        <span className="text-gray-900">{t('cart.page.shippingCalculated')}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-medium text-gray-900">{t('cart.page.total')}</span>
                          <span className="text-xl font-bold text-primary-600">
                            ${totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleCheckout}
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={isLoading}
                      >
                        {t('cart.page.proceedToCheckout')}
                      </Button>
                      
                      <div className="flex space-x-3">
                        <Link to="/products" className="flex-1">
                          <Button
                            variant="outline"
                            size="md"
                            fullWidth
                            disabled={isLoading}
                          >
                            {t('cart.page.continueShopping')}
                          </Button>
                        </Link>
                        <Button
                          onClick={handleClearCart}
                          variant="secondary"
                          size="md"
                          className="flex-shrink-0"
                          disabled={isLoading}
                        >
                          {t('cart.page.clearCart')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </CartErrorBoundary>
  )
}

// Cart Item Component - Enhanced with error handling
interface CartItemProps {
  item: {
    productId: string
    name: string
    price: number
    unit: string
    quantity: number
    stock: number
    image?: string
    farmerId: string
  }
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>
  onRemove: (productId: string) => Promise<void>
  isLoading: boolean
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, isLoading }) => {
  const { t } = useAppTranslation('buyer')
  const maxQuantity = Math.min(item.stock, 99)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity || isLoading) return
    await onUpdateQuantity(item.productId, newQuantity)
  }

  const handleRemove = async () => {
    if (isLoading) return
    await onRemove(item.productId)
  }

  return (
    <div className={`p-6 ${isLoading ? 'opacity-60' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={item.image || '/placeholder-product.jpg'}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAyNEg1MFY0NEgzMFYyNFoiIGZpbGw9IiM5QjlCQTAiLz4KPHBhdGggZD0iTTM0IDM0SDQ2VjUwSDM0VjM0WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                ${item.price}/{item.unit}
              </p>
              <p className="text-xs text-gray-500">
                {t('cart.item.byFarmer', { farmerId: item.farmerId.slice(-6) })}
              </p>
            </div>
            
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('cart.item.removeFromCart', { name: item.name })}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Quantity Controls and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{t('cart.item.quantity')}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1 || isLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('cart.item.decreaseQuantity')}
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-medium bg-gray-50 py-1 px-2 rounded border">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= maxQuantity || isLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('cart.item.increaseQuantity')}
                >
                  +
                </button>
              </div>
              {item.quantity >= maxQuantity && (
                <span className="text-xs text-orange-600">{t('cart.item.maxStockReached')}</span>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {t('cart.item.stock', { count: item.stock })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage