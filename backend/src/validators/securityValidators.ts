import { body, query, param } from 'express-validator';
import { validateRateLimit } from '../middleware/validation';

/**
 * Security-focused validation rules for sensitive operations
 */

/**
 * Rate limiting for password reset attempts
 */
export const passwordResetRateLimit = validateRateLimit(
  3, // max 3 attempts
  15 * 60 * 1000, // per 15 minutes
  (req) => req.body.email || req.ip
);

/**
 * Rate limiting for login attempts
 */
export const loginRateLimit = validateRateLimit(
  5, // max 5 attempts
  15 * 60 * 1000, // per 15 minutes
  (req) => req.body.email || req.ip
);

/**
 * Rate limiting for registration attempts
 */
export const registrationRateLimit = validateRateLimit(
  3, // max 3 attempts
  60 * 60 * 1000, // per hour
  (req) => req.ip || 'unknown'
);

/**
 * Validation for password reset request
 */
export const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .toLowerCase(),
  
  body('captcha')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Invalid captcha')
];

/**
 * Validation for password reset confirmation
 */
export const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid reset token format'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

/**
 * Validation for two-factor authentication setup
 */
export const validateTwoFactorSetup = [
  body('secret')
    .notEmpty()
    .withMessage('2FA secret is required')
    .isLength({ min: 16, max: 32 })
    .withMessage('Invalid 2FA secret format'),
  
  body('token')
    .notEmpty()
    .withMessage('2FA token is required')
    .matches(/^\d{6}$/)
    .withMessage('2FA token must be 6 digits')
];

/**
 * Validation for two-factor authentication verification
 */
export const validateTwoFactorVerify = [
  body('token')
    .notEmpty()
    .withMessage('2FA token is required')
    .matches(/^\d{6}$/)
    .withMessage('2FA token must be 6 digits')
];

/**
 * Validation for API key generation
 */
export const validateApiKeyGeneration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('API key name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('API key name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('API key name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('permissions')
    .isArray({ min: 1, max: 20 })
    .withMessage('At least one permission is required, maximum 20 allowed')
    .custom((permissions: string[]) => {
      const validPermissions = [
        'read:products',
        'write:products',
        'read:orders',
        'write:orders',
        'read:reviews',
        'write:reviews',
        'read:messages',
        'write:messages',
        'read:analytics',
        'admin:users',
        'admin:moderation'
      ];
      
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }
      return true;
    }),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date')
    .custom((value) => {
      const expiryDate = new Date(value);
      const now = new Date();
      const maxExpiry = new Date();
      maxExpiry.setFullYear(maxExpiry.getFullYear() + 1);
      
      if (expiryDate <= now) {
        throw new Error('Expiration date must be in the future');
      }
      
      if (expiryDate > maxExpiry) {
        throw new Error('Expiration date cannot be more than 1 year from now');
      }
      
      return true;
    })
];

/**
 * Validation for session management
 */
export const validateSessionRevoke = [
  body('sessionIds')
    .optional()
    .isArray({ min: 1, max: 50 })
    .withMessage('Session IDs must be an array with 1-50 items')
    .custom((ids: string[]) => {
      const sessionIdRegex = /^[a-zA-Z0-9\-_]{20,128}$/;
      if (!ids.every(id => sessionIdRegex.test(id))) {
        throw new Error('All session IDs must be valid format');
      }
      return true;
    }),
  
  body('revokeAll')
    .optional()
    .isBoolean()
    .withMessage('Revoke all must be a boolean')
];

/**
 * Validation for account deletion
 */
export const validateAccountDeletion = [
  body('password')
    .notEmpty()
    .withMessage('Current password is required for account deletion'),
  
  body('confirmation')
    .equals('DELETE_MY_ACCOUNT')
    .withMessage('You must type "DELETE_MY_ACCOUNT" to confirm deletion'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deletion reason cannot exceed 500 characters')
];

/**
 * Validation for suspicious activity reporting
 */
export const validateSuspiciousActivity = [
  body('type')
    .isIn([
      'spam',
      'fraud',
      'harassment',
      'fake_products',
      'price_manipulation',
      'identity_theft',
      'other'
    ])
    .withMessage('Invalid activity type'),
  
  body('targetId')
    .notEmpty()
    .withMessage('Target ID is required')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ObjectId'),
  
  body('targetType')
    .isIn(['User', 'Product', 'Order', 'Review', 'Message'])
    .withMessage('Invalid target type'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('evidence')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 evidence items allowed')
    .custom((evidence: string[]) => {
      if (evidence) {
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|pdf)(\?.*)?$/i;
        const invalidUrls = evidence.filter(url => !urlRegex.test(url));
        if (invalidUrls.length > 0) {
          throw new Error('Evidence must be valid URLs to images or PDF files');
        }
      }
      return true;
    })
];

/**
 * Validation for IP whitelist management
 */
export const validateIpWhitelist = [
  body('ipAddresses')
    .isArray({ min: 1, max: 100 })
    .withMessage('IP addresses must be an array with 1-100 items')
    .custom((ips: string[]) => {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
      const invalidIps = ips.filter(ip => !ipRegex.test(ip));
      if (invalidIps.length > 0) {
        throw new Error(`Invalid IP addresses or CIDR blocks: ${invalidIps.join(', ')}`);
      }
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

/**
 * Validation for security audit log queries
 */
export const validateSecurityAuditQuery = [
  query('eventType')
    .optional()
    .isIn([
      'login_success',
      'login_failure',
      'password_change',
      'password_reset',
      'account_locked',
      'account_unlocked',
      'permission_change',
      'suspicious_activity',
      'data_export',
      'data_deletion'
    ])
    .withMessage('Invalid event type'),
  
  query('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be low, medium, high, or critical'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  query('ipAddress')
    .optional()
    .isIP()
    .withMessage('IP address must be valid'),
  
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
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];