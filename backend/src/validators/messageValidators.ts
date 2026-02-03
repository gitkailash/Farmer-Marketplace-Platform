import { body, param, query } from 'express-validator';
import { ModerationFlag } from '../models';

/**
 * Validation for sending a message
 */
export const validateSendMessage = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Receiver ID must be a valid MongoDB ObjectId'),
  
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
    .matches(/^[\s\S]*\S[\s\S]*$/)
    .withMessage('Message content cannot be only whitespace')
];

/**
 * Validation for moderating a message
 */
export const validateModerateMessage = [
  param('id')
    .notEmpty()
    .withMessage('Message ID is required')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId'),
  
  body('moderationFlag')
    .notEmpty()
    .withMessage('Moderation flag is required')
    .isIn(Object.values(ModerationFlag))
    .withMessage(`Moderation flag must be one of: ${Object.values(ModerationFlag).join(', ')}`)
];

/**
 * Validation for message ID parameter
 */
export const validateMessageId = [
  param('id')
    .notEmpty()
    .withMessage('Message ID is required')
    .isMongoId()
    .withMessage('Message ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for user ID parameter (for conversations)
 */
export const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for message search query parameters
 */
export const validateMessageSearch = [
  query('conversationWith')
    .optional()
    .isMongoId()
    .withMessage('Conversation partner ID must be a valid MongoDB ObjectId'),
  
  query('moderationFlag')
    .optional()
    .isIn(Object.values(ModerationFlag))
    .withMessage(`Moderation flag must be one of: ${Object.values(ModerationFlag).join(', ')}`),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt'])
    .withMessage('Sort field must be: createdAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be: asc or desc')
];