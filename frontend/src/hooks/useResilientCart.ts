import { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '../contexts/AuthProvider'
import { useToastContext } from '../contexts/ToastProvider'
import { 
  selectCartItems, 
  selectCartTotalAmount, 
  selectCartTotalItems,
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
  clearCart as clearCartAction,
  syncCartItems
} from '../store/slices/cartSlice'
import { cartErrorHandler, errorLogger } from '../utils/errorHandling'
import { CartItem } from '../store/slices/cartSlice'

/**
 * Enhanced cart hook with error handling, retry mechanisms, and state preservation
 */
export const useResilientCart = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { error: showError, success: showSuccess } = useToastContext()
  
  const items = useSelector(selectCartItems)
  const totalAmount = useSelector(selectCartTotalAmount)
  const totalItems = useSelector(selectCartTotalItems)
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  /**
   * Enhanced add to cart with error handling and retry
   */
  const addToCart = useCallback(async (item: CartItem) => {
    setIsLoading(true)
    setLastError(null)

    const result = await cartErrorHandler.handleCartOperation(
      () => {
        dispatch(addToCartAction(item))
        return true
      },
      {
        operationName: 'addToCart',
        userId: user?.id,
        fallbackValue: false,
        maxRetries: 2
      }
    )

    setIsLoading(false)

    if (result.success) {
      showSuccess(`${item.name} added to cart`)
      return true
    } else {
      const errorMessage = result.error?.userMessage || 'Failed to add item to cart'
      setLastError(errorMessage)
      showError(errorMessage)
      return false
    }
  }, [dispatch, user?.id, showError, showSuccess])

  /**
   * Enhanced remove from cart with error handling
   */
  const removeFromCart = useCallback(async (productId: string) => {
    setIsLoading(true)
    setLastError(null)

    // Preserve current state before operation
    cartErrorHandler.preserveCartState(items)

    const result = await cartErrorHandler.handleCartOperation(
      () => {
        dispatch(removeFromCartAction(productId))
        return true
      },
      {
        operationName: 'removeFromCart',
        userId: user?.id,
        fallbackValue: false,
        maxRetries: 2
      }
    )

    setIsLoading(false)

    if (result.success) {
      showSuccess('Item removed from cart')
      return true
    } else {
      const errorMessage = result.error?.userMessage || 'Failed to remove item from cart'
      setLastError(errorMessage)
      showError(errorMessage)
      
      // Try to restore previous state
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems) {
        dispatch(syncCartItems(restoredItems))
      }
      
      return false
    }
  }, [dispatch, user?.id, items, showError, showSuccess])

  /**
   * Enhanced update quantity with error handling
   */
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    setIsLoading(true)
    setLastError(null)

    // Preserve current state before operation
    cartErrorHandler.preserveCartState(items)

    const result = await cartErrorHandler.handleCartOperation(
      () => {
        dispatch(updateQuantityAction({ productId, quantity }))
        return true
      },
      {
        operationName: 'updateQuantity',
        userId: user?.id,
        fallbackValue: false,
        maxRetries: 2
      }
    )

    setIsLoading(false)

    if (result.success) {
      return true
    } else {
      const errorMessage = result.error?.userMessage || 'Failed to update item quantity'
      setLastError(errorMessage)
      showError(errorMessage)
      
      // Try to restore previous state
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems) {
        dispatch(syncCartItems(restoredItems))
      }
      
      return false
    }
  }, [dispatch, user?.id, items, showError])

  /**
   * Enhanced clear cart with confirmation and error handling
   */
  const clearCart = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return false
    }

    setIsLoading(true)
    setLastError(null)

    // Preserve current state before operation
    cartErrorHandler.preserveCartState(items)

    const result = await cartErrorHandler.handleCartOperation(
      () => {
        dispatch(clearCartAction())
        // Set a flag to prevent auto-recovery after manual clear
        localStorage.setItem('cartManuallyCleared', 'true')
        return true
      },
      {
        operationName: 'clearCart',
        userId: user?.id,
        fallbackValue: false,
        maxRetries: 1
      }
    )

    setIsLoading(false)

    if (result.success) {
      showSuccess('Cart cleared')
      return true
    } else {
      const errorMessage = result.error?.userMessage || 'Failed to clear cart'
      setLastError(errorMessage)
      showError(errorMessage)
      
      // Try to restore previous state
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems) {
        dispatch(syncCartItems(restoredItems))
      }
      
      return false
    }
  }, [dispatch, user?.id, items, showError, showSuccess])

  /**
   * Recover cart from backup
   */
  const recoverCart = useCallback(async () => {
    setIsLoading(true)
    setLastError(null)

    try {
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems && restoredItems.length > 0) {
        dispatch(syncCartItems(restoredItems))
        showSuccess(`Recovered ${restoredItems.length} items from backup`)
        return true
      } else {
        showError('No cart backup found')
        return false
      }
    } catch (error) {
      const errorMessage = 'Failed to recover cart from backup'
      setLastError(errorMessage)
      showError(errorMessage)
      
      errorLogger.logError(
        error as Error,
        {
          component: 'Cart',
          operation: 'recoverCart',
          userId: user?.id
        },
        'medium'
      )
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, user?.id, showError, showSuccess])

  /**
   * Validate cart integrity and fix issues
   */
  const validateCart = useCallback(async () => {
    setIsLoading(true)
    setLastError(null)

    try {
      const validatedItems = items.filter(item => {
        // Basic validation
        return (
          item.productId &&
          item.name &&
          typeof item.price === 'number' &&
          item.price > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0 &&
          typeof item.stock === 'number' &&
          item.stock >= 0
        )
      })

      // Fix quantity issues
      const fixedItems = validatedItems.map(item => ({
        ...item,
        quantity: Math.min(item.quantity, item.stock, 99) // Cap at stock or 99
      }))

      if (fixedItems.length !== items.length) {
        dispatch(syncCartItems(fixedItems))
        showSuccess(`Cart validated - removed ${items.length - fixedItems.length} invalid items`)
      }

      return true
    } catch (error) {
      const errorMessage = 'Failed to validate cart'
      setLastError(errorMessage)
      showError(errorMessage)
      
      errorLogger.logError(
        error as Error,
        {
          component: 'Cart',
          operation: 'validateCart',
          userId: user?.id
        },
        'medium'
      )
      
      return false
    } finally {
      setIsLoading(false)
    }
  }, [items, dispatch, user?.id, showError, showSuccess])

  /**
   * Auto-recovery on mount if cart is empty but backup exists
   */
  useEffect(() => {
    // Check if cart was manually cleared
    const wasManuallyCleared = localStorage.getItem('cartManuallyCleared')
    
    if (items.length === 0 && !wasManuallyCleared) {
      const restoredItems = cartErrorHandler.restoreCartState()
      if (restoredItems && restoredItems.length > 0) {
        // Auto-recover silently
        dispatch(syncCartItems(restoredItems))
      }
    }
    
    // Clear the manual clear flag after checking
    if (wasManuallyCleared) {
      localStorage.removeItem('cartManuallyCleared')
    }
  }, []) // Only run on mount

  /**
   * Periodic cart validation (every 5 minutes)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (items.length > 0) {
        validateCart()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [items.length, validateCart])

  return {
    // Cart state
    items,
    totalAmount,
    totalItems,
    isLoading,
    lastError,
    
    // Enhanced operations
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Recovery operations
    recoverCart,
    validateCart,
    
    // Utility functions
    clearError: () => setLastError(null),
    hasBackup: () => {
      const backup = cartErrorHandler.restoreCartState()
      return backup && backup.length > 0
    }
  }
}

export default useResilientCart