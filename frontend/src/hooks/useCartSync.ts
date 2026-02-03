import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, syncCartItems } from '../store/slices/cartSlice'

/**
 * Custom hook to ensure cart state synchronization across all access points
 * This hook handles:
 * - localStorage synchronization
 * - Cross-tab synchronization
 * - Cart state consistency between modal and page views
 */
export const useCartSync = () => {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        try {
          const updatedCart = JSON.parse(e.newValue)
          dispatch(syncCartItems(updatedCart))
        } catch (error) {
          console.error('Failed to sync cart from storage:', error)
        }
      }
    }

    // Add event listener for cross-tab synchronization
    window.addEventListener('storage', handleStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [dispatch])

  // Sync cart with localStorage on mount (in case of page refresh)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        // Only sync if the saved cart is different from current state
        if (JSON.stringify(parsedCart) !== JSON.stringify(cartItems)) {
          dispatch(syncCartItems(parsedCart))
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    }
  }, []) // Only run on mount

  return {
    cartItems,
    isCartSynced: true // Could be extended to track sync status
  }
}

export default useCartSync