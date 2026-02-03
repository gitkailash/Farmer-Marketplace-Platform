import { body, query, param } from 'express-validator';
import { validateObjectIdArray } from '../middleware/validation';

/**
 * Order status enum for validation
 */
export const ORDER_STATUS = ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const;

/**
 * Payment method enum for validation
 */
export const PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'BANK_TRANSFER', 'MOBILE_MONEY'] as const;

/**
 * Delivery method enum for validation
 */
export const DELIVERY_METHODS = ['PICKUP', 'DELIVERY', 'SHIPPING'] as const;

/**
 * Validation rules for creating an order
 */
export const validateCreateOrder = [
  body('farmerId')
    .notEmpty()
    .withMessage('Farmer ID is required')
    .isMongoId()
    .withMessage('Farmer ID must be a valid MongoDB ObjectId'),

  body('items')
    .notEmpty()
    .withMessage('Order items are required')
    .isArray({ min: 1, max: 50 })
    .withMessage('Order must have between 1 and 50 items'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1, max: 999999 })
    .withMessage('Quantity must be between 1 and 999,999'),

  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\(\)\#\/]+$/)
    .withMessage('Delivery address contains invalid characters'),

  body('deliveryMethod')
    .optional()
    .isIn(DELIVERY_METHODS)
    .withMessage(`Delivery method must be one of: ${DELIVERY_METHODS.join(', ')}`),

  body('paymentMethod')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('requestedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Requested delivery date must be a valid date')
    .custom((value) => {
      const deliveryDate = new Date(value);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      
      if (deliveryDate < tomorrow) {
        throw new Error('Delivery date must be at least tomorrow');
      }
      
      if (deliveryDate > maxDate) {
        throw new Error('Delivery date cannot be more than 3 months from now');
      }
      
      return true;
    }),

  body('contactPhone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Contact phone must be a valid phone number'),

  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters')
];

/**
 * Validation rules for updating order status
 */
export const validateUpdateOrderStatus = [
  body('status')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(ORDER_STATUS)
    .withMessage(`Status must be one of: ${ORDER_STATUS.join(', ')}`),

  body('statusNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Status note cannot exceed 500 characters'),

  body('estimatedCompletionDate')
    .optional()
    .isISO8601()
    .withMessage('Estimated completion date must be a valid date')
    .custom((value) => {
      const completionDate = new Date(value);
      const now = new Date();
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      
      if (completionDate < now) {
        throw new Error('Estimated completion date cannot be in the past');
      }
      
      if (completionDate > maxDate) {
        throw new Error('Estimated completion date cannot be more than 6 months from now');
      }
      
      return true;
    })
];

/**
 * Validation rules for order search and filtering
 */
export const validateOrderSearch = [
  query('status')
    .optional()
    .isIn(ORDER_STATUS)
    .withMessage(`Status must be one of: ${ORDER_STATUS.join(', ')}`),

  query('farmerId')
    .optional()
    .isMongoId()
    .withMessage('Farmer ID must be a valid MongoDB ObjectId'),

  query('buyerId')
    .optional()
    .isMongoId()
    .withMessage('Buyer ID must be a valid MongoDB ObjectId'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
    .custom((value, { req }) => {
      const minAmount = parseFloat(req.query?.minAmount as string);
      if (minAmount && parseFloat(value) < minAmount) {
        throw new Error('Maximum amount must be greater than minimum amount');
      }
      return true;
    }),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const startDate = req.query?.startDate as string;
      if (startDate && new Date(value) < new Date(startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('deliveryMethod')
    .optional()
    .isIn(DELIVERY_METHODS)
    .withMessage(`Delivery method must be one of: ${DELIVERY_METHODS.join(', ')}`),

  query('paymentMethod')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'totalAmount', 'status', 'requestedDeliveryDate'])
    .withMessage('Sort by must be createdAt, totalAmount, status, or requestedDeliveryDate'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for order ID parameter
 */
export const validateOrderId = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for order cancellation
 */
export const validateCancelOrder = [
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5 and 500 characters'),

  body('refundRequested')
    .optional()
    .isBoolean()
    .withMessage('Refund requested must be a boolean')
];

/**
 * Validation rules for order rating/feedback
 */
export const validateOrderFeedback = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters'),

  body('deliveryRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery rating must be between 1 and 5'),

  body('qualityRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Quality rating must be between 1 and 5'),

  body('communicationRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5')
];

/**
 * Validation rules for bulk order operations
 */
export const validateBulkOrderUpdate = [
  body('orderIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Order IDs must be an array with 1-50 items')
    .custom((ids: string[]) => {
      if (!validateObjectIdArray(ids)) {
        throw new Error('All order IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),

  body('action')
    .isIn(['cancel', 'accept', 'complete'])
    .withMessage('Action must be cancel, accept, or complete'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

/**
 * Validation rules for order analytics
 */
export const validateOrderAnalytics = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'quarter', 'year'])
    .withMessage('Period must be day, week, month, quarter, or year'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('groupBy')
    .optional()
    .isIn(['status', 'farmer', 'category', 'paymentMethod', 'deliveryMethod'])
    .withMessage('Group by must be status, farmer, category, paymentMethod, or deliveryMethod')
];