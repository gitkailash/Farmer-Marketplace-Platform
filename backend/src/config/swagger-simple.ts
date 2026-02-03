// Simple Swagger configuration without external dependencies
export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Farmer Marketplace Platform API',
    version: '1.0.0',
    description: 'A comprehensive API for connecting farmers directly with buyers',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role', 'profile'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['BUYER', 'FARMER'] },
                  profile: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      phone: { type: 'string' },
                      address: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
          },
          '400': {
            description: 'Validation error',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
          },
          '401': {
            description: 'Invalid credentials',
          },
        },
      },
    },
  },
};