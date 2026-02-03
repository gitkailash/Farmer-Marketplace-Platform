import { body, query, param } from 'express-validator';
import { validateUrlArray } from '../middleware/validation';

/**
 * Product categories enum for validation
 * Synchronized with frontend categories
 */
export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Herbs',
  'Spices',
  'Nuts',
  'Seeds',
  'Other'
] as const;

/**
 * Product units enum for validation
 */
export const PRODUCT_UNITS = [
  'kg', 'g', 'lb', 'piece', 'dozen', 'liter', 'ml', 'bunch', 'bag', 'box'
] as const;

/**
 * Product status enum for validation
 */
export const PRODUCT_STATUS = ['DRAFT', 'PUBLISHED', 'INACTIVE'] as const;

/**
 * Validation rules for creating a product
 */
export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\(\)]+$/)
    .withMessage('Product name contains invalid characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`),

  body('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Price must be between 0.01 and 999,999.99')
    .custom((value) => {
      // Ensure price has at most 2 decimal places
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Price cannot have more than 2 decimal places');
      }
      return true;
    }),

  body('unit')
    .notEmpty()
    .withMessage('Product unit is required')
    .isIn(PRODUCT_UNITS)
    .withMessage(`Unit must be one of: ${PRODUCT_UNITS.join(', ')}`),

  body('stock')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0, max: 999999 })
    .withMessage('Stock must be a whole number between 0 and 999,999'),

  body('images')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 images allowed')
    .custom((images: string[]) => {
      if (images && !validateUrlArray(images)) {
        throw new Error('All images must be valid URLs ending in jpg, jpeg, png, gif, or webp');
      }
      return true;
    }),

  body('harvestDate')
    .optional()
    .isISO8601()
    .withMessage('Harvest date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      if (date < oneYearAgo || date > oneMonthFromNow) {
        throw new Error('Harvest date must be within the last year or next month');
      }
      return true;
    }),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value, { req }) => {
      const expiryDate = new Date(value);
      const harvestDate = req.body.harvestDate ? new Date(req.body.harvestDate) : new Date();
      
      if (expiryDate <= harvestDate) {
        throw new Error('Expiry date must be after harvest date');
      }
      
      const maxExpiryDate = new Date();
      maxExpiryDate.setFullYear(maxExpiryDate.getFullYear() + 2);
      
      if (expiryDate > maxExpiryDate) {
        throw new Error('Expiry date cannot be more than 2 years from now');
      }
      
      return true;
    }),

  body('organicCertified')
    .optional()
    .isBoolean()
    .withMessage('Organic certification status must be a boolean'),

  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 tags allowed')
    .custom((tags: string[]) => {
      if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
        throw new Error('Each tag must be a string with maximum 50 characters');
      }
      return true;
    })
];

/**
 * Validation rules for updating a product
 */
export const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\(\)]+$/)
    .withMessage('Product name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters'),

  body('category')
    .optional()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`),

  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Price must be between 0.01 and 999,999.99')
    .custom((value) => {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Price cannot have more than 2 decimal places');
      }
      return true;
    }),

  body('unit')
    .optional()
    .isIn(PRODUCT_UNITS)
    .withMessage(`Unit must be one of: ${PRODUCT_UNITS.join(', ')}`),

  body('stock')
    .optional()
    .isInt({ min: 0, max: 999999 })
    .withMessage('Stock must be a whole number between 0 and 999,999'),

  body('status')
    .optional()
    .isIn(PRODUCT_STATUS)
    .withMessage(`Status must be one of: ${PRODUCT_STATUS.join(', ')}`),

  body('images')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 images allowed')
    .custom((images: string[]) => {
      if (images && !validateUrlArray(images)) {
        throw new Error('All images must be valid URLs ending in jpg, jpeg, png, gif, or webp');
      }
      return true;
    }),

  body('harvestDate')
    .optional()
    .isISO8601()
    .withMessage('Harvest date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      if (date < oneYearAgo || date > oneMonthFromNow) {
        throw new Error('Harvest date must be within the last year or next month');
      }
      return true;
    }),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value, { req }) => {
      const expiryDate = new Date(value);
      const harvestDate = req.body.harvestDate ? new Date(req.body.harvestDate) : new Date();
      
      if (expiryDate <= harvestDate) {
        throw new Error('Expiry date must be after harvest date');
      }
      
      const maxExpiryDate = new Date();
      maxExpiryDate.setFullYear(maxExpiryDate.getFullYear() + 2);
      
      if (expiryDate > maxExpiryDate) {
        throw new Error('Expiry date cannot be more than 2 years from now');
      }
      
      return true;
    }),

  body('organicCertified')
    .optional()
    .isBoolean()
    .withMessage('Organic certification status must be a boolean'),

  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 tags allowed')
    .custom((tags: string[]) => {
      if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 50)) {
        throw new Error('Each tag must be a string with maximum 50 characters');
      }
      return true;
    })
];

/**
 * Validation rules for product search and filtering
 */
export const validateProductSearch = [
  query('search')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\(\)]+$/)
    .withMessage('Search term contains invalid characters'),

  query('category')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .custom((value) => {
      // Allow empty string (means "All" categories)
      if (value === '' || value === 'All') {
        return true;
      }
      // Check if it's a valid category
      if (!PRODUCT_CATEGORIES.includes(value)) {
        throw new Error(`Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`);
      }
      return true;
    }),

  query('status')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isIn(PRODUCT_STATUS)
    .withMessage(`Status must be one of: ${PRODUCT_STATUS.join(', ')}`),

  query('minPrice')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      const minPrice = parseFloat(req.query?.minPrice as string);
      if (minPrice && parseFloat(value) < minPrice) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),

  query('farmerId')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isMongoId()
    .withMessage('Farmer ID must be a valid MongoDB ObjectId'),

  query('organicOnly')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isBoolean()
    .withMessage('Organic filter must be a boolean'),

  query('inStock')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isBoolean()
    .withMessage('In stock filter must be a boolean'),

  query('page')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isIn(['name', 'price', 'createdAt', 'stock', 'category'])
    .withMessage('Sort by must be name, price, createdAt, stock, or category'),

  query('sortOrder')
    .optional({ values: 'falsy' }) // Allow empty strings and undefined
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for product ID parameter
 */
export const validateProductId = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for farmer ID parameter
 */
export const validateFarmerId = [
  param('farmerId')
    .notEmpty()
    .withMessage('Farmer ID is required')
    .isMongoId()
    .withMessage('Farmer ID must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for bulk operations
 */
export const validateBulkProductUpdate = [
  body('productIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Product IDs must be an array with 1-100 items')
    .custom((ids: string[]) => {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!ids.every(id => objectIdRegex.test(id))) {
        throw new Error('All product IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),

  body('updates')
    .isObject()
    .withMessage('Updates must be an object')
    .custom((updates) => {
      const allowedFields = ['status', 'category', 'organicCertified'];
      const updateKeys = Object.keys(updates);
      
      if (updateKeys.length === 0) {
        throw new Error('At least one update field is required');
      }
      
      if (!updateKeys.every(key => allowedFields.includes(key))) {
        throw new Error(`Only these fields can be bulk updated: ${allowedFields.join(', ')}`);
      }
      
      return true;
    })
];