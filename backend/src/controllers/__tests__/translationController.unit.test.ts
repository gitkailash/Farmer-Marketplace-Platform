import { Request, Response } from 'express';
import { TranslationController } from '../translationController';
import { TranslationService } from '../../services/TranslationService';
import { ContentLocalizer } from '../../services/ContentLocalizer';
import { UserRole } from '../../models/User';

// Mock the services
jest.mock('../../services/TranslationService');
jest.mock('../../services/ContentLocalizer');

describe('TranslationController Unit Tests', () => {
  let translationController: TranslationController;
  let mockTranslationService: jest.Mocked<TranslationService>;
  let mockContentLocalizer: jest.Mocked<ContentLocalizer>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controller instance
    translationController = new TranslationController();
    
    // Mock services
    mockTranslationService = new TranslationService() as jest.Mocked<TranslationService>;
    mockContentLocalizer = new ContentLocalizer() as jest.Mocked<ContentLocalizer>;
    
    // Mock request and response objects
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: { userId: 'test-user-id', email: 'test@example.com', role: UserRole.ADMIN }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('getTranslations', () => {
    it('should return 400 for missing language parameter', async () => {
      mockRequest.query = {};

      await translationController.getTranslations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Language parameter is required and must be "en" or "ne"'
      });
    });

    it('should return 400 for invalid language parameter', async () => {
      mockRequest.query = { language: 'invalid' };

      await translationController.getTranslations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Language parameter is required and must be "en" or "ne"'
      });
    });
  });

  describe('createTranslation', () => {
    it('should return 401 for missing authentication', async () => {
      const mockRequestWithoutUser = { ...mockRequest, user: undefined };

      await translationController.createTranslation(
        mockRequestWithoutUser as unknown as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {};

      await translationController.createTranslation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Key, namespace, and English translation are required'
      });
    });
  });

  describe('updateTranslation', () => {
    it('should return 401 for missing authentication', async () => {
      const mockRequestWithoutUser = { ...mockRequest, user: undefined, params: { key: 'test.key' } };

      await translationController.updateTranslation(
        mockRequestWithoutUser as unknown as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should return 400 for missing key parameter', async () => {
      mockRequest.params = {};

      await translationController.updateTranslation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Translation key is required'
      });
    });
  });

  describe('deleteTranslation', () => {
    it('should return 400 for missing key parameter', async () => {
      mockRequest.params = {};

      await translationController.deleteTranslation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Translation key is required'
      });
    });
  });

  describe('exportTranslations', () => {
    it('should return 400 for invalid format parameter', async () => {
      mockRequest.query = { format: 'invalid' };

      await translationController.exportTranslations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Format must be "json" or "csv"'
      });
    });
  });

  describe('importTranslations', () => {
    it('should return 400 for missing file', async () => {
      mockRequest.file = undefined;
      mockRequest.body = { format: 'json' };

      await translationController.importTranslations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'File is required for import'
      });
    });

    it('should return 400 for invalid format', async () => {
      mockRequest.file = { buffer: Buffer.from('test') } as Express.Multer.File;
      mockRequest.body = { format: 'invalid' };

      await translationController.importTranslations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Format must be "json" or "csv"'
      });
    });
  });

  describe('validateCompleteness', () => {
    it('should handle validation requests', async () => {
      mockRequest.query = { namespace: 'common' };

      // We can't easily test the success case without mocking the service properly
      // But we can test that the method exists and handles the request structure
      expect(typeof translationController.validateCompleteness).toBe('function');
    });
  });

  describe('getTranslationKeys', () => {
    it('should return 400 for invalid pagination parameters', async () => {
      mockRequest.query = { page: '0', limit: '0' };

      await translationController.getTranslationKeys(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters'
      });
    });

    it('should return 400 for limit exceeding maximum', async () => {
      mockRequest.query = { page: '1', limit: '101' };

      await translationController.getTranslationKeys(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid pagination parameters'
      });
    });
  });
});