import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt';
import { UserRole } from '../models/User';
import { config } from '../config/environment';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      sessionId?: string;
    }
  }
}

// Authentication error class
export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Authorization error class
export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Simple in-memory blacklist for revoked tokens (in production, use Redis)
const tokenBlacklist = new Set<string>();

// Session tracking for security monitoring
const activeSessions = new Map<string, {
  userId: string;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}>();

/**
 * Add token to blacklist
 */
export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  
  // Clean up old tokens periodically (simple cleanup)
  if (tokenBlacklist.size > 10000) {
    const tokensArray = Array.from(tokenBlacklist);
    const toRemove = tokensArray.slice(0, 5000);
    toRemove.forEach(t => tokenBlacklist.delete(t));
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

/**
 * Enhanced authentication middleware - verifies JWT token with additional security checks
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract token from Authorization header
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);
    
    // Additional security checks
    const now = Math.floor(Date.now() / 1000);
    
    // Check token expiration with buffer
    if (decoded.exp && decoded.exp < now) {
      throw new AuthenticationError('Token has expired');
    }
    
    // Check if token was issued too far in the past (prevent replay attacks)
    if (decoded.iat && (now - decoded.iat) > 7 * 24 * 60 * 60) { // 7 days
      throw new AuthenticationError('Token is too old');
    }

    // Track session for security monitoring
    const sessionId = `${decoded.userId}-${req.ip}-${Date.now()}`;
    req.sessionId = sessionId;
    
    activeSessions.set(sessionId, {
      userId: decoded.userId,
      lastActivity: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    // Attach user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    // Log authentication failures for security monitoring
    console.warn('Authentication failed:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'AUTHENTICATION_FAILED'
      });
    } else {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
        code: 'AUTHENTICATION_FAILED'
      });
    }
  }
};

/**
 * Optional authentication middleware - verifies token if present
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token && !isTokenBlacklisted(token)) {
      const decoded = JWTUtils.verifyToken(token);
      
      // Basic expiration check for optional auth
      const now = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp >= now) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    // but don't attach user data
    next();
  }
};

/**
 * Role-based authorization middleware factory
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        // Log authorization failures
        console.warn('Authorization failed:', {
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          ip: req.ip,
          path: req.path
        });
        
        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'AUTHENTICATION_REQUIRED'
        });
      } else if (error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Authorization check failed',
          code: 'AUTHORIZATION_ERROR'
        });
      }
    }
  };
};

/**
 * Enhanced resource ownership middleware factory
 * Checks if the authenticated user owns the resource or is an admin
 */
export const requireOwnership = (getResourceOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const resourceOwnerId = getResourceOwnerId(req);
      const isOwner = req.user.userId === resourceOwnerId;
      const isAdmin = req.user.role === UserRole.ADMIN;

      if (!isOwner && !isAdmin) {
        // Log ownership violations
        console.warn('Ownership violation:', {
          userId: req.user.userId,
          resourceOwnerId,
          ip: req.ip,
          path: req.path
        });
        
        throw new AuthorizationError('Access denied. You can only access your own resources');
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'AUTHENTICATION_REQUIRED'
        });
      } else if (error instanceof AuthorizationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Ownership check failed',
          code: 'AUTHORIZATION_ERROR'
        });
      }
    }
  };
};

/**
 * Logout middleware - blacklists the current token
 */
export const logout = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      blacklistToken(token);
    }
    
    // Clean up session
    if (req.sessionId) {
      activeSessions.delete(req.sessionId);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Security monitoring endpoint (admin only)
 */
export const getSecurityStats = (req: Request, res: Response): void => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }

  const stats = {
    blacklistedTokens: tokenBlacklist.size,
    activeSessions: activeSessions.size,
    recentSessions: Array.from(activeSessions.values())
      .filter(session => Date.now() - session.lastActivity.getTime() < 3600000) // Last hour
      .length
  };

  res.json({
    success: true,
    data: stats
  });
};

/**
 * Role-based authorization middleware factory (alternative syntax)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return authorize(...allowedRoles);
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * Farmer-only authorization middleware
 */
export const requireFarmer = authorize(UserRole.FARMER);

/**
 * Buyer-only authorization middleware
 */
export const requireBuyer = authorize(UserRole.BUYER);

/**
 * Authenticated user authorization (any logged-in user)
 */
export const requireAuth = authorize(UserRole.ADMIN, UserRole.FARMER, UserRole.BUYER);

/**
 * Farmer or Admin authorization middleware
 */
export const requireFarmerOrAdmin = authorize(UserRole.FARMER, UserRole.ADMIN);

/**
 * Buyer or Admin authorization middleware
 */
export const requireBuyerOrAdmin = authorize(UserRole.BUYER, UserRole.ADMIN);