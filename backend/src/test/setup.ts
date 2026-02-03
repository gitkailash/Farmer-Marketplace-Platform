import mongoose from 'mongoose';
import { config } from '../config/environment';

export const setupTestDatabase = async (): Promise<void> => {
  // Use test database URI if available, otherwise use main URI with test suffix
  const testUri = config.MONGODB_TEST_URI || config.MONGODB_URI;
  
  // Connect to the test database
  await mongoose.connect(testUri);
};

export const teardownTestDatabase = async (): Promise<void> => {
  // Close mongoose connection
  await mongoose.connection.close();
};

export const clearTestDatabase = async (): Promise<void> => {
  // Only clear database in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database clearing is only allowed in test environment');
  }
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
};

// Increase timeout for database operations
jest.setTimeout(30000);