import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getModerationQueue,
  getAnalytics,
  getAuditLogs,
  exportAnalytics,
  exportAuditLogs
} from '../controllers/adminController';
import {
  validateUserId,
  validateUpdateUser,
  validateUserSearch,
  validateModerationQueue,
  validateAnalytics,
  validateAuditLogs
} from '../validators/adminValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// User Management Routes

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Get all users with filtering and pagination (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [VISITOR, BUYER, FARMER, ADMIN]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: Users retrieved successfully
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
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/users',
  authenticate,
  requireAdmin,
  validateUserSearch,
  handleValidationErrors,
  getUsers
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Get a single user by ID with statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j1
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     description: Update user information (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [VISITOR, BUYER, FARMER, ADMIN]
 *                 description: User role
 *               isActive:
 *                 type: boolean
 *                 description: User active status
 *               profile:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: User full name
 *                   phone:
 *                     type: string
 *                     description: User phone number
 *                   address:
 *                     type: string
 *                     description: User address
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     description: Delete a user account (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 64f1a2b3c4d5e6f7g8h9i0j1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateUserId,
  handleValidationErrors,
  getUserById
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update a user
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateUserId,
  validateUpdateUser,
  handleValidationErrors,
  updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user and all related data
 * @access  Private (Admin only)
 */
router.delete(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateUserId,
  handleValidationErrors,
  deleteUser
);

// Moderation Routes

/**
 * @route   GET /api/admin/moderation
 * @desc    Get moderation queue for reviews, products, and messages
 * @access  Private (Admin only)
 */
router.get(
  '/moderation',
  authenticate,
  requireAdmin,
  validateModerationQueue,
  handleValidationErrors,
  getModerationQueue
);

// Analytics and Reporting Routes

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics and reporting data
 * @access  Private (Admin only)
 */
router.get(
  '/analytics',
  authenticate,
  requireAdmin,
  validateAnalytics,
  handleValidationErrors,
  getAnalytics
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs of admin actions
 * @access  Private (Admin only)
 */
router.get(
  '/audit-logs',
  authenticate,
  requireAdmin,
  validateAuditLogs,
  handleValidationErrors,
  getAuditLogs
);

/**
 * @route   GET /api/admin/analytics/export
 * @desc    Export analytics data in JSON or CSV format
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/export',
  authenticate,
  requireAdmin,
  validateAnalytics,
  handleValidationErrors,
  exportAnalytics
);

/**
 * @route   GET /api/admin/audit-logs/export
 * @desc    Export audit logs in JSON or CSV format
 * @access  Private (Admin only)
 */
router.get(
  '/audit-logs/export',
  authenticate,
  requireAdmin,
  validateAuditLogs,
  handleValidationErrors,
  exportAuditLogs
);

export default router;