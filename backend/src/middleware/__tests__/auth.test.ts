import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requireAdmin, requireFarmer, requireBuyer, requireAuth } from '../auth';
import { JWTUtils } from '../../utils/jwt';
import { UserRole } from '../../models/User';

// Mock JWT Utils
jest.mock('../../utils/jwt');
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test'
    } as Partial<Request>;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token', () => {
      const mockPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: UserRole.BUYER,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) + 3600  // 1 hour from now
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      mockRequest.ip = '127.0.0.1';
      mockRequest.path = '/test';

      mockJWTUtils.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJWTUtils.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      mockRequest.ip = '127.0.0.1';
      mockRequest.path = '/test';
      
      mockJWTUtils.extractTokenFromHeader.mockReturnValue(null);

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
        code: 'AUTHENTICATION_FAILED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      mockRequest.ip = '127.0.0.1';
      mockRequest.path = '/test';

      mockJWTUtils.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        code: 'AUTHENTICATION_FAILED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    const mockUser = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: UserRole.BUYER,
      iat: 1234567890,
      exp: 1234567890
    };

    it('should allow access for authorized role', () => {
      mockRequest.user = mockUser;
      
      const middleware = authorize(UserRole.BUYER, UserRole.FARMER);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      mockRequest.user = mockUser;
      
      const middleware = authorize(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: ADMIN',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      // No user attached to request
      
      const middleware = authorize(UserRole.BUYER);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('role-specific middleware', () => {
    it('requireAdmin should allow admin access', () => {
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        iat: 1234567890,
        exp: 1234567890
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('requireFarmer should allow farmer access', () => {
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'farmer@example.com',
        role: UserRole.FARMER,
        iat: 1234567890,
        exp: 1234567890
      };

      requireFarmer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('requireBuyer should allow buyer access', () => {
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'buyer@example.com',
        role: UserRole.BUYER,
        iat: 1234567890,
        exp: 1234567890
      };

      requireBuyer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('requireAuth should allow any authenticated user', () => {
      const roles = [UserRole.ADMIN, UserRole.FARMER, UserRole.BUYER];
      
      roles.forEach(role => {
        jest.clearAllMocks();
        
        mockRequest.user = {
          userId: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          role: role,
          iat: 1234567890,
          exp: 1234567890
        };

        requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });

    it('should deny access for wrong role', () => {
      mockRequest.user = {
        userId: '507f1f77bcf86cd799439011',
        email: 'buyer@example.com',
        role: UserRole.BUYER,
        iat: 1234567890,
        exp: 1234567890
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});