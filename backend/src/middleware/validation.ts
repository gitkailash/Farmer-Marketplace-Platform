import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { createApiError } from './errorHandler';

/**
 * Middleware to handle express-validator validation results
 * Should be used after validation chains in routes
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    const error = createApiError(
      'Validation failed',
      400,
      true,
      validationErrors
    );
    return next(error);
  }
  
  next();
};

/**
 * Sanitization middleware to clean and normalize input data
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      // Remove potential XSS patterns and normalize whitespace
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Custom validation helper for MongoDB ObjectId arrays
 */
export const validateObjectIdArray = (value: any): boolean => {
  if (!Array.isArray(value)) {
    return false;
  }
  
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return value.every(id => typeof id === 'string' && objectIdRegex.test(id));
};

/**
 * Custom validation helper for URL arrays
 */
export const validateUrlArray = (urls: string[]): boolean => {
  if (!Array.isArray(urls)) {
    return false;
  }
  
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
  return urls.every(url => typeof url === 'string' && urlRegex.test(url));
};

/**
 * Custom validation helper for coordinate arrays [longitude, latitude]
 */
export const validateCoordinates = (coords: any): boolean => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }
  
  const [lng, lat] = coords;
  
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }
  
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

/**
 * Custom validation helper for business hours format
 */
export const validateBusinessHours = (hours: any): boolean => {
  if (!hours || typeof hours !== 'object') {
    return false;
  }
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  for (const day of days) {
    if (hours[day]) {
      const { open, close } = hours[day];
      if (!timeRegex.test(open) || !timeRegex.test(close)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Rate limiting validation for sensitive operations
 */
export const validateRateLimit = (
  maxAttempts: number,
  windowMs: number,
  keyGenerator?: (req: Request) => string
) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // In development or test, use much higher limits
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    const effectiveMaxAttempts = (isDevelopment || isTest) ? maxAttempts * 100 : maxAttempts;
    
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userAttempts.count >= effectiveMaxAttempts) {
      const error = createApiError(
        'Too many attempts. Please try again later.',
        429
      );
      return next(error);
    }
    
    userAttempts.count++;
    next();
  };
};