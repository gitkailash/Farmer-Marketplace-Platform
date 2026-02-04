import { body, ValidationChain } from 'express-validator';
import { NewsPriority } from '../models/News';

// =============================================================================
// GALLERY ITEM VALIDATORS
// =============================================================================

/**
 * Validation rules for creating a gallery item
 */
export const validateGalleryItem: ValidationChain[] = [
  body('title')
    .isObject()
    .withMessage('Title must be a multilingual object'),
  
  body('title.en')
    .trim()
    .notEmpty()
    .withMessage('English title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('English title must be between 2 and 200 characters'),
  
  body('title.ne')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nepali title must be between 2 and 200 characters if provided'),

  body('description')
    .optional()
    .isObject()
    .withMessage('Description must be a multilingual object if provided'),
  
  body('description.en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('English description must be between 5 and 1000 characters if provided'),
  
  body('description.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Nepali description must be between 5 and 1000 characters if provided'),

  body('imageUrl')
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    .withMessage('Image URL must end with jpg, jpeg, png, gif, or webp'),

  body('category')
    .isObject()
    .withMessage('Category must be a multilingual object'),
  
  body('category.en')
    .trim()
    .notEmpty()
    .withMessage('English category is required')
    .isIn([
      'Featured Products',
      'Farm Life',
      'Community Events',
      'Seasonal Highlights',
      'Success Stories',
      'Educational',
      'Other'
    ])
    .withMessage('English category must be a valid category'),
  
  body('category.ne')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nepali category must be between 1 and 100 characters if provided'),

  body('order')
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage('Order must be a number between 0 and 9999'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value')
];

/**
 * Validation rules for updating a gallery item
 */
export const validateGalleryUpdate: ValidationChain[] = [
  body('title')
    .optional()
    .isObject()
    .withMessage('Title must be a multilingual object'),
  
  body('title.en')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('English title must be between 2 and 200 characters'),
  
  body('title.ne')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nepali title must be between 2 and 200 characters if provided'),

  body('description')
    .optional()
    .isObject()
    .withMessage('Description must be a multilingual object if provided'),
  
  body('description.en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('English description must be between 5 and 1000 characters if provided'),
  
  body('description.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Nepali description must be between 5 and 1000 characters if provided'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    .withMessage('Image URL must end with jpg, jpeg, png, gif, or webp'),

  body('category')
    .optional()
    .isObject()
    .withMessage('Category must be a multilingual object'),
  
  body('category.en')
    .optional()
    .trim()
    .isIn([
      'Featured Products',
      'Farm Life',
      'Community Events',
      'Seasonal Highlights',
      'Success Stories',
      'Educational',
      'Other'
    ])
    .withMessage('English category must be a valid category'),
  
  body('category.ne')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nepali category must be between 1 and 100 characters if provided'),

  body('order')
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage('Order must be a number between 0 and 9999'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value')
];

// =============================================================================
// MAYOR MESSAGE VALIDATORS
// =============================================================================

/**
 * Validation rules for creating a mayor message
 */
export const validateMayorMessage: ValidationChain[] = [
  body('text')
    .isObject()
    .withMessage('Text must be a multilingual object'),
  
  body('text.en')
    .trim()
    .notEmpty()
    .withMessage('English text is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('English text must be between 5 and 1000 characters'),
  
  body('text.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Nepali text must be between 5 and 1000 characters if provided'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    .withMessage('Image URL must end with jpg, jpeg, png, gif, or webp'),

  body('scrollSpeed')
    .optional()
    .isFloat({ min: 10, max: 500 })
    .withMessage('Scroll speed must be between 10 and 500 pixels per second'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value')
];

/**
 * Validation rules for updating a mayor message
 */
export const validateMayorUpdate: ValidationChain[] = [
  body('text')
    .optional()
    .isObject()
    .withMessage('Text must be a multilingual object'),
  
  body('text.en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('English text must be between 5 and 1000 characters'),
  
  body('text.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Nepali text must be between 5 and 1000 characters if provided'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    .withMessage('Image URL must end with jpg, jpeg, png, gif, or webp'),

  body('scrollSpeed')
    .optional()
    .isFloat({ min: 10, max: 500 })
    .withMessage('Scroll speed must be between 10 and 500 pixels per second'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value')
];

// =============================================================================
// NEWS ITEM VALIDATORS
// =============================================================================

/**
 * Validation rules for creating a news item
 */
export const validateNewsItem: ValidationChain[] = [
  body('headline')
    .isObject()
    .withMessage('Headline must be a multilingual object'),
  
  body('headline.en')
    .trim()
    .notEmpty()
    .withMessage('English headline is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('English headline must be between 5 and 200 characters'),
  
  body('headline.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Nepali headline must be between 5 and 200 characters if provided'),

  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a multilingual object if provided'),
  
  body('content.en')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('English content must be between 10 and 5000 characters if provided'),
  
  body('content.ne')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Nepali content must be between 10 and 5000 characters if provided'),

  body('summary')
    .optional()
    .isObject()
    .withMessage('Summary must be a multilingual object if provided'),
  
  body('summary.en')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('English summary must be between 10 and 500 characters if provided'),
  
  body('summary.ne')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Nepali summary must be between 10 and 500 characters if provided'),

  body('link')
    .optional()
    .trim()
    .isURL()
    .withMessage('Link must be a valid URL'),

  body('priority')
    .optional()
    .isIn(Object.values(NewsPriority))
    .withMessage('Priority must be LOW, NORMAL, or HIGH'),

  body('language')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['en', 'ne'])
    .withMessage('Language must be either "en" (English) or "ne" (Nepali)'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),

  body('publishedAt')
    .optional()
    .isISO8601()
    .withMessage('Published date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (date > oneYearFromNow) {
        throw new Error('Published date cannot be more than 1 year in the future');
      }
      
      return true;
    })
];

/**
 * Validation rules for updating a news item
 */
export const validateNewsUpdate: ValidationChain[] = [
  body('headline')
    .optional()
    .isObject()
    .withMessage('Headline must be a multilingual object'),
  
  body('headline.en')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('English headline must be between 5 and 200 characters'),
  
  body('headline.ne')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Nepali headline must be between 5 and 200 characters if provided'),

  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a multilingual object if provided'),
  
  body('content.en')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('English content must be between 10 and 5000 characters if provided'),
  
  body('content.ne')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Nepali content must be between 10 and 5000 characters if provided'),

  body('summary')
    .optional()
    .isObject()
    .withMessage('Summary must be a multilingual object if provided'),
  
  body('summary.en')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('English summary must be between 10 and 500 characters if provided'),
  
  body('summary.ne')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Nepali summary must be between 10 and 500 characters if provided'),

  body('link')
    .optional()
    .trim()
    .isURL()
    .withMessage('Link must be a valid URL'),

  body('priority')
    .optional()
    .isIn(Object.values(NewsPriority))
    .withMessage('Priority must be LOW, NORMAL, or HIGH'),

  body('language')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['en', 'ne'])
    .withMessage('Language must be either "en" (English) or "ne" (Nepali)'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value'),

  body('publishedAt')
    .optional()
    .isISO8601()
    .withMessage('Published date must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (date > oneYearFromNow) {
        throw new Error('Published date cannot be more than 1 year in the future');
      }
      
      return true;
    })
];