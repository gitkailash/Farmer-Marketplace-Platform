import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';

// Enhanced rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs?: number, max?: number) => {
  // In development, use much more lenient rate limits
  const isDevelopment = config.NODE_ENV === 'development';
  const isTest = config.NODE_ENV === 'test';
  
  return rateLimit({
    windowMs: windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: (isDevelopment || isTest) ? (max ? max * 100 : config.RATE_LIMIT_MAX_REQUESTS * 100) : (max || config.RATE_LIMIT_MAX_REQUESTS),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests in production
    skipSuccessfulRequests: config.NODE_ENV === 'production',
    // Custom key generator for more granular control
    keyGenerator: (req) => {
      return req.ip + ':' + (req.user?.userId || 'anonymous');
    }
  });
};

// Strict rate limiting for authentication endpoints
const authRateLimiter = createRateLimiter(900000, 5); // 5 requests per 15 minutes (5000 in development/test)
const apiRateLimiter = createRateLimiter(); // Default limits (100x in development/test)
const strictRateLimiter = createRateLimiter(300000, 10); // 10 requests per 5 minutes (10000 in development/test)

// CORS configuration - Allow all origins
const corsOptions: cors.CorsOptions = {
  origin: true,  // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  maxAge: 86400, // 24 hours
};

// Security headers middleware
const securityHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS header for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Request sanitization middleware
const sanitizeRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Remove potentially dangerous characters from query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  
  next();
};

// IP whitelist middleware for admin endpoints
const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (config.NODE_ENV === 'development') {
      return next(); // Skip in development
    }
    
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP as string)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

// Apply middleware to Express app
export const applyMiddleware = (app: express.Application): void => {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Security headers
  app.use(securityHeaders);
  
  // Enhanced Helmet configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://unpkg.com",
          "https://fonts.googleapis.com"
        ],
        scriptSrc: [
          "'self'", 
          config.NODE_ENV === 'development' ? "'unsafe-inline'" : "'self'",
          "https://unpkg.com"
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS middleware
  app.use(cors(corsOptions));

  // Request sanitization
  app.use(sanitizeRequest);

  // Compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Logging middleware with security considerations
  if (config.NODE_ENV !== 'test') {
    const logFormat = config.NODE_ENV === 'production' 
      ? 'combined' 
      : 'dev';
    
    app.use(morgan(logFormat, {
      skip: (req, res) => {
        // Skip logging for health checks and static assets
        return req.url === '/health' || req.url.startsWith('/static');
      }
    }));
  }

  // Rate limiting with different limits for different endpoints
  app.use('/api/auth', authRateLimiter);
  app.use('/api/admin', strictRateLimiter);
  app.use('/api/', apiRateLimiter);

  // Body parsing middleware with size limits
  app.use(express.json({ 
    limit: config.MAX_FILE_SIZE ? `${config.MAX_FILE_SIZE}b` : '5mb',
    verify: (req, res, buf) => {
      // Verify JSON payload
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON payload');
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.MAX_FILE_SIZE ? `${config.MAX_FILE_SIZE}b` : '5mb'
  }));

  // Health check endpoint (before other routes)
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  });
};

// Export rate limiters for use in specific routes
export { 
  authRateLimiter, 
  apiRateLimiter, 
  strictRateLimiter, 
  ipWhitelist 
};