import { Database } from '../database';

describe('Database Connection', () => {
  let database: Database;

  beforeEach(() => {
    database = Database.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = Database.getInstance();
    const instance2 = Database.getInstance();
    expect(instance1).toBe(instance2);
  });

  // Skip database connection tests if MongoDB is not available
  describe('MongoDB Connection Tests', () => {
    beforeEach(() => {
      if (process.env.SKIP_DB_TESTS === 'true') {
        console.log('Skipping database tests - MongoDB not available');
      }
    });

    it.skip('should connect to database', async () => {
      await database.connect();
      expect(database.getConnectionStatus()).toBe(true);
    });

    it.skip('should handle multiple connection attempts', async () => {
      await database.connect();
      await database.connect(); // Should not throw
      expect(database.getConnectionStatus()).toBe(true);
    });

    it.skip('should disconnect from database', async () => {
      await database.connect();
      await database.disconnect();
      expect(database.getConnectionStatus()).toBe(false);
    });
  });
});