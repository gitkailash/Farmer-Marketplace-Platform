import { Router } from 'express';
import {
  sendMessage,
  getMessages,
  getConversation,
  markMessageAsRead,
  getUnreadCount,
  moderateMessage,
  getModerationQueue,
  getConversationList
} from '../controllers/messageController';
import {
  validateSendMessage,
  validateModerateMessage,
  validateMessageId,
  validateUserId,
  validateMessageSearch
} from '../validators/messageValidators';
import { authenticate, requireRole } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { UserRole } from '../models';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

/**
 * @route   POST /api/messages
 * @desc    Send a message to another user
 * @access  Private (BUYER, FARMER)
 */
router.post(
  '/',
  authenticate,
  requireRole([UserRole.BUYER, UserRole.FARMER]),
  validateSendMessage,
  handleValidationErrors,
  sendMessage
);

/**
 * @route   GET /api/messages
 * @desc    Get messages (conversations for users, moderation queue for admins)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validateMessageSearch,
  handleValidationErrors,
  getMessages
);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get conversation list for current user
 * @access  Private (BUYER, FARMER)
 */
router.get(
  '/conversations',
  authenticate,
  requireRole([UserRole.BUYER, UserRole.FARMER]),
  getConversationList
);

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Get conversation between current user and specified user
 * @access  Private (BUYER, FARMER)
 */
router.get(
  '/conversation/:userId',
  authenticate,
  requireRole([UserRole.BUYER, UserRole.FARMER]),
  validateUserId,
  handleValidationErrors,
  getConversation
);

/**
 * @route   GET /api/messages/unread/count
 * @desc    Get unread message count for current user
 * @access  Private
 */
router.get(
  '/unread/count',
  authenticate,
  getUnreadCount
);

/**
 * @route   GET /api/messages/moderation/queue
 * @desc    Get moderation queue (Admin only)
 * @access  Private (ADMIN)
 */
router.get(
  '/moderation/queue',
  authenticate,
  requireRole([UserRole.ADMIN]),
  validateMessageSearch,
  handleValidationErrors,
  getModerationQueue
);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private (message receiver)
 */
router.put(
  '/:id/read',
  authenticate,
  validateMessageId,
  handleValidationErrors,
  markMessageAsRead
);

/**
 * @route   PUT /api/messages/:id/moderate
 * @desc    Moderate a message (Admin only)
 * @access  Private (ADMIN)
 */
router.put(
  '/:id/moderate',
  authenticate,
  requireRole([UserRole.ADMIN]),
  validateModerateMessage,
  handleValidationErrors,
  moderateMessage
);

export default router;