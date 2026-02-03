import mongoose from 'mongoose';
import { User, UserRole, IUser } from '../User';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../../test/setup';

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User',
          phone: '+1234567890',
          address: '123 Test Street'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.profile.name).toBe(userData.profile.name);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should set default role to VISITOR', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe(UserRole.VISITOR);
    });
  });

  describe('User Validation', () => {
    it('should require email', async () => {
      const userData = {
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require valid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should require password', async () => {
      const userData = {
        email: 'test@example.com',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should require minimum password length', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should require profile name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {}
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Name is required');
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User 1'
        }
      };

      const userData2 = {
        email: 'test@example.com',
        password: 'password456',
        role: UserRole.FARMER,
        profile: {
          name: 'Test User 2'
        }
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user: IUser;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.BUYER,
        profile: {
          name: 'Test User'
        }
      };

      user = new User(userData);
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    it('should exclude password from JSON output', () => {
      const userJson = user.toJSON();
      
      expect(userJson.password).toBeUndefined();
      expect(userJson.email).toBe('test@example.com');
      expect(userJson.role).toBe(UserRole.BUYER);
      expect(userJson.profile.name).toBe('Test User');
    });
  });

  describe('User Roles', () => {
    it('should accept all valid roles', async () => {
      const roles = [UserRole.VISITOR, UserRole.BUYER, UserRole.FARMER, UserRole.ADMIN];

      for (const role of roles) {
        const userData = {
          email: `test-${role.toLowerCase()}@example.com`,
          password: 'password123',
          role: role,
          profile: {
            name: `Test ${role}`
          }
        };

        const user = new User(userData);
        const savedUser = await user.save();
        
        expect(savedUser.role).toBe(role);
      }
    });

    it('should reject invalid roles', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE' as any,
        profile: {
          name: 'Test User'
        }
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });
});