import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserRole } from '../models/User';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// JWT utility class
export class JWTUtils {
  private static readonly secret = config.JWT_SECRET;
  private static readonly expiresIn = config.JWT_EXPIRES_IN;

  /**
   * Generate JWT token for user
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload as any, this.secret, {
        expiresIn: this.expiresIn
      } as any);
    } catch (error) {
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    const token = parts[1];
    return token || null;
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }

  /**
   * Refresh token (generate new token with same payload but extended expiration)
   */
  static refreshToken(token: string): string {
    try {
      const decoded = this.verifyToken(token);
      
      // Create new payload without iat and exp
      const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      return this.generateToken(newPayload);
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }
}