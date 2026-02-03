import mongoose from 'mongoose';
import { config } from './environment';

// MongoDB connection options
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: config.DB_MAX_POOL_SIZE, // Maintain up to configured socket connections
  serverSelectionTimeoutMS: config.DB_SERVER_SELECTION_TIMEOUT, // Keep trying to send operations
  socketTimeoutMS: config.DB_SOCKET_TIMEOUT, // Close sockets after configured time
};

// Database connection class
export class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      const uri = config.NODE_ENV === 'test' && config.MONGODB_TEST_URI 
        ? config.MONGODB_TEST_URI 
        : config.MONGODB_URI;

      await mongoose.connect(uri, mongooseOptions);
      
      this.isConnected = true;
      console.log(`Connected to MongoDB: ${uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async clearDatabase(): Promise<void> {
    if (config.NODE_ENV !== 'test') {
      throw new Error('Database clearing is only allowed in test environment');
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]?.deleteMany({});
    }
  }

  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (state === 1) {
        // Perform a simple ping to verify connection
        await mongoose.connection.db.admin().ping();
        return {
          status: 'healthy',
          details: {
            state: states[state as keyof typeof states],
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
          }
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            state: states[state as keyof typeof states]
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();