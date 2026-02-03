import express from 'express';
import { applyMiddleware } from './middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import SecurityMiddleware from './middleware/security';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import reviewRoutes from './routes/reviewRoutes';
import messageRoutes from './routes/messageRoutes';
import contentRoutes from './routes/contentRoutes';
import adminRoutes from './routes/adminRoutes';
import docsRoutes from './routes/docsRoutes';
import translationRoutes from './routes/translationRoutes';
import { database } from './config/database';
import { config } from './config/environment';

// Create Express application
export const createApp = (): express.Application => {
  const app = express();

  // Apply basic middleware
  applyMiddleware(app);

  // Apply security middleware
  SecurityMiddleware.applySecurityMiddleware(app);

  // API Documentation routes
  app.use('/api/docs', docsRoutes);

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/translations', translationRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const dbHealth = await database.healthCheck();
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      const healthStatus = {
        status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        environment: config.NODE_ENV,
        version: '1.0.0',
        services: {
          database: dbHealth,
          memory: {
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
          }
        }
      };

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'Farmer Marketplace API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      documentation: {
        interactive: '/api/docs/ui',
        json: '/api/docs',
      },
      health: '/health'
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;