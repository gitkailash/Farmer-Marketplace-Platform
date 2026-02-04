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
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message to another user (buyers and farmers only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID of the message receiver
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j6
 *               content:
 *                 type: string
 *                 description: Message content
 *                 example: Hello, I would like to know more about your tomatoes.
 *               productId:
 *                 type: string
 *                 description: Optional product ID if message is about a specific product
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j2
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Buyers and farmers only
 *   get:
 *     summary: Get messages
 *     description: Get messages (conversations for users, moderation queue for admins)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationWith
 *         schema:
 *           type: string
 *         description: Get conversation with specific user ID
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter for unread messages only
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
 *         description: Messages retrieved successfully
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
 *                         $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  requireRole([UserRole.BUYER, UserRole.FARMER]),
  validateSendMessage,
  handleValidationErrors,
  sendMessage
);

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