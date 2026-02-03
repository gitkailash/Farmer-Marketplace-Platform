import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { cartErrorHandler, errorLogger } from '../../utils/errorHandling'

export interface CartItem {
  productId: string
  name: string
  price: number
  unit: string
  quantity: number
  stock: number
  image?: string
  farmerId: string
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  isOpen: boolean
  lastError: string | null
  isLoading: boolean
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isOpen: false,
  lastError: null,
  isLoading: false
}

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return { totalItems, totalAmount }
}

// Helper function to load cart from localStorage with error handling
const loadCartFromStorage = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('cart')
    if (!savedCart) return []
    
    const parsed = JSON.parse(savedCart)
    
    // Validate cart structure
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid cart format: not an array')
    }
    
    // Validate each item
    const validItems = parsed.filter(item => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.productId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      )
    })
    
    return validItems
  } catch (error) {
    errorLogger.logError(
      error as Error,
      {
        component: 'CartSlice',
        operation: 'loadCartFromStorage'
      },
      'low'
    )
    
    // Try to restore from backup
    const backup = cartErrorHandler.restoreCartState()
    return backup || []
  }
}

// Helper function to save cart to localStorage with error handling
const saveCartToStorage = (items: CartItem[]) => {
  try {
    // Preserve current state before saving
    cartErrorHandler.preserveCartState(items)
    
    localStorage.setItem('cart', JSON.stringify(items))
  } catch (error) {
    errorLogger.logError(
      error as Error,
      {
        component: 'CartSlice',
        operation: 'saveCartToStorage'
      },
      'medium'
    )
    
    // Don't throw - cart should continue working even if localStorage fails
  }
}

// Initialize state with data from localStorage
const initializeState = (): CartState => {
  const items = loadCartFromStorage()
  const { totalItems, totalAmount } = calculateTotals(items)
  return {
    items,
    totalItems,
    totalAmount,
    isOpen: false,
    lastError: null,
    isLoading: false
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: initializeState(),
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload
    },

    clearError: (state) => {
      state.lastError = null
    },

    addToCart: (state, action: PayloadAction<CartItem>) => {
      try {
        const newItem = action.payload
        
        // Validate input
        if (!newItem.productId || !newItem.name || newItem.price <= 0 || newItem.quantity <= 0) {
          throw new Error('Invalid item data')
        }
        
        const existingItem = state.items.find(item => item.productId === newItem.productId)

        if (existingItem) {
          // Update quantity if item already exists
          const newQuantity = Math.min(existingItem.quantity + newItem.quantity, newItem.stock)
          existingItem.quantity = newQuantity
        } else {
          // Add new item to cart
          state.items.push({
            ...newItem,
            quantity: Math.min(newItem.quantity, newItem.stock)
          })
        }

        // Recalculate totals
        const { totalItems, totalAmount } = calculateTotals(state.items)
        state.totalItems = totalItems
        state.totalAmount = totalAmount

        // Save to localStorage
        saveCartToStorage(state.items)
        
        // Clear any previous errors
        state.lastError = null
      } catch (error) {
        state.lastError = 'Failed to add item to cart'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'addToCart'
          },
          'medium'
        )
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      try {
        const productId = action.payload
        
        if (!productId) {
          throw new Error('Invalid product ID')
        }
        
        state.items = state.items.filter(item => item.productId !== productId)

        // Recalculate totals
        const { totalItems, totalAmount } = calculateTotals(state.items)
        state.totalItems = totalItems
        state.totalAmount = totalAmount

        // Save to localStorage
        saveCartToStorage(state.items)
        
        // Clear any previous errors
        state.lastError = null
      } catch (error) {
        state.lastError = 'Failed to remove item from cart'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'removeFromCart'
          },
          'medium'
        )
      }
    },

    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      try {
        const { productId, quantity } = action.payload
        
        if (!productId || quantity < 0) {
          throw new Error('Invalid update parameters')
        }
        
        const item = state.items.find(item => item.productId === productId)

        if (item) {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            state.items = state.items.filter(item => item.productId !== productId)
          } else {
            // Update quantity (ensure it doesn't exceed stock)
            item.quantity = Math.min(quantity, item.stock)
          }

          // Recalculate totals
          const { totalItems, totalAmount } = calculateTotals(state.items)
          state.totalItems = totalItems
          state.totalAmount = totalAmount

          // Save to localStorage
          saveCartToStorage(state.items)
          
          // Clear any previous errors
          state.lastError = null
        }
      } catch (error) {
        state.lastError = 'Failed to update item quantity'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'updateQuantity'
          },
          'medium'
        )
      }
    },

    clearCart: (state) => {
      try {
        // Preserve current state before clearing
        cartErrorHandler.preserveCartState(state.items)
        
        state.items = []
        state.totalItems = 0
        state.totalAmount = 0

        // Clear localStorage
        localStorage.removeItem('cart')
        
        // Clear any previous errors
        state.lastError = null
      } catch (error) {
        state.lastError = 'Failed to clear cart'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'clearCart'
          },
          'medium'
        )
      }
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },

    openCart: (state) => {
      state.isOpen = true
    },

    closeCart: (state) => {
      state.isOpen = false
    },

    // Update stock levels when products change (e.g., after other users purchase)
    updateStock: (state, action: PayloadAction<{ productId: string; newStock: number }>) => {
      try {
        const { productId, newStock } = action.payload
        
        if (!productId || newStock < 0) {
          throw new Error('Invalid stock update parameters')
        }
        
        const item = state.items.find(item => item.productId === productId)

        if (item) {
          item.stock = newStock
          // Adjust quantity if it exceeds new stock
          if (item.quantity > newStock) {
            item.quantity = Math.max(0, newStock)
          }

          // Remove item if out of stock
          if (newStock === 0) {
            state.items = state.items.filter(item => item.productId !== productId)
          }

          // Recalculate totals
          const { totalItems, totalAmount } = calculateTotals(state.items)
          state.totalItems = totalItems
          state.totalAmount = totalAmount

          // Save to localStorage
          saveCartToStorage(state.items)
          
          // Clear any previous errors
          state.lastError = null
        }
      } catch (error) {
        state.lastError = 'Failed to update stock levels'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'updateStock'
          },
          'medium'
        )
      }
    },

    // Sync cart with latest product data
    syncCartItems: (state, action: PayloadAction<CartItem[]>) => {
      try {
        const updatedItems = action.payload
        
        if (!Array.isArray(updatedItems)) {
          throw new Error('Invalid sync data: not an array')
        }
        
        state.items = updatedItems

        // Recalculate totals
        const { totalItems, totalAmount } = calculateTotals(state.items)
        state.totalItems = totalItems
        state.totalAmount = totalAmount

        // Save to localStorage
        saveCartToStorage(state.items)
        
        // Clear any previous errors
        state.lastError = null
      } catch (error) {
        state.lastError = 'Failed to sync cart items'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'syncCartItems'
          },
          'medium'
        )
      }
    },

    // Recover cart from backup
    recoverCart: (state) => {
      try {
        const restoredItems = cartErrorHandler.restoreCartState()
        
        if (restoredItems && restoredItems.length > 0) {
          state.items = restoredItems
          
          // Recalculate totals
          const { totalItems, totalAmount } = calculateTotals(state.items)
          state.totalItems = totalItems
          state.totalAmount = totalAmount

          // Save to localStorage
          saveCartToStorage(state.items)
          
          state.lastError = null
        } else {
          throw new Error('No backup found')
        }
      } catch (error) {
        state.lastError = 'Failed to recover cart from backup'
        errorLogger.logError(
          error as Error,
          {
            component: 'CartSlice',
            operation: 'recoverCart'
          },
          'medium'
        )
      }
    }
  }
})

export const {
  setLoading,
  setError,
  clearError,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  updateStock,
  syncCartItems,
  recoverCart
} = cartSlice.actions

export default cartSlice.reducer

// Enhanced selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartTotalItems = (state: { cart: CartState }) => state.cart.totalItems
export const selectCartTotalAmount = (state: { cart: CartState }) => state.cart.totalAmount
export const selectCartIsOpen = (state: { cart: CartState }) => state.cart.isOpen
export const selectCartItemCount = (state: { cart: CartState }) => state.cart.items.length
export const selectCartLastError = (state: { cart: CartState }) => state.cart.lastError
export const selectCartIsLoading = (state: { cart: CartState }) => state.cart.isLoading
export const selectCartItemByProductId = (productId: string) => (state: { cart: CartState }) =>
  state.cart.items.find(item => item.productId === productId)
export const selectCartHasItems = (state: { cart: CartState }) => state.cart.items.length > 0