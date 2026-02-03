import request from 'supertest';
import { createApp } from './app';

describe('Express App', () => {
  const app = createApp();

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Server is healthy',
      timestamp: expect.any(String),
      environment: expect.any(String),
    });
  });

  it('should respond to API base endpoint', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Farmer Marketplace API',
      version: '1.0.0',
      timestamp: expect.any(String),
      environment: expect.any(String),
      documentation: {
        interactive: '/api/docs/ui',
        json: '/api/docs',
      },
      health: '/health'
    });
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Route /unknown-route not found',
    });
  });
});