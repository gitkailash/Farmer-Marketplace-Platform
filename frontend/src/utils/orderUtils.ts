import { OrderItem } from '../types/api'
import { orderErrorHandler, errorLogger } from './errorHandling'
import { getLocalizedText } from './multilingual'

/**
 * Safely extract product ID as string from various formats
 */
export const getProductIdString = (productId: any): string => {
  if (typeof productId === 'string') {
    return productId;
  }
  if (productId && typeof productId === 'object') {
    return productId._id || productId.id || String(productId);
  }
  return String(productId || 'unknown');
};

/**
 * Get a short display version of product ID (last 8 characters)
 */
export const getShortProductId = (productId: any): string => {
  const fullId = getProductIdString(productId);
  return fullId.slice(-8);
};

/**
 * Processed order item with safe string values for display
 */
export interface ProcessedOrderItem {
  productId: string
  productName: string
  quantity: number
  priceAtTime: number
  unit?: string
  image?: string
  hasError?: boolean
  errorMessage?: string
}

/**
 * Safely processes an order item to handle both string productId and populated product objects
 * Provides fallback handling for malformed or missing data with enhanced error handling
 * Enhanced for backward compatibility with legacy order formats
 * 
 * @param item - The order item to process
 * @param userId - Optional user ID for error logging
 * @returns ProcessedOrderItem with safe display values
 */
export const processOrderItem = (item: OrderItem, userId?: string): ProcessedOrderItem => {
  try {
    // Validate input
    if (!item) {
      throw new Error('Order item is null or undefined')
    }

    // Handle legacy formats where productId might be missing but other fields exist
    if (!item.productId && !item.product) {
      // Check if there's any product information in unexpected places
      const legacyProduct = (item as any).productName || (item as any).name
      if (legacyProduct) {
        return {
          productId: 'legacy-item',
          productName: legacyProduct,
          quantity: validateNumber(item.quantity, 1),
          priceAtTime: validateNumber(item.priceAtTime, 0),
          hasError: true,
          errorMessage: 'Legacy format'
        }
      }
      throw new Error('No product information found in order item')
    }

    // Handle case where productId might be an object (populated product)
    if (typeof item.productId === 'object' && item.productId !== null) {
      const productObj = item.productId as any
      
      // Validate object structure - handle various backend population formats
      const productId = productObj._id || productObj.id || productObj.productId
      if (!productId) {
        throw new Error('Product object missing ID field')
      }
      
      // Extract name from various possible locations with multilingual support
      let productName = `Product #${productId.slice(-8)}`
      if (productObj.name) {
        if (typeof productObj.name === 'object') {
          productName = getLocalizedText(productObj.name, 'en') || productName
        } else if (typeof productObj.name === 'string') {
          productName = productObj.name
        }
      } else if (productObj.title) {
        productName = productObj.title
      } else if (productObj.productName) {
        productName = productObj.productName
      }
      
      return {
        productId: productId,
        productName: productName,
        quantity: validateNumber(item.quantity, 1),
        priceAtTime: validateNumber(item.priceAtTime, 0),
        unit: productObj.unit || productObj.unitType,
        image: productObj.images?.[0] || productObj.image || productObj.imageUrl
      }
    }
    
    // Handle case where product field is populated (preferred approach)
    if (item.product) {
      const productId = item.product._id || (item.product as any).id
      if (!productId) {
        throw new Error('Product field missing _id')
      }
      
      // Extract product name with multilingual support
      let productName = `Product #${productId.slice(-8)}`
      if (item.product.name) {
        if (typeof item.product.name === 'object') {
          productName = getLocalizedText(item.product.name, 'en') || productName
        } else if (typeof item.product.name === 'string') {
          productName = item.product.name
        }
      } else if ((item.product as any).title) {
        productName = (item.product as any).title
      }
      
      return {
        productId: productId,
        productName: productName,
        quantity: validateNumber(item.quantity, 1),
        priceAtTime: validateNumber(item.priceAtTime, 0),
        unit: item.product.unit || (item.product as any).unitType,
        image: item.product.images?.[0] || (item.product as any).image
      }
    }
    
    // Handle normal case where productId is a string
    if (typeof item.productId === 'string' && item.productId.length > 0) {
      // Check for additional product info that might be stored separately
      const additionalInfo = (item as any)
      const productName = additionalInfo.productName || 
                          additionalInfo.name || 
                          `Product #${item.productId.slice(-8)}`
      
      return {
        productId: item.productId,
        productName: productName,
        quantity: validateNumber(item.quantity, 1),
        priceAtTime: validateNumber(item.priceAtTime, 0),
        unit: additionalInfo.unit || additionalInfo.unitType,
        image: additionalInfo.image || additionalInfo.imageUrl
      }
    }
    
    // Handle edge case where productId exists but is not a string or object
    if (item.productId) {
      const stringId = String(item.productId)
      return {
        productId: stringId,
        productName: `Product #${stringId.slice(-8)}`,
        quantity: validateNumber(item.quantity, 1),
        priceAtTime: validateNumber(item.priceAtTime, 0),
        hasError: true,
        errorMessage: 'Unusual ID format'
      }
    }
    
    // If we get here, the data structure is unexpected
    throw new Error('Invalid or missing productId: ' + typeof item.productId)
    
  } catch (error) {
    // Use enhanced error handling
    const { userMessage, fallbackItem } = orderErrorHandler.handleOrderItemError(
      error as Error,
      item,
      userId
    )
    
    return {
      ...fallbackItem,
      hasError: true,
      errorMessage: userMessage
    }
  }
}

/**
 * Safely processes an array of order items with enhanced error handling
 * 
 * @param items - Array of order items to process
 * @param userId - Optional user ID for error logging
 * @returns Array of ProcessedOrderItem with safe display values
 */
export const processOrderItems = (items: OrderItem[], userId?: string): ProcessedOrderItem[] => {
  try {
    if (!Array.isArray(items)) {
      throw new Error('Order items is not an array: ' + typeof items)
    }
    
    if (items.length === 0) {
      return []
    }
    
    const processedItems: ProcessedOrderItem[] = []
    let errorCount = 0
    
    for (let i = 0; i < items.length; i++) {
      try {
        const processedItem = processOrderItem(items[i], userId)
        processedItems.push(processedItem)
        
        if (processedItem.hasError) {
          errorCount++
        }
      } catch (itemError) {
        // If individual item processing fails completely, add a fallback
        errorCount++
        processedItems.push({
          productId: `error-${i}`,
          productName: `Item ${i + 1} (Error)`,
          quantity: 0,
          priceAtTime: 0,
          hasError: true,
          errorMessage: 'Failed to process item'
        })
      }
    }
    
    // Log if we had multiple errors
    if (errorCount > 1) {
      errorLogger.logError(
        new Error(`Multiple order item processing errors: ${errorCount}/${items.length}`),
        {
          component: 'Orders',
          operation: 'processOrderItems',
          userId
        },
        'medium'
      )
    }
    
    return processedItems
    
  } catch (error) {
    // Complete failure - return empty array and log error
    errorLogger.logError(
      error as Error,
      {
        component: 'Orders',
        operation: 'processOrderItems',
        userId
      },
      'high'
    )
    
    return []
  }
}

/**
 * Validate and sanitize numeric values with appropriate defaults
 */
const validateNumber = (value: any, fallback: number): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    // For quantities, ensure minimum of 1; for prices, allow 0
    return fallback === 1 ? Math.max(1, value) : Math.max(0, value)
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && isFinite(parsed)) {
      return fallback === 1 ? Math.max(1, parsed) : Math.max(0, parsed)
    }
  }
  
  return fallback
}

/**
 * Enhanced order processing with retry mechanism
 */
export const processOrderWithRetry = async (
  orderData: any,
  userId?: string,
  maxRetries: number = 2
): Promise<{ success: boolean; processedOrder?: any; error?: string }> => {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const processedItems = processOrderItems(orderData.items || [], userId)
      
      const processedOrder = {
        ...orderData,
        items: processedItems,
        hasErrors: processedItems.some(item => item.hasError),
        errorCount: processedItems.filter(item => item.hasError).length
      }
      
      return { success: true, processedOrder }
      
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }
  
  // All retries failed
  const errorEntry = errorLogger.logError(
    lastError || new Error('Unknown error in order processing'),
    {
      component: 'Orders',
      operation: 'processOrderWithRetry',
      userId
    },
    'high'
  )
  
  return { 
    success: false, 
    error: errorEntry.userMessage 
  }
}