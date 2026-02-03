import { JWTUtils, JWTPayload } from '../jwt';
import { UserRole } from '../../models/User';

describe('JWT Utils', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: UserRole.BUYER
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWTUtils.generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { ...mockPayload, userId: '507f1f77bcf86cd799439011' };
      const payload2 = { ...mockPayload, userId: '507f1f77bcf86cd799439012' };
      
      const token1 = JWTUtils.generateToken(payload1);
      const token2 = JWTUtils.generateToken(payload2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = JWTUtils.generateToken(mockPayload);
      const decoded = JWTUtils.verifyToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => JWTUtils.verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => JWTUtils.verifyToken(malformedToken)).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const authHeader = `Bearer ${token}`;
      
      const extracted = JWTUtils.extractTokenFromHeader(authHeader);
      
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = JWTUtils.extractTokenFromHeader(undefined);
      
      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const extracted1 = JWTUtils.extractTokenFromHeader('InvalidFormat token');
      const extracted2 = JWTUtils.extractTokenFromHeader('Bearer');
      const extracted3 = JWTUtils.extractTokenFromHeader('Bearer token extra');
      
      expect(extracted1).toBeNull();
      expect(extracted2).toBeNull();
      expect(extracted3).toBeNull();
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = JWTUtils.generateToken(mockPayload);
      const expiration = JWTUtils.getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = JWTUtils.getTokenExpiration('invalid-token');
      
      expect(expiration).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = JWTUtils.generateToken(mockPayload);
      const isExpired = JWTUtils.isTokenExpired(token);
      
      expect(isExpired).toBe(false);
    });

    it('should return true for invalid token', () => {
      const isExpired = JWTUtils.isTokenExpired('invalid-token');
      
      expect(isExpired).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should generate new token with same payload', () => {
      const originalToken = JWTUtils.generateToken(mockPayload);
      
      // Wait a moment to ensure different iat
      setTimeout(() => {
        const refreshedToken = JWTUtils.refreshToken(originalToken);
        
        expect(refreshedToken).toBeDefined();
        expect(refreshedToken).not.toBe(originalToken);
        
        const originalDecoded = JWTUtils.verifyToken(originalToken);
        const refreshedDecoded = JWTUtils.verifyToken(refreshedToken);
        
        expect(refreshedDecoded.userId).toBe(originalDecoded.userId);
        expect(refreshedDecoded.email).toBe(originalDecoded.email);
        expect(refreshedDecoded.role).toBe(originalDecoded.role);
        expect(refreshedDecoded.iat).toBeGreaterThan(originalDecoded.iat!);
      }, 1000);
    });

    it('should throw error for invalid token', () => {
      expect(() => JWTUtils.refreshToken('invalid-token')).toThrow('Failed to refresh token');
    });
  });
});