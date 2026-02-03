import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderHistory
} from '../controllers/orderController';
import {
  authenticate,
  requireBuyer,
  requireFarmerOrAdmin,
  requireBuyerOrAdmin
} from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateOrderSearch,
  validateOrderId
} from '../validators/orderValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// Routes

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Buyer only)
 */
router.post(
  '/',
  authenticate,
  requireBuyer,
  validateCreateOrder,
  handleValidationErrors,
  createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get orders with filtering and pagination
 * @access  Private (Role-based access: buyers see their orders, farmers see orders for their products, admins see all)
 */
router.get(
  '/',
  authenticate,
  validateOrderSearch,
  handleValidationErrors,
  getOrders
);

/**
 * @route   GET /api/orders/history
 * @desc    Get order history for the authenticated user
 * @access  Private (Buyers and Farmers only)
 */
router.get(
  '/history',
  authenticate,
  validateOrderSearch,
  handleValidationErrors,
  getOrderHistory
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order by ID
 * @access  Private (Role-based access control)
 */
router.get(
  '/:id',
  authenticate,
  validateOrderId,
  handleValidationErrors,
  getOrderById
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Farmer owner or Admin)
 */
router.put(
  '/:id/status',
  authenticate,
  requireFarmerOrAdmin,
  validateOrderId,
  validateUpdateOrderStatus,
  handleValidationErrors,
  updateOrderStatus
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel an order
 * @access  Private (Buyer owner or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  requireBuyerOrAdmin,
  validateOrderId,
  handleValidationErrors,
  cancelOrder
);

export default router;