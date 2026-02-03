import React from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { Button, Modal } from '../UI'
import { useAuth } from '../../contexts/AuthProvider'
import { useResilientCart } from '../../hooks/useResilientCart'
import { useAppTranslation, useI18n } from '../../contexts/I18nProvider'
import CartErrorBoundary from './CartErrorBoundary'
import { ShoppingCart } from 'lucide-react';
interface CartProps {
  isOpen: boolean
  onClose: () => void
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { t } = useAppTranslation('buyer')
  const { t: tProducts } = useAppTranslation('products')
  const { language } = useI18n()
  
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
    return await removeFromCart(productId)
  }

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    return await updateQuantity(productId, quantity)
  }

  const handleClearCart = async () => {
    await clearCart()
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onClose()
      navigate('/login')
      return
    }

    if (user?.role !== 'BUYER') {
      alert((tProducts('errors.buyerOnly') as string) || 'Only buyers can checkout')
      return
    }

    onClose()
    navigate('/checkout')
  }

  const handleViewFullCart = () => {
    onClose()
    navigate('/cart')
  }

  const handleRecoverCart = async () => {
    await recoverCart()
  }

  return (
    <CartErrorBoundary userId={user?._id}>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={(t('cart.title') as string) || 'Shopping Cart'}
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          {/* Error display */}
          {lastError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-700">{lastError}</p>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                  aria-label={(t('cart.dismissError') as string) || 'Dismiss error'}
                >
                  ×
                </button>
              </div>
              {hasBackup() && (
                <button
                  onClick={handleRecoverCart}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  {(t('cart.recoverFromBackup') as string) || 'Recover from backup'}
                </button>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-700">{(t('cart.updatingCart') as string) || 'Updating cart...'}</p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className={`text-lg font-medium text-gray-900 mb-2 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('cart.empty.title') as string) || 'Your cart is empty'}
              </h3>
              <p className={`text-gray-600 mb-4 ${language === 'ne' ? 'font-nepali' : ''}`}>
                {(t('cart.empty.description') as string) || 'Add some products to get started!'}
              </p>
              {hasBackup() && (
                <div className="mb-4">
                  <Button
                    onClick={handleRecoverCart}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    {(t('cart.recoverPreviousCart') as string) || 'Recover Previous Cart'}
                  </Button>
                </div>
              )}
              <Link
                to="/products"
                onClick={onClose}
                className="btn-primary inline-block"
              >
                {(t('cart.empty.browseProducts') as string) || 'Browse Products'}
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isLoading={isLoading}
                    language={language}
                    t={t}
                  />
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-lg font-medium text-gray-900 ${language === 'ne' ? 'font-nepali' : ''}`}>
                    {(t('cart.total') as string) || 'Total'} ({totalItems} {(t('cart.items') as string) || 'items'}):
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    ${totalAmount.toFixed(2)}
                  </span>
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
                    {(t('cart.proceedToCheckout') as string) || 'Proceed to Checkout'}
                  </Button>
                  <Button
                    onClick={handleViewFullCart}
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                  >
                    {(t('cart.viewFullCart') as string) || 'View Full Cart'}
                  </Button>
                  <div className="flex space-x-3">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      size="md"
                      fullWidth
                      disabled={isLoading}
                    >
                      {(t('cart.continueShopping') as string) || 'Continue Shopping'}
                    </Button>
                    <Button
                      onClick={handleClearCart}
                      variant="secondary"
                      size="md"
                      fullWidth
                      disabled={isLoading}
                    >
                      {(t('cart.clearCart') as string) || 'Clear Cart'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </CartErrorBoundary>
  )
}

// Cart Item Component
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
  onUpdateQuantity: (productId: string, quantity: number) => Promise<boolean>
  onRemove: (productId: string) => Promise<boolean>
  isLoading: boolean
  language: string
  t: (key: string, options?: any) => string
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, isLoading, language, t }) => {
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
    <div className={`flex items-center space-x-4 p-4 bg-gray-50 rounded-lg ${isLoading ? 'opacity-60' : ''}`}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.image || '/placeholder-product.jpg'}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyMEgzNlYzMkgyNFYyMFoiIGZpbGw9IiM5QjlCQTAiLz4KPHBhdGggZD0iTTI4IDI4SDMyVjM2SDI4VjI4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium text-gray-900 truncate ${language === 'ne' ? 'font-nepali' : ''}`}>
          {item.name}
        </h4>
        <p className="text-sm text-gray-600">
          ${item.price}/{item.unit}
        </p>
        <p className={`text-xs text-gray-500 ${language === 'ne' ? 'font-nepali' : ''}`}>
          {(t('cart.byFarmer', { farmerId: item.farmerId.slice(-6) }) as string) || `by Farmer #${item.farmerId.slice(-6)}`}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1 || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={(t('cart.decreaseQuantity') as string) || 'Decrease quantity'}
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= maxQuantity || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={(t('cart.increaseQuantity') as string) || 'Increase quantity'}
        >
          +
        </button>
      </div>

      {/* Price and Remove */}
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={handleRemove}
          disabled={isLoading}
          className={`text-xs text-red-600 hover:text-red-800 mt-1 disabled:opacity-50 disabled:cursor-not-allowed ${language === 'ne' ? 'font-nepali' : ''}`}
        >
          {(t('cart.remove') as string) || 'Remove'}
        </button>
      </div>
    </div>
  )
}

export default Cart