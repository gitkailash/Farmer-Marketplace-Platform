import { body, query, param } from 'express-validator';

/**
 * Reviewer type enum for validation
 */
export const REVIEWER_TYPES = ['BUYER', 'FARMER'] as const;

/**
 * Review moderation actions
 */
export const MODERATION_ACTIONS = ['approve', 'reject'] as const;

/**
 * Review categories for detailed feedback
 */
export const REVIEW_CATEGORIES = [
  'product_quality',
  'communication',
  'delivery_time',
  'packaging',
  'value_for_money',
  'overall_experience'
] as const;

/**
 * Validation rules for creating a review
 */
export const validateCreateReview = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),

  body('revieweeId')
    .notEmpty()
    .withMessage('Reviewee ID is required')
    .isMongoId()
    .withMessage('Reviewee ID must be a valid MongoDB ObjectId'),

  body('reviewerType')
    .notEmpty()
    .withMessage('Reviewer type is required')
    .isIn(REVIEWER_TYPES)
    .withMessage(`Reviewer type must be one of: ${REVIEWER_TYPES.join(', ')}`),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?\(\)\'\"\:\;]+$/)
    .withMessage('Comment contains invalid characters'),

  body('categoryRatings')
    .optional()
    .isObject()
    .withMessage('Category ratings must be an object')
    .custom((ratings) => {
      if (ratings) {
        const validCategories = REVIEW_CATEGORIES;
        const ratingKeys = Object.keys(ratings);
        
        // Check if all keys are valid categories
        const invalidKeys = ratingKeys.filter(key => !validCategories.includes(key as any));
        if (invalidKeys.length > 0) {
          throw new Error(`Invalid rating categories: ${invalidKeys.join(', ')}`);
        }
        
        // Check if all values are valid ratings (1-5)
        const invalidRatings = ratingKeys.filter(key => {
          const rating = ratings[key];
          return !Number.isInteger(rating) || rating < 1 || rating > 5;
        });
        
        if (invalidRatings.length > 0) {
          throw new Error('All category ratings must be integers between 1 and 5');
        }
      }
      return true;
    }),

  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean'),

  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 review images allowed')
    .custom((images: string[]) => {
      if (images) {
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        const invalidUrls = images.filter(url => !urlRegex.test(url));
        if (invalidUrls.length > 0) {
          throw new Error('All images must be valid URLs ending in jpg, jpeg, png, gif, or webp');
        }
      }
      return true;
    }),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous flag must be a boolean')
];

/**
 * Validation rules for updating a review
 */
export const validateUpdateReview = [
  // Review ID parameter
  param('id')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Review ID must be a valid MongoDB ObjectId'),

  // Rating validation
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  // Comment validation
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters')
    .custom((value: string) => {
      // Basic profanity check (this would be more sophisticated in production)
      const inappropriateWords = ['spam', 'fake', 'scam'];
      const lowerValue = value.toLowerCase();
      
      for (const word of inappropriateWords) {
        if (lowerValue.includes(word)) {
          throw new Error('Comment contains inappropriate content');
        }
      }
      
      return true;
    }),
];

/**
 * Validation rules for moderating a review
 */
export const validateModerateReview = [
  param('id')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Review ID must be a valid MongoDB ObjectId'),

  body('action')
    .notEmpty()
    .withMessage('Moderation action is required')
    .isIn(MODERATION_ACTIONS)
    .withMessage(`Action must be one of: ${MODERATION_ACTIONS.join(', ')}`),

  body('moderationNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Moderation note cannot exceed 500 characters'),

  body('flaggedContent')
    .optional()
    .isArray()
    .withMessage('Flagged content must be an array')
    .custom((flags: string[]) => {
      const validFlags = [
        'inappropriate_language',
        'spam',
        'fake_review',
        'personal_information',
        'off_topic',
        'harassment'
      ];
      
      if (flags && flags.some(flag => !validFlags.includes(flag))) {
        throw new Error(`Invalid flag types. Valid flags: ${validFlags.join(', ')}`);
      }
      return true;
    })
];

/**
 * Validation rules for review search and filtering
 */
export const validateReviewSearch = [
  query('revieweeId')
    .optional()
    .isMongoId()
    .withMessage('Reviewee ID must be a valid MongoDB ObjectId'),

  query('reviewerId')
    .optional()
    .isMongoId()
    .withMessage('Reviewer ID must be a valid MongoDB ObjectId'),

  query('reviewerType')
    .optional()
    .isIn(REVIEWER_TYPES)
    .withMessage(`Reviewer type must be one of: ${REVIEWER_TYPES.join(', ')}`),

  query('isApproved')
    .optional()
    .isBoolean()
    .withMessage('Approved status must be a boolean'),

  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),

  query('maxRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5')
    .custom((value, { req }) => {
      const minRating = parseInt(req.query?.minRating as string);
      if (minRating && parseInt(value) < minRating) {
        throw new Error('Maximum rating must be greater than or equal to minimum rating');
      }
      return true;
    }),

  query('hasImages')
    .optional()
    .isBoolean()
    .withMessage('Has images filter must be a boolean'),

  query('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend filter must be a boolean'),

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

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

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
    .isIn(['createdAt', 'rating', 'moderatedAt', 'helpfulCount'])
    .withMessage('Sort by must be createdAt, rating, moderatedAt, or helpfulCount'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for review ID parameter
 */
export const validateReviewId = [
  param('id')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Review ID must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for order ID parameter
 */
export const validateOrderId = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId')
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
 * Validation rules for review helpfulness voting
 */
export const validateReviewHelpfulness = [
  body('helpful')
    .notEmpty()
    .withMessage('Helpfulness vote is required')
    .isBoolean()
    .withMessage('Helpful must be a boolean (true for helpful, false for not helpful)')
];

/**
 * Validation rules for review response (farmer responding to buyer review)
 */
export const validateReviewResponse = [
  body('response')
    .trim()
    .notEmpty()
    .withMessage('Response is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Response must be between 10 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?\(\)\'\"\:\;]+$/)
    .withMessage('Response contains invalid characters'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('Public visibility must be a boolean')
];

/**
 * Validation rules for bulk review moderation
 */
export const validateBulkReviewModeration = [
  body('reviewIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Review IDs must be an array with 1-50 items')
    .custom((ids: string[]) => {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!ids.every(id => objectIdRegex.test(id))) {
        throw new Error('All review IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),

  body('action')
    .isIn(MODERATION_ACTIONS)
    .withMessage(`Action must be one of: ${MODERATION_ACTIONS.join(', ')}`),

  body('moderationNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Moderation note cannot exceed 500 characters')
];

/**
 * Validation rules for review analytics
 */
export const validateReviewAnalytics = [
  query('farmerId')
    .optional()
    .isMongoId()
    .withMessage('Farmer ID must be a valid MongoDB ObjectId'),

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
    .isIn(['rating', 'reviewerType', 'category', 'month'])
    .withMessage('Group by must be rating, reviewerType, category, or month')
];