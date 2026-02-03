import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useAppTranslation } from '../../contexts/I18nProvider'
import { selectCartTotalItems, selectCartTotalAmount, toggleCart } from '../../store/slices/cartSlice'
import { ShoppingCart } from 'lucide-react';

interface CartButtonProps {
  variant?: 'icon' | 'text' | 'full'
  showDropdown?: boolean
  className?: string
}

const CartButton: React.FC<CartButtonProps> = ({ 
  variant = 'icon', 
  showDropdown = true,
  className = '' 
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useAppTranslation('buyer')
  const totalItems = useSelector(selectCartTotalItems)
  const totalAmount = useSelector(selectCartTotalAmount)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCartClick = () => {
    if (showDropdown && totalItems > 0) {
      setIsDropdownOpen(!isDropdownOpen)
    } else {
      // On mobile or when no items, go directly to cart page
      navigate('/cart')
    }
  }

  const handleViewCart = () => {
    setIsDropdownOpen(false)
    navigate('/cart')
  }

  const handleQuickView = () => {
    setIsDropdownOpen(false)
    dispatch(toggleCart())
  }

  const renderCartIcon = () => (
    <div className="relative">
      <span className="text-2xl">
        <ShoppingCart className="h-6 w-6" />
      </span>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </div>
  )

  const baseClasses = "relative transition-colors duration-200"
  const variantClasses = {
    icon: "p-2 text-gray-600 hover:text-gray-900",
    text: "flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50",
    full: "flex items-center space-x-3 px-4 py-4 rounded-xl text-lg font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 w-full"
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleCartClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        aria-label={`${t('cart.button.cart', 'Cart')} - ${t('cart.button.items', { count: totalItems })}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {variant === 'icon' ? (
          renderCartIcon()
        ) : (
          <>
            {renderCartIcon()}
            <span>{t('cart.button.cart', 'Cart')}</span>
            {variant === 'full' && totalItems > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                ${totalAmount.toFixed(2)}
              </span>
            )}
          </>
        )}
      </button>

      {/* Dropdown Menu for Desktop */}
      {showDropdown && isDropdownOpen && totalItems > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden md:block">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">{t('cart.button.cartSummary')}</h3>
              <span className="text-sm text-gray-500">{t('cart.button.items', { count: totalItems })}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{t('cart.button.total')}</span>
              <span className="text-lg font-semibold text-primary-600">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleViewCart}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t('cart.button.viewFullCart')}
              </button>
              <button
                onClick={handleQuickView}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {t('cart.button.quickView')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartButton