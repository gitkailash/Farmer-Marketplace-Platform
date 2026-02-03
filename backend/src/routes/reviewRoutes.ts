import { Router } from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  moderateReview,
  getFarmerReviews,
  getPendingReviews,
  getMyReviews
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { UserRole } from '../models';
import {
  validateCreateReview,
  validateModerateReview,
  validateReviewSearch,
  validateReviewId,
  validateFarmerId
} from '../validators/reviewValidators';

const router = Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput);

// Routes

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Buyers and Farmers only)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.BUYER, UserRole.FARMER),
  validateCreateReview,
  handleValidationErrors,
  createReview
);

/**
 * @route   GET /api/reviews
 * @desc    Get reviews with filtering and pagination
 * @access  Public (with visibility controls)
 */
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