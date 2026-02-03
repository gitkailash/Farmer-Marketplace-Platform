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
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
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
 * @route   GET /api/admin/users/:id
 * @desc    Get a single user by ID with statistics
 * @access  Private (Admin only)
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