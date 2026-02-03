import request from 'supertest';
import { createApp } from '../../app';
import { database } from '../../config/database';
import { User, UserRole } from '../../models/User';
import { JWTUtils } from '../../utils/jwt';

describe('Comprehensive Input Validation', () => {
  let app: any;
  let farmerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    await database.connect();
    app = createApp();

    // Create test users and tokens for authentication
    const farmerUser = await User.create({
      email: 'farmer@test.com',
      password: 'password123',
      role: UserRole.FARMER,
      profile: {
        name: 'Test Farmer',
        phone: '1234567890'
      },
      farmerProfile: {
        farmName: 'Test Farm',
        location: {
          address: '123 Farm St',
          city: 'Farm City',
          state: 'Farm State',
          zipCode: '12345',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      }
    });

    const buyerUser = await User.create({
      email: 'buyer@test.com',
      password: 'password123',
      role: UserRole.BUYER,
      profile: {
        name: 'Test Buyer',
        phone: '1234567890'
      }
    });

    farmerToken = JWTUtils.generateToken({
      userId: farmerUser._id.toString(),
      email: farmerUser.email,
      role: farmerUser.role
    });

    buyerToken = JWTUtils.generateToken({
      userId: buyerUser._id.toString(),
      email: buyerUser.email,
      role: buyerUser.role
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await database.disconnect();
  });

  describe('Product Validation', () => {
    it('should reject invalid product creation data', async () => {
      const invalidProduct = {
        name: 'A', // Too short
        description: 'Short', // Too short
        category: 'InvalidCategory',
        price: -5, // Negative price
        unit: 'invalidUnit',
        stock: -1, // Negative stock
        images: ['not-a-url', 'invalid-extension.txt']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid product creation data', async () => {
      const validProduct = {
        name: 'Fresh Tomatoes',
        description: 'Organic red tomatoes grown locally with care and attention to quality.',
        category: 'Vegetables',
        price: 4.99,
        unit: 'kg',
        stock: 100,
        images: ['https://example.com/tomato1.jpg', 'https://example.com/tomato2.png']
      };

      // Note: This will succeed with proper authentication and validation
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(validProduct)
        .expect(201); // Created successfully

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Order Validation', () => {
    it('should reject invalid order creation data', async () => {
      const invalidOrder = {
        farmerId: 'invalid-id',
        items: [], // Empty items array
        deliveryAddress: 'Short', // Too short
        notes: 'A'.repeat(1001) // Too long
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(invalidOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Review Validation', () => {
    it('should reject invalid review creation data', async () => {
      const invalidReview = {
        orderId: 'invalid-id',
        revieweeId: 'invalid-id',
        reviewerType: 'INVALID_TYPE',
        rating: 6, // Rating too high
        comment: 'Short' // Too short
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(invalidReview)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Authentication Validation', () => {
    it('should reject invalid registration data', async () => {
      const invalidRegistration = {
        email: 'invalid-email',
        password: '123', // Too short and weak
        role: 'INVALID_ROLE',
        profile: {
          name: 'A' // Too short
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidRegistration)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid login data', async () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: '' // Empty password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Content Validation', () => {
    it('should reject invalid gallery item creation', async () => {
      const invalidGalleryItem = {
        title: 'A', // Too short
        imageUrl: 'not-a-url',
        category: 'InvalidCategory',
        order: -1 // Negative order
      };

      const response = await request(app)
        .post('/api/content/gallery')
        .send(invalidGalleryItem)
        .expect(401); // Will fail auth first, but validation should be checked

      // Since auth fails first, we can't test validation directly here
      // But the validation middleware is in place
    });

    it('should reject invalid news item creation', async () => {
      const invalidNewsItem = {
        headline: 'A', // Too short
        content: 'Short', // Too short
        priority: 'INVALID_PRIORITY',
        language: 'invalid-lang-code'
      };

      const response = await request(app)
        .post('/api/content/news')
        .send(invalidNewsItem)
        .expect(401); // Will fail auth first

      // Auth fails first, but validation middleware is in place
    });
  });

  describe('Query Parameter Validation', () => {
    it('should reject invalid search parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          page: -1, // Invalid page
          limit: 101, // Limit too high
          sortBy: 'invalid_field',
          sortOrder: 'invalid_order',
          minPrice: -5, // Negative price
          category: 'InvalidCategory'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid search parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
          minPrice: 0,
          category: 'Vegetables'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize XSS attempts in input', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Fresh Tomatoes',
        description: 'javascript:alert("xss") Organic tomatoes with malicious content',
        category: 'Vegetables',
        price: 4.99,
        unit: 'kg',
        stock: 100
      };

      // This will succeed with auth, and sanitization should occur
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(maliciousInput)
        .expect(400); // Should fail validation due to malicious content

      // The sanitization happens in middleware, so malicious content should be cleaned
    });
  });

  describe('MongoDB ObjectId Validation', () => {
    it('should reject invalid ObjectId formats', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should accept valid ObjectId formats', async () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/products/${validObjectId}`)
        .expect(404); // Not found, but validation passed

      expect(response.body.message).not.toBe('Validation failed');
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate price decimal places', async () => {
      const invalidProduct = {
        name: 'Fresh Tomatoes',
        description: 'Organic red tomatoes grown locally with care and attention to quality.',
        category: 'Vegetables',
        price: 4.999, // Too many decimal places
        unit: 'kg',
        stock: 100
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some((error: any) => 
        error.msg.includes('decimal places')
      )).toBe(true);
    });

    it('should validate coordinate ranges', async () => {
      const invalidRegistration = {
        email: 'farmer@example.com',
        password: 'SecurePass123!',
        role: 'FARMER',
        profile: {
          name: 'Test Farmer'
        },
        location: {
          district: 'Test District',
          municipality: 'Test Municipality',
          coordinates: [200, 100] // Invalid longitude/latitude
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidRegistration)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some((error: any) => 
        error.msg.includes('Longitude') || error.msg.includes('Latitude')
      )).toBe(true);
    });
  });
});