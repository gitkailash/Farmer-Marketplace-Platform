import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { defaultSQLDetector, ValidationContext } from '../security/enhanced-sql-detection';

// Security validation middleware
export class SecurityMiddleware {
  
  /**
   * Enhanced SQL injection prevention middleware with context awareness
   */
  static preventSQLInjection(req: Request, res: Response, next: NextFunction): void {
    // Determine content type based on request
    const contentType = SecurityMiddleware.determineContentType(req);
    
    const context: ValidationContext = {
      contentType,
      endpoint: req.path,
      userRole: (req as any).user?.role
    };

    const checkForSQLInjection = (obj: any, fieldName?: string): boolean => {
      if (typeof obj === 'string') {
        const contextWithField = { ...context, fieldName };
        const result = defaultSQLDetector.validateContent(obj, contextWithField);
        
        // Log genuine security violations (not false positives)
        if (!result.isValid && result.confidence >= 0.8) {
          console.warn('SQL injection attempt detected:', {
            ip: req.ip,
            path: req.path,
            field: fieldName,
            threatLevel: result.threatLevel,
            confidence: result.confidence,
            violations: result.violations.map(v => ({
              type: v.type,
              description: v.description,
              confidence: v.confidence
            }))
          });
        }
        
        return !result.isValid;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).some(([key, value]) => 
          checkForSQLInjection(value, fieldName ? `${fieldName}.${key}` : key)
        );
      }
      
      return false;
    };

    // Check query parameters
    if (checkForSQLInjection(req.query, 'query')) {
      res.status(400).json({
        success: false,
        message: 'Invalid characters detected in request parameters',
        code: 'SECURITY_VIOLATION'
      });
      return;
    }

    // Check request body
    if (checkForSQLInjection(req.body, 'body')) {
      res.status(400).json({
        success: false,
        message: 'Invalid characters detected in request body',
        code: 'SECURITY_VIOLATION'
      });
      return;
    }

    next();
  }

  /**
   * Determine content type based on request characteristics
   */
  private static determineContentType(req: Request): ValidationContext['contentType'] {
    // Mayor message endpoints
    if (req.path.includes('/mayor')) {
      return 'MAYOR_MESSAGE';
    }
    
    // API endpoints with structured data
    if (req.path.startsWith('/api/') && (req.method === 'POST' || req.method === 'PUT')) {
      // Check if body looks like structured data
      if (req.body && typeof req.body === 'object') {
        return 'STRUCTURED';
      }
    }
    
    // URL or file path patterns
    if (typeof req.body === 'string' && (req.body.startsWith('http') || req.body.includes('/'))) {
      return 'URL';
    }
    
    // Default to free text for content creation endpoints
    if (req.path.includes('/content/') || req.path.includes('/products/') || req.path.includes('/reviews/')) {
      return 'FREE_TEXT';
    }
    
    return 'STRUCTURED';
  }

  /**
   * XSS prevention middleware
   */
  static preventXSS(req: Request, res: Response, next: NextFunction): void {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];

    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        let sanitized = value;
        xssPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
      }
      
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      
      return value;
    };

    // Sanitize query parameters
    req.query = sanitizeValue(req.query);
    
    // Sanitize request body
    req.body = sanitizeValue(req.body);

    next();
  }

  /**
   * File upload security middleware
   */
  static validateFileUpload(allowedTypes: string[] = []) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const defaultAllowedTypes = config.ALLOWED_FILE_TYPES.split(',');
      const allowed = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;

      // Check if request contains file uploads (URLs in this case)
      const checkFileUrls = (obj: any): boolean => {
        if (typeof obj === 'string' && obj.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
          const extension = obj.split('.').pop()?.toLowerCase();
          return allowed.some(type => type.includes(extension || ''));
        }
        
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).every(value => checkFileUrls(value));
        }
        
        return true;
      };

      if (!checkFileUrls(req.body)) {
        res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${allowed.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
        return;
      }

      next();
    };
  }

  /**
   * Request size validation middleware
   */
  static validateRequestSize(req: Request, res: Response, next: NextFunction): void {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = config.MAX_FILE_SIZE;

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: `Request too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: 'REQUEST_TOO_LARGE'
      });
      return;
    }

    next();
  }

  /**
   * Suspicious activity detection middleware
   */
  static detectSuspiciousActivity(req: Request, res: Response, next: NextFunction): void {
    // Skip security checks in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const suspiciousPatterns = [
      // Path traversal attempts
      /\.\.\//g,
      /\.\.\\\\g/g,
      // Command injection attempts (more targeted)
      /[;&|`$]/g,
      // Null byte injection
      /%00/g,
      // Script injection attempts
      /<script\b/gi,
      /javascript:/gi,
      // SQL injection patterns (more precise to avoid false positives)
      /(\bunion\s+select\b|\bselect\s+.*\s+from\b|\binsert\s+into\b|\bdelete\s+from\b|\bdrop\s+table\b)/gi
    ];

    const checkSuspiciousContent = (str: string): boolean => {
      return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    // Check URL path
    if (checkSuspiciousContent(req.path)) {
      console.warn('Suspicious path detected:', {
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent']
      });
      
      res.status(400).json({
        success: false,
        message: 'Invalid request path',
        code: 'SUSPICIOUS_ACTIVITY'
      });
      return;
    }

    // Check query parameters (but skip JSON body content)
    const queryString = JSON.stringify(req.query);
    if (checkSuspiciousContent(queryString)) {
      console.warn('Suspicious query detected:', {
        ip: req.ip,
        query: req.query,
        userAgent: req.headers['user-agent']
      });
      
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        code: 'SUSPICIOUS_ACTIVITY'
      });
      return;
    }

    next();
  }

  /**
   * API key validation middleware (for future use)
   */
  static validateApiKey(req: Request, res: Response, next: NextFunction): void {
    // Skip API key validation in development
    if (config.NODE_ENV === 'development') {
      return next();
    }

    const apiKey = req.headers['x-api-key'] as string;
    
    // For now, just check if API key is present for certain endpoints
    const protectedPaths = ['/api/admin', '/api/analytics'];
    const needsApiKey = protectedPaths.some(path => req.path.startsWith(path));

    if (needsApiKey && !apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key required',
        code: 'API_KEY_REQUIRED'
      });
      return;
    }

    next();
  }

  /**
   * Honeypot middleware - detects automated attacks
   */
  static honeypot(req: Request, res: Response, next: NextFunction): void {
    // Check for common bot/scanner patterns in User-Agent
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i
    ];

    const userAgent = req.headers['user-agent'] || '';
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));

    // Check for common attack paths
    const attackPaths = [
      '/wp-admin',
      '/admin',
      '/phpmyadmin',
      '/.env',
      '/config',
      '/backup'
    ];

    const isAttackPath = attackPaths.some(path => req.path.includes(path));

    if (isBot && isAttackPath) {
      console.warn('Potential bot attack detected:', {
        ip: req.ip,
        path: req.path,
        userAgent: userAgent
      });

      // Return fake success to waste attacker's time
      res.status(200).json({
        success: true,
        message: 'OK'
      });
      return;
    }

    next();
  }

  /**
   * Comprehensive security middleware stack
   */
  static applySecurityMiddleware(app: any): void {
    // Apply security middleware in order
    app.use(SecurityMiddleware.honeypot);
    app.use(SecurityMiddleware.detectSuspiciousActivity);
    app.use(SecurityMiddleware.validateRequestSize);
    app.use(SecurityMiddleware.preventXSS);
    app.use(SecurityMiddleware.preventSQLInjection);
    app.use(SecurityMiddleware.validateApiKey);
  }
}

export default SecurityMiddleware;