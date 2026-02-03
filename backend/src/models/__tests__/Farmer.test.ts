import mongoose from 'mongoose';
import { User, UserRole } from '../User';
import { Farmer, IFarmer } from '../Farmer';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../../test/setup';

describe('Farmer Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Farmer Creation', () => {
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a user first
      const userData = {
        email: 'farmer@example.com',
        password: 'password123',
        role: UserRole.FARMER,
        profile: {
          name: 'Test Farmer'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();
      userId = savedUser._id;
    });

    it('should create a farmer with valid data', async () => {
      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality',
          coordinates: [-74.006, 40.7128] as [number, number]
        },
        isVerified: true
      };

      const farmer = new Farmer(farmerData);
      const savedFarmer = await farmer.save();

      expect(savedFarmer.userId.toString()).toBe(userId.toString());
      expect(savedFarmer.location.district).toBe(farmerData.location.district);
      expect(savedFarmer.location.municipality).toBe(farmerData.location.municipality);
      expect(savedFarmer.location.coordinates).toEqual(farmerData.location.coordinates);
      expect(savedFarmer.rating).toBe(0);
      expect(savedFarmer.reviewCount).toBe(0);
      expect(savedFarmer.isVerified).toBe(true);
    });

    it('should set default values correctly', async () => {
      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      };

      const farmer = new Farmer(farmerData);
      const savedFarmer = await farmer.save();

      expect(savedFarmer.rating).toBe(0);
      expect(savedFarmer.reviewCount).toBe(0);
      expect(savedFarmer.isVerified).toBe(false);
    });
  });

  describe('Farmer Validation', () => {
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const userData = {
        email: 'farmer@example.com',
        password: 'password123',
        role: UserRole.FARMER,
        profile: {
          name: 'Test Farmer'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();
      userId = savedUser._id;
    });

    it('should require userId', async () => {
      const farmerData = {
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      };

      const farmer = new Farmer(farmerData);
      
      await expect(farmer.save()).rejects.toThrow('User ID is required');
    });

    it('should require district', async () => {
      const farmerData = {
        userId: userId,
        location: {
          municipality: 'Test Municipality'
        }
      };

      const farmer = new Farmer(farmerData);
      
      await expect(farmer.save()).rejects.toThrow('District is required');
    });

    it('should require municipality', async () => {
      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District'
        }
      };

      const farmer = new Farmer(farmerData);
      
      await expect(farmer.save()).rejects.toThrow('Municipality is required');
    });

    it('should validate coordinate ranges', async () => {
      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality',
          coordinates: [200, 100] as [number, number] // Invalid coordinates
        }
      };

      const farmer = new Farmer(farmerData);
      
      await expect(farmer.save()).rejects.toThrow('Coordinates must be [longitude, latitude] with valid ranges');
    });

    it('should validate rating range', async () => {
      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        },
        rating: 6 // Invalid rating
      };

      const farmer = new Farmer(farmerData);
      
      await expect(farmer.save()).rejects.toThrow('Rating cannot exceed 5');
    });

    it('should enforce unique userId', async () => {
      const farmerData1 = {
        userId: userId,
        location: {
          district: 'Test District 1',
          municipality: 'Test Municipality 1'
        }
      };

      const farmerData2 = {
        userId: userId,
        location: {
          district: 'Test District 2',
          municipality: 'Test Municipality 2'
        }
      };

      const farmer1 = new Farmer(farmerData1);
      await farmer1.save();

      const farmer2 = new Farmer(farmerData2);
      await expect(farmer2.save()).rejects.toThrow();
    });
  });

  describe('Farmer Methods', () => {
    let farmer: IFarmer;
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const userData = {
        email: 'farmer@example.com',
        password: 'password123',
        role: UserRole.FARMER,
        profile: {
          name: 'Test Farmer'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();
      userId = savedUser._id;

      const farmerData = {
        userId: userId,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      };

      farmer = new Farmer(farmerData);
      await farmer.save();
    });

    it('should update rating correctly for new review', () => {
      // Initial state: 0 rating, 0 reviews
      expect(farmer.rating).toBe(0);
      expect(farmer.reviewCount).toBe(0);

      // Add first review
      farmer.updateRating(4);
      expect(farmer.rating).toBe(4);
      expect(farmer.reviewCount).toBe(1);

      // Add second review
      farmer.updateRating(5);
      expect(farmer.rating).toBe(4.5);
      expect(farmer.reviewCount).toBe(2);

      // Add third review
      farmer.updateRating(3);
      expect(farmer.rating).toBe(4);
      expect(farmer.reviewCount).toBe(3);
    });

    it('should round rating to 2 decimal places', () => {
      farmer.updateRating(4);
      farmer.updateRating(5);
      farmer.updateRating(4);
      
      // (4 + 5 + 4) / 3 = 4.333...
      expect(farmer.rating).toBe(4.33);
    });
  });

  describe('Farmer Population', () => {
    it('should populate user data', async () => {
      const userData = {
        email: 'farmer@example.com',
        password: 'password123',
        role: UserRole.FARMER,
        profile: {
          name: 'Test Farmer'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      const farmerData = {
        userId: savedUser._id,
        location: {
          district: 'Test District',
          municipality: 'Test Municipality'
        }
      };

      const farmer = new Farmer(farmerData);
      const savedFarmer = await farmer.save();

      const populatedFarmer = await Farmer.findById(savedFarmer._id).populate('user');
      
      expect(populatedFarmer?.user).toBeDefined();
      expect(populatedFarmer?.user?.email).toBe(userData.email);
      expect(populatedFarmer?.user?.profile.name).toBe(userData.profile.name);
    });
  });
});