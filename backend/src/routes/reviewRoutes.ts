import { Router } from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  moderateReview,
  getFarmerReviews,
  getPendingReviews,
  getMyReviews,
  canReviewOrder,
  getOrderReview
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { UserRole } from '../models';
import {
  validateCreateReview,
  validateUpdateReview,
  validateModerateReview,
  validateReviewSearch,
  validateReviewId,
  validateOrderId,
  validateFarmerId
} from '../validators/reviewValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// Routes

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     description: Create a new review for an order (buyers and farmers only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - revieweeId
 *               - rating
 *               - comment
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID of the related order
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j4
 *               revieweeId:
 *                 type: string
 *                 description: ID of the user being reviewed
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j6
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *                 example: Excellent quality tomatoes, very fresh!
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot review this order
 *   get:
 *     summary: Get reviews
 *     description: Get reviews with filtering and pagination
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: revieweeId
 *         schema:
 *           type: string
 *         description: Filter by reviewee ID
 *       - in: query
 *         name: reviewerId
 *         schema:
 *           type: string
 *         description: Filter by reviewer ID
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Filter by order ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
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
 *         description: Reviews retrieved successfully
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
 *                         $ref: '#/components/schemas/Review'
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.BUYER, UserRole.FARMER),
  validateCreateReview,
  handleValidationErrors,
  createReview
);

router.get(
  '/',
  validateReviewSearch,
  handleValidationErrors,
  getReviews
);

/**
 * @route   GET /api/reviews/pending
 * @desc    Get pending reviews for moderation
 * @access  Private (Admin only)
 */
router.get(
  '/pending',
  authenticate,
  authorize(UserRole.ADMIN),
  validateReviewSearch,
  handleValidationErrors,
  getPendingReviews
);

/**
 * @route   GET /api/reviews/can-review/:orderId
 * @desc    Check if user can review an order
 * @access  Private
 */
router.get(
  '/can-review/:orderId',
  authenticate,
  validateOrderId,
  handleValidationErrors,
  canReviewOrder
);

/**
 * @route   GET /api/reviews/order/:orderId
 * @desc    Get review for a specific order (if exists)
 * @access  Private
 */
router.get(
  '/order/:orderId',
  authenticate,
  validateOrderId,
  handleValidationErrors,
  getOrderReview
);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get user's review history (given or received)
 * @access  Private
 */
router.get(
  '/my-reviews',
  authenticate,
  validateReviewSearch,
  handleValidationErrors,
  getMyReviews
);

/**
 * @route   GET /api/reviews/farmer/:farmerId
 * @desc    Get reviews for a specific farmer
 * @access  Public
 */
router.get(
  '/farmer/:farmerId',
  validateFarmerId,
  validateReviewSearch,
  handleValidationErrors,
  getFarmerReviews
);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review by ID
 * @access  Public (with visibility controls)
 */
router.get(
  '/:id',
  validateReviewId,
  handleValidationErrors,
  getReviewById
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review (only by reviewer and only if not approved)
 * @access  Private (Reviewer only)
 */
router.put(
  '/:id',
  authenticate,
  validateUpdateReview,
  handleValidationErrors,
  updateReview
);

/**
 * @route   PUT /api/reviews/:id/moderate
 * @desc    Moderate a review (approve or reject)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/moderate',
  authenticate,
  authorize(UserRole.ADMIN),
  validateModerateReview,
  handleValidationErrors,
  moderateReview
);

export default router;