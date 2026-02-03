import request from 'supertest';
import { createApp } from '../../app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../../test/setup';
import { User, UserRole, Farmer, Product, Order, Review } from '../../models';
import { JWTUtils } from '../../utils/jwt';

const app = createApp();

describe('Admin Controller', () => {
  let adminToken: string;
  let adminUserId: string;
  let testUserId: string;
  let testFarmerId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up database
    await clearTestDatabase();

    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
      profile: {
        name: 'Admin User'
      }
    });
    await adminUser.save();
    adminUserId = adminUser._id.toString();

    // Generate admin token
    adminToken = JWTUtils.generateToken({
      userId: adminUserId,
      email: adminUser.email,
      role: adminUser.role
    });

    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.FARMER,
      profile: {
        name: 'Test Farmer'
      }
    });
    await testUser.save();
    testUserId = testUser._id.toString();

    // Create farmer profile
    const farmer = new Farmer({
      userId: testUser._id,
      location: {
        district: 'Test District',
        municipality: 'Test Municipality'
      }
    });
    await farmer.save();
    testFarmerId = farmer._id.toString();
  });

  describe('GET /api/admin/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // admin + test user
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=FARMER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe(UserRole.FARMER);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Farmer')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].profile.name).toContain('Farmer');
    });

    it('should require admin role', async () => {
      // Create non-admin token
      const userToken = JWTUtils.generateToken({
        userId: testUserId,
        email: 'test@example.com',
        role: UserRole.FARMER
      });

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user by id with statistics', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUserId);
      expect(response.body.data.farmerProfile).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user profile', async () => {
      const updateData = {
        profile: {
          name: 'Updated Name',
          phone: '+1234567890'
        }
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.name).toBe('Updated Name');
      expect(response.body.data.profile.phone).toBe('+1234567890');
    });

    it('should prevent admin from changing their own role', async () => {
      const updateData = {
        role: UserRole.FARMER
      };

      await request(app)
        .put(`/api/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user and related data', async () => {
      await request(app)
        .delete(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is deleted
      const user = await User.findById(testUserId);
      expect(user).toBeNull();

      // Verify farmer profile is deleted
      const farmer = await Farmer.findById(testFarmerId);
      expect(farmer).toBeNull();
    });

    it('should prevent admin from deleting themselves', async () => {
      await request(app)
        .delete(`/api/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/admin/analytics', () => {
    beforeEach(async () => {
      // Create some test data for analytics
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test Description',
        category: 'Vegetables',
        price: 10,
        unit: 'kg',
        stock: 100,
        status: 'PUBLISHED'
      });
      await product.save();

      const order = new Order({
        buyerId: adminUserId, // Using admin as buyer for simplicity
        farmerId: testFarmerId,
        items: [{
          productId: product._id,
          quantity: 2,
          priceAtTime: 10,
          subtotal: 20
        }],
        totalAmount: 20,
        status: 'COMPLETED',
        deliveryAddress: 'Test Address'
      });
      await order.save();
    });

    it('should get analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.users.total).toBe(2);
      expect(response.body.data.overview.products.total).toBe(1);
      expect(response.body.data.overview.orders.total).toBe(1);
    });

    it('should filter analytics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
    });
  });

  describe('GET /api/admin/moderation', () => {
    beforeEach(async () => {
      // Create test product and order first
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test Description',
        category: 'Vegetables',
        price: 10,
        unit: 'kg',
        stock: 100,
        status: 'PUBLISHED'
      });
      await product.save();

      const order = new Order({
        buyerId: adminUserId,
        farmerId: testFarmerId,
        items: [{
          productId: product._id,
          quantity: 2,
          priceAtTime: 10,
          subtotal: 20
        }],
        totalAmount: 20,
        status: 'COMPLETED',
        deliveryAddress: 'Test Address'
      });
      await order.save();

      // Create test review for moderation
      const review = new Review({
        orderId: order._id,
        reviewerId: adminUserId,
        revieweeId: testUserId,
        reviewerType: 'BUYER',
        rating: 5,
        comment: 'Great farmer!',
        isApproved: false
      });
      await review.save();
    });

    it('should get pending reviews for moderation', async () => {
      const response = await request(app)
        .get('/api/admin/moderation?type=reviews&status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('reviews');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should get products for moderation', async () => {
      // Create draft product
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Draft Product',
        description: 'Test Description',
        category: 'Vegetables',
        price: 10,
        unit: 'kg',
        stock: 100,
        status: 'DRAFT'
      });
      await product.save();

      const response = await request(app)
        .get('/api/admin/moderation?type=products&status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('products');
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should get audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/admin/analytics/export', () => {
    beforeEach(async () => {
      // Create some test data for analytics
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test Description',
        category: 'Vegetables',
        price: 10,
        unit: 'kg',
        stock: 100,
        status: 'PUBLISHED'
      });
      await product.save();
    });

    it('should export analytics data as JSON', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export analytics data as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Metric,Total,Recent');
    });
  });

  describe('GET /api/admin/audit-logs/export', () => {
    it('should export audit logs as JSON', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export audit logs as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Date,Action,Performed By');
    });
  });
});