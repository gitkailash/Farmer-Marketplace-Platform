import { createApp } from './app';
import { database } from './config/database';
import { config } from './config/environment';
import { databaseOptimizationService } from './services/DatabaseOptimizationService';

// Server startup function
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect();

    // Initialize database optimizations for multilingual content
    console.log('🔧 Initializing database optimizations...');
    try {
      await databaseOptimizationService.initializeOptimizations();
      console.log('✅ Database optimizations initialized successfully');
    } catch (error) {
      console.warn('⚠️  Database optimization initialization failed:', error);
      // Continue startup even if optimizations fail
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${config.PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await database.disconnect();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unhandled error during server startup:', error);
    process.exit(1);
  });
}

export { startServer };