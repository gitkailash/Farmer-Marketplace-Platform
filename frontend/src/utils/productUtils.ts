import { MultilingualField } from '../types/api';

/**
 * Get the product name from a multilingual field or string
 */
export const getProductName = (name: MultilingualField | string | undefined, language: 'en' | 'ne' = 'en'): string => {
  if (!name) {
    return 'Unknown Product';
  }
  
  // If it's a simple string, return it
  if (typeof name === 'string') {
    return name;
  }
  
  // If it's a multilingual field, get the appropriate language
  if (typeof name === 'object' && name !== null) {
    // Try to get the requested language first
    if (name[language]) {
      return name[language];
    }
    
    // Fallback to English
    if (name.en) {
      return name.en;
    }
    
    // Fallback to Nepali if English is not available
    if (name.ne) {
      return name.ne;
    }
  }
  
  return 'Unknown Product';
};

/**
 * Get product information from order item (handles populated productId)
 */
export const getProductFromOrderItem = (item: any) => {
  // If productId is populated as an object, use it
  if (typeof item.productId === 'object' && item.productId !== null) {
    return {
      name: getProductName(item.productId.name),
      unit: item.productId.unit || 'units',
      _id: item.productId._id
    };
  }
  
  // If there's a separate product field, use it
  if (item.product) {
    return {
      name: getProductName(item.product.name),
      unit: item.product.unit || 'units',
      _id: item.product._id
    };
  }
  
  // Fallback
  return {
    name: 'Unknown Product',
    unit: 'units',
    _id: typeof item.productId === 'string' ? item.productId : 'unknown'
  };
};

/**
 * Get a short product ID for display
 */
export const getShortProductId = (productId: string | any): string => {
  if (typeof productId === 'string') {
    return productId.slice(-8);
  }
  
  if (typeof productId === 'object' && productId?._id) {
    return productId._id.slice(-8);
  }
  
  return 'Unknown';
};