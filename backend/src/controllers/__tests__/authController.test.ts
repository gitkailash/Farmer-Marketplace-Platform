import request from 'supertest';
import { createApp } from '../../app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../../test/setup';
import { User, UserRole, Farmer } from '../../models';

const app = createApp();

describe('Auth Controller', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    const validBuyerData = {
      email: 'buyer@example.com',
      password: 'Password123',
      role: UserRole.BUYER,
      profile: {
        name: 'Test Buyer',
        phone: '+1234567890',
        address: '123 Test Street'
      }
    };

    const validFarmerData = {
      email: 'farmer@example.com',
      password: 'Password123',
      role: UserRole.FARMER,
      profile: {
        name: 'Test Farmer',
        phone: '+1234567890'
      },
      location: {
        district: 'Test District',
        municipality: 'Test Municipality',
        coordinates: [-74.006, 40.7128] as [number, number]
      }
    };

    it('should register a buyer successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validBuyerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(validBuyerData.email);
      expect(response.body.data.user.role).toBe(UserRole.BUYER);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresIn).toBe('7d');

      // Verify user was created in database
      const user = await User.findOne({ email: validBuyerData.email });
      expect(user).toBeTruthy();
      expect(user?.role).toBe(UserRole.BUYER);
    });

    it('should register a farmer successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validFarmerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.FARMER);

      // Verify farmer profile was created
      const user = await User.findOne({ email: validFarmerData.email });
      const farmer = await Farmer.findOne({ userId: user?._id });
      expect(farmer).toBeTruthy();
      expect(farmer?.location.district).toBe(validFarmerData.location.district);
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = { ...validBuyerData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const invalidData = { ...validBuyerData, password: '123' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validBuyerData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validBuyerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should reject farmer registration without location', async () => {
      const invalidFarmerData = {
        email: 'farmer@example.com',
        password: 'Password123',
        role: UserRole.FARMER,
        profile: {
          name: 'Test Farmer'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidFarmerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((error: any) => 
        error.msg.includes('District is required for farmer registration')
      )).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123',
      role: UserRole.BUYER,
      profile: {
        name: 'Test User'
      }
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email
          // missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          role: UserRole.BUYER,
          profile: {
            name: 'Test User'
          }
        });

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          role: UserRole.BUYER,
          profile: {
            name: 'Test User'
          }
        });

      authToken = registerResponse.body.data.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(authToken); // Should be a new token
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});