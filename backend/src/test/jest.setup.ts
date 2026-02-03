// Jest setup file to configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long-for-validation';
process.env.MONGODB_URI = 'mongodb://localhost:27017/farmer-marketplace-test';