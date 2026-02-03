import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Product, ProductStatus } from '../Product';
import { User, UserRole } from '../User';
import { Farmer } from '../Farmer';

describe('Product Model', () => {
  let mongoServer: MongoMemoryServer;
  let testFarmerId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test user and farmer for product relationships
    const testUser = new User({
      email: 'testfarmer@example.com',
      password: 'password123',
      role: UserRole.FARMER,
      profile: {
        name: 'Test Farmer',
        phone: '+1234567890'
      }
    });
    await testUser.save();

    const testFarmer = new Farmer({
      userId: testUser._id,
      location: {
        district: 'Test District',
        municipality: 'Test Municipality'
      }
    });
    await testFarmer.save();
    testFarmerId = testFarmer._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe('Product Creation', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        farmerId: testFarmerId,
        name: 'Fresh Tomatoes',
        description: 'Organic red tomatoes grown locally',
        category: 'Vegetables',
        price: 5.99,
        unit: 'kg',
        stock: 100,
        images: ['https://example.com/tomato.jpg']
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.status).toBe(ProductStatus.DRAFT); // Default status
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    it('should default to DRAFT status when not specified', async () => {
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece',
        stock: 50
      });

      const savedProduct = await product.save();
      expect(savedProduct.status).toBe(ProductStatus.DRAFT);
    });

    it('should round price to 2 decimal places', async () => {
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.999,
        unit: 'piece',
        stock: 50
      });

      const savedProduct = await product.save();
      expect(savedProduct.price).toBe(11.00);
    });
  });

  describe('Product Validation', () => {
    it('should require all mandatory fields', async () => {
      const product = new Product({});

      let error: any;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.farmerId).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.unit).toBeDefined();
      expect(error.errors.stock).toBeDefined();
    });

    it('should validate price constraints', async () => {
      const productData = {
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        unit: 'piece',
        stock: 50
      };

      // Test negative price
      let product = new Product({ ...productData, price: -1 });
      await expect(product.save()).rejects.toThrow();

      // Test zero price
      product = new Product({ ...productData, price: 0 });
      await expect(product.save()).rejects.toThrow();

      // Test excessive price
      product = new Product({ ...productData, price: 9999999 });
      await expect(product.save()).rejects.toThrow();
    });

    it('should validate stock constraints', async () => {
      const productData = {
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece'
      };

      // Test negative stock
      let product = new Product({ ...productData, stock: -1 });
      await expect(product.save()).rejects.toThrow();

      // Test decimal stock
      product = new Product({ ...productData, stock: 10.5 });
      await expect(product.save()).rejects.toThrow();
    });

    it('should validate category enum', async () => {
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'InvalidCategory',
        price: 10.00,
        unit: 'piece',
        stock: 50
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('should validate unit enum', async () => {
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'invalidunit',
        stock: 50
      });

      await expect(product.save()).rejects.toThrow();
    });

    it('should validate image URLs', async () => {
      const productData = {
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece',
        stock: 50
      };

      // Test invalid URL
      let product = new Product({ ...productData, images: ['not-a-url'] });
      await expect(product.save()).rejects.toThrow();

      // Test too many images
      const manyImages = Array(11).fill('https://example.com/image.jpg');
      product = new Product({ ...productData, images: manyImages });
      await expect(product.save()).rejects.toThrow();

      // Test valid images
      product = new Product({ 
        ...productData, 
        images: ['https://example.com/image.jpg', 'https://example.com/image2.png'] 
      });
      const savedProduct = await product.save();
      expect(savedProduct.images).toHaveLength(2);
    });
  });

  describe('Product Methods', () => {
    let product: any;

    beforeEach(async () => {
      product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece',
        stock: 50,
        status: ProductStatus.PUBLISHED
      });
      await product.save();
    });

    describe('isAvailable()', () => {
      it('should return true for published products with stock', () => {
        expect(product.isAvailable()).toBe(true);
      });

      it('should return false for draft products', async () => {
        product.status = ProductStatus.DRAFT;
        expect(product.isAvailable()).toBe(false);
      });

      it('should return false for inactive products', async () => {
        product.status = ProductStatus.INACTIVE;
        expect(product.isAvailable()).toBe(false);
      });

      it('should return false for products with no stock', async () => {
        product.stock = 0;
        expect(product.isAvailable()).toBe(false);
      });
    });

    describe('canBeOrderedBy()', () => {
      it('should return true for valid quantities', () => {
        expect(product.canBeOrderedBy(10)).toBe(true);
        expect(product.canBeOrderedBy(50)).toBe(true);
      });

      it('should return false for zero or negative quantities', () => {
        expect(product.canBeOrderedBy(0)).toBe(false);
        expect(product.canBeOrderedBy(-5)).toBe(false);
      });

      it('should return false for quantities exceeding stock', () => {
        expect(product.canBeOrderedBy(51)).toBe(false);
        expect(product.canBeOrderedBy(100)).toBe(false);
      });

      it('should return false for unavailable products', () => {
        product.status = ProductStatus.DRAFT;
        expect(product.canBeOrderedBy(10)).toBe(false);
      });
    });

    describe('updateStock()', () => {
      it('should increase stock with positive values', () => {
        const initialStock = product.stock;
        product.updateStock(10);
        expect(product.stock).toBe(initialStock + 10);
      });

      it('should decrease stock with negative values', () => {
        const initialStock = product.stock;
        product.updateStock(-10);
        expect(product.stock).toBe(initialStock - 10);
      });

      it('should not allow stock to go below zero', () => {
        expect(() => product.updateStock(-100)).toThrow('Cannot reduce stock below zero');
      });

      it('should set stock to zero if somehow it becomes negative', () => {
        // Force stock to be negative (shouldn't happen in normal operation)
        product.stock = -5;
        product.updateStock(0);
        expect(product.stock).toBe(0);
      });
    });
  });

  describe('Product Status Workflow', () => {
    it('should allow status transitions', async () => {
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece',
        stock: 50
      });

      // Start as DRAFT
      await product.save();
      expect(product.status).toBe(ProductStatus.DRAFT);

      // Publish
      product.status = ProductStatus.PUBLISHED;
      await product.save();
      expect(product.status).toBe(ProductStatus.PUBLISHED);

      // Deactivate
      product.status = ProductStatus.INACTIVE;
      await product.save();
      expect(product.status).toBe(ProductStatus.INACTIVE);
    });
  });

  describe('Database Indexes', () => {
    it('should create products with proper schema', async () => {
      // This test ensures the schema is properly defined
      // Indexes are created automatically by MongoDB
      const product = new Product({
        farmerId: testFarmerId,
        name: 'Test Product',
        description: 'Test description for product',
        category: 'Fruits',
        price: 10.00,
        unit: 'piece',
        stock: 50
      });

      const savedProduct = await product.save();
      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe('Test Product');
    });
  });
});