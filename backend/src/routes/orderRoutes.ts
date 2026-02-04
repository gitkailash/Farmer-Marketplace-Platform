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
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order (buyers only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmerId
 *               - items
 *               - deliveryAddress
 *             properties:
 *               farmerId:
 *                 type: string
 *                 description: ID of the farmer
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j6
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID of the product
 *                       example: 64f1a2b3c4d5e6f7g8h9i0j2
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity to order
 *                       example: 3
 *               deliveryAddress:
 *                 type: string
 *                 description: Delivery address
 *                 example: 456 Oak St, City, State 12345
 *               notes:
 *                 type: string
 *                 description: Additional order notes
 *                 example: Please deliver in the morning
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Buyers only
 *   get:
 *     summary: Get orders
 *     description: Get orders with filtering and pagination (role-based access)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, COMPLETED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *         description: Filter by farmer ID (admin only)
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by buyer ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  requireBuyer,
  validateCreateOrder,
  handleValidationErrors,
  createOrder
);

router.get(
  '/',
  authenticate,
  validateOrderSearch,
  handleValidationErrors,
  getOrders
);

/**
 * @swagger
 * /orders/history:
 *   get:
 *     summary: Get order history
 *     description: Get order history for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, COMPLETED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  authenticate,
  validateOrderSearch,
  handleValidationErrors,
  getOrderHistory
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Get a single order by its ID (role-based access)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j4
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Order not found
 */
router.get(
  '/:id',
  authenticate,
  validateOrderId,
  handleValidationErrors,
  getOrderById
);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     description: Update order status (farmer owner or admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, COMPLETED, CANCELLED]
 *                 description: New order status
 *                 example: ACCEPTED
 *               notes:
 *                 type: string
 *                 description: Optional status update notes
 *                 example: Order accepted, will be ready for pickup tomorrow
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not order owner or admin
 *       404:
 *         description: Order not found
 *   delete:
 *     summary: Cancel order
 *     description: Cancel an order (buyer owner or admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j4
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not order owner or admin
 *       404:
 *         description: Order not found
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

router.delete(
  '/:id',
  authenticate,
  requireBuyerOrAdmin,
  validateOrderId,
  handleValidationErrors,
  cancelOrder
);

export default router;