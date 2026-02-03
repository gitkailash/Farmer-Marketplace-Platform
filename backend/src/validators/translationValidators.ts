import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Validation middleware for updating translation data (no key/namespace validation)
 */
export const validateUpdateTranslationData = [
  body('translations.en')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('English translation must be a non-empty string'),
  
  body('translations.ne')
    .optional()
    .isString()
    .withMessage('Nepali translation must be a string'),
  
  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string'),
  
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for translation data
 */
export const validateTranslationData = [
  body('key')
    .isString()
    .matches(/^[a-z][a-zA-Z0-9_]*(\.[a-z][a-zA-Z0-9_]*)*$/)
    .withMessage('Translation key must follow dot notation format (lowercase start, alphanumeric, underscores, camelCase allowed)')
    .custom((value) => {
      console.log('🔍 Validating key:', value);
      const regex = /^[a-z][a-zA-Z0-9_]*(\.[a-z][a-zA-Z0-9_]*)*$/;
      const isValid = regex.test(value);
      console.log('🔍 Validation result:', isValid);
      if (!isValid) {
        throw new Error('Translation key must follow dot notation format (lowercase start, alphanumeric, underscores, camelCase allowed)');
      }
      return true;
    }),
  
  body('namespace')
    .isString()
    .isIn(['common', 'auth', 'products', 'admin', 'navigation', 'forms', 'errors', 'messages', 'notifications', 'gallery', 'news', 'reviews', 'orders', 'dashboard', 'buyer', 'farmer', 'home'])
    .withMessage('Namespace must be one of: common, auth, products, admin, navigation, forms, errors, messages, notifications, gallery, news, reviews, orders, dashboard, buyer, farmer, home'),
  
  body('translations.en')
    .isString()
    .notEmpty()
    .withMessage('English translation is required'),
  
  body('translations.ne')
    .optional()
    .isString()
    .withMessage('Nepali translation must be a string'),
  
  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string'),
  
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for content data
 */
export const validateContentData = [
  body('en.title')
    .isString()
    .notEmpty()
    .withMessage('English title is required'),
  
  body('en.description')
    .isString()
    .notEmpty()
    .withMessage('English description is required'),
  
  body('en.body')
    .optional()
    .isString()
    .withMessage('English body must be a string'),
  
  body('ne.title')
    .optional()
    .isString()
    .withMessage('Nepali title must be a string'),
  
  body('ne.description')
    .optional()
    .isString()
    .withMessage('Nepali description must be a string'),
  
  body('ne.body')
    .optional()
    .isString()
    .withMessage('Nepali body must be a string'),
  
  body('metadata.type')
    .isString()
    .isIn(['product', 'news', 'gallery', 'message', 'mayor'])
    .withMessage('Content type must be one of: product, news, gallery, message, mayor'),
  
  body('metadata.priority')
    .optional()
    .isString()
    .isIn(['LOW', 'NORMAL', 'HIGH'])
    .withMessage('Priority must be one of: LOW, NORMAL, HIGH'),
  
  body('metadata.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for search queries
 */
export const validateSearchQuery = [
  body('language')
    .optional()
    .isString()
    .isIn(['en', 'ne', 'both'])
    .withMessage('Language must be one of: en, ne, both'),
  
  body('contentType')
    .optional()
    .isString()
    .isIn(['product', 'news', 'gallery', 'mayor'])
    .withMessage('Content type must be one of: product, news, gallery, mayor'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for language parameter
 */
export const validateLanguage = (req: Request, res: Response, next: NextFunction): void => {
  const { language } = req.query;
  
  if (language && language !== 'en' && language !== 'ne') {
    res.status(400).json({
      success: false,
      error: 'Language parameter must be "en" or "ne"'
    });
    return;
  }
  
  next();
};

/**
 * Validation middleware for namespace parameter
 */
export const validateNamespace = (req: Request, res: Response, next: NextFunction): void => {
  const { namespace } = req.query;
  const validNamespaces = ['common', 'auth', 'products', 'admin', 'navigation', 'forms', 'errors', 'messages', 'notifications', 'gallery', 'news', 'reviews', 'orders', 'dashboard', 'buyer', 'farmer', 'home'];
  
  if (namespace && !validNamespaces.includes(namespace as string)) {
    res.status(400).json({
      success: false,
      error: `Namespace must be one of: ${validNamespaces.join(', ')}`
    });
    return;
  }
  
  next();
};