import { body, query, param } from 'express-validator';

/**
 * User roles enum for validation
 */
export const USER_ROLES = ['VISITOR', 'BUYER', 'FARMER', 'ADMIN'] as const;

/**
 * Moderation types enum
 */
export const MODERATION_TYPES = ['reviews', 'products', 'messages', 'users'] as const;

/**
 * Analytics periods enum
 */
export const ANALYTICS_PERIODS = ['day', 'week', 'month', 'quarter', 'year'] as const;

/**
 * Audit log actions enum
 */
export const AUDIT_ACTIONS = [
  'user_created',
  'user_updated',
  'user_deleted',
  'user_role_changed',
  'product_moderated',
  'review_moderated',
  'message_moderated',
  'content_created',
  'content_updated',
  'content_deleted',
  'system_config_changed'
] as const;

/**
 * Validation rules for user ID parameter
 */
export const validateUserId = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for updating a user
 */
export const validateUpdateUser = [
  body('role')
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),

  body('profile.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.\']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, dots, and apostrophes'),

  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Phone number format is invalid'),

  body('profile.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean'),

  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Verified status must be a boolean'),

  body('suspensionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Suspension reason cannot exceed 500 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
];

/**
 * Validation rules for user search and filtering
 */
export const validateUserSearch = [
  query('role')
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-\.\@]+$/)
    .withMessage('Search term contains invalid characters'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active filter must be a boolean'),

  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Verified filter must be a boolean'),

  query('registeredAfter')
    .optional()
    .isISO8601()
    .withMessage('Registered after date must be a valid ISO 8601 date'),

  query('registeredBefore')
    .optional()
    .isISO8601()
    .withMessage('Registered before date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const afterDate = req.query?.registeredAfter as string;
      if (afterDate && new Date(value) < new Date(afterDate)) {
        throw new Error('Registered before date must be after registered after date');
      }
      return true;
    }),

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
    .isIn(['createdAt', 'email', 'profile.name', 'role', 'lastLoginAt'])
    .withMessage('Sort by must be createdAt, email, profile.name, role, or lastLoginAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for moderation queue filtering
 */
export const validateModerationQueue = [
  query('type')
    .optional()
    .isIn(MODERATION_TYPES)
    .withMessage(`Moderation type must be one of: ${MODERATION_TYPES.join(', ')}`),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'flagged'])
    .withMessage('Status must be pending, approved, rejected, or flagged'),

  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be low, normal, high, or urgent'),

  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned to must be a valid MongoDB ObjectId'),

  query('createdAfter')
    .optional()
    .isISO8601()
    .withMessage('Created after date must be a valid ISO 8601 date'),

  query('createdBefore')
    .optional()
    .isISO8601()
    .withMessage('Created before date must be a valid ISO 8601 date'),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation rules for analytics queries
 */
export const validateAnalytics = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      if (date < twoYearsAgo) {
        throw new Error('Start date cannot be more than 2 years ago');
      }
      return true;
    }),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const startDate = req.query?.startDate as string;
      const endDate = new Date(value);
      const now = new Date();
      
      if (endDate > now) {
        throw new Error('End date cannot be in the future');
      }
      
      if (startDate && endDate < new Date(startDate)) {
        throw new Error('End date must be after start date');
      }
      
      return true;
    }),

  query('groupBy')
    .optional()
    .isIn(ANALYTICS_PERIODS)
    .withMessage(`Group by must be one of: ${ANALYTICS_PERIODS.join(', ')}`),

  query('metrics')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const metrics = value.split(',');
        const validMetrics = [
          'users',
          'products',
          'orders',
          'reviews',
          'revenue',
          'active_users',
          'new_registrations',
          'order_completion_rate',
          'average_rating'
        ];
        
        const invalidMetrics = metrics.filter(metric => !validMetrics.includes(metric.trim()));
        if (invalidMetrics.length > 0) {
          throw new Error(`Invalid metrics: ${invalidMetrics.join(', ')}`);
        }
      }
      return true;
    }),

  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('Include inactive must be a boolean')
];

/**
 * Validation rules for audit log queries
 */
export const validateAuditLogs = [
  query('action')
    .optional()
    .isIn(AUDIT_ACTIONS)
    .withMessage(`Action must be one of: ${AUDIT_ACTIONS.join(', ')}`),

  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  query('targetId')
    .optional()
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),

  query('targetType')
    .optional()
    .isIn(['User', 'Product', 'Order', 'Review', 'Message', 'GalleryItem', 'MayorMessage', 'NewsItem'])
    .withMessage('Target type must be a valid model name'),

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

  query('ipAddress')
    .optional()
    .isIP()
    .withMessage('IP address must be a valid IP address'),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation rules for system configuration updates
 */
export const validateSystemConfig = [
  body('maintenanceMode')
    .optional()
    .isBoolean()
    .withMessage('Maintenance mode must be a boolean'),

  body('registrationEnabled')
    .optional()
    .isBoolean()
    .withMessage('Registration enabled must be a boolean'),

  body('maxFileUploadSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max file upload size must be between 1 and 100 MB'),

  body('sessionTimeout')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Session timeout must be between 15 and 1440 minutes'),

  body('rateLimit.windowMs')
    .optional()
    .isInt({ min: 60000, max: 3600000 })
    .withMessage('Rate limit window must be between 1 and 60 minutes (in milliseconds)'),

  body('rateLimit.maxRequests')
    .optional()
    .isInt({ min: 10, max: 10000 })
    .withMessage('Max requests must be between 10 and 10000'),

  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),

  body('autoApproveReviews')
    .optional()
    .isBoolean()
    .withMessage('Auto approve reviews must be a boolean')
];

/**
 * Validation rules for bulk user operations
 */
export const validateBulkUserOperation = [
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('User IDs must be an array with 1-100 items')
    .custom((ids: string[]) => {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!ids.every(id => objectIdRegex.test(id))) {
        throw new Error('All user IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),

  body('operation')
    .isIn(['activate', 'deactivate', 'verify', 'unverify', 'delete', 'changeRole'])
    .withMessage('Operation must be activate, deactivate, verify, unverify, delete, or changeRole'),

  body('newRole')
    .if(body('operation').equals('changeRole'))
    .isIn(USER_ROLES)
    .withMessage(`New role must be one of: ${USER_ROLES.join(', ')}`),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

/**
 * Validation rules for content moderation actions
 */
export const validateContentModeration = [
  body('action')
    .isIn(['approve', 'reject', 'flag', 'unflag', 'delete'])
    .withMessage('Action must be approve, reject, flag, unflag, or delete'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),

  body('notifyUser')
    .optional()
    .isBoolean()
    .withMessage('Notify user must be a boolean'),

  body('publicNote')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Public note cannot exceed 200 characters')
];