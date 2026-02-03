import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Farmer Marketplace Platform API',
    version: '1.0.0',
    description: 'A comprehensive API for connecting farmers directly with buyers in a mobile-friendly marketplace platform',
    contact: {
      name: 'API Support',
      email: 'support@farmermarketplace.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.farmermarketplace.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication. Format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'role', 'profile'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID',
            example: '64f1a2b3c4d5e6f7g8h9i0j1',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          role: {
            type: 'string',
            enum: ['VISITOR', 'BUYER', 'FARMER', 'ADMIN'],
            description: 'User role in the system',
            example: 'BUYER',
          },
          profile: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
                description: 'User full name',
                example: 'John Doe',
              },
              phone: {
                type: 'string',
                description: 'User phone number',
                example: '+1234567890',
              },
              address: {
                type: 'string',
                description: 'User address',
                example: '123 Main St, City, State 12345',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Product: {
        type: 'object',
        required: ['name', 'description', 'category', 'price', 'unit', 'stock'],
        properties: {
          _id: {
            type: 'string',
            description: 'Product ID',
            example: '64f1a2b3c4d5e6f7g8h9i0j2',
          },
          farmerId: {
            type: 'string',
            description: 'ID of the farmer who owns this product',
            example: '64f1a2b3c4d5e6f7g8h9i0j3',
          },
          name: {
            type: 'string',
            description: 'Product name',
            example: 'Organic Tomatoes',
          },
          description: {
            type: 'string',
            description: 'Product description',
            example: 'Fresh organic tomatoes grown without pesticides',
          },
          category: {
            type: 'string',
            description: 'Product category',
            example: 'Vegetables',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Product price per unit',
            example: 4.99,
          },
          unit: {
            type: 'string',
            description: 'Unit of measurement',
            example: 'kg',
          },
          stock: {
            type: 'integer',
            description: 'Available stock quantity',
            example: 50,
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
            description: 'Array of product image URLs',
            example: ['https://example.com/tomato1.jpg', 'https://example.com/tomato2.jpg'],
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'INACTIVE'],
            description: 'Product status',
            example: 'PUBLISHED',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Product creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Order: {
        type: 'object',
        required: ['buyerId', 'farmerId', 'items', 'totalAmount', 'deliveryAddress'],
        properties: {
          _id: {
            type: 'string',
            description: 'Order ID',
            example: '64f1a2b3c4d5e6f7g8h9i0j4',
          },
          buyerId: {
            type: 'string',
            description: 'ID of the buyer',
            example: '64f1a2b3c4d5e6f7g8h9i0j5',
          },
          farmerId: {
            type: 'string',
            description: 'ID of the farmer',
            example: '64f1a2b3c4d5e6f7g8h9i0j6',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
            description: 'Array of ordered items',
          },
          totalAmount: {
            type: 'number',
            format: 'float',
            description: 'Total order amount',
            example: 29.95,
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'],
            description: 'Order status',
            example: 'PENDING',
          },
          deliveryAddress: {
            type: 'string',
            description: 'Delivery address',
            example: '456 Oak St, City, State 12345',
          },
          notes: {
            type: 'string',
            description: 'Additional order notes',
            example: 'Please deliver in the morning',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Order creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      OrderItem: {
        type: 'object',
        required: ['productId', 'quantity', 'priceAtTime'],
        properties: {
          productId: {
            type: 'string',
            description: 'ID of the ordered product',
            example: '64f1a2b3c4d5e6f7g8h9i0j2',
          },
          quantity: {
            type: 'integer',
            description: 'Quantity ordered',
            example: 3,
          },
          priceAtTime: {
            type: 'number',
            format: 'float',
            description: 'Price per unit at the time of order',
            example: 4.99,
          },
        },
      },
      Review: {
        type: 'object',
        required: ['orderId', 'reviewerId', 'revieweeId', 'reviewerType', 'rating', 'comment'],
        properties: {
          _id: {
            type: 'string',
            description: 'Review ID',
            example: '64f1a2b3c4d5e6f7g8h9i0j7',
          },
          orderId: {
            type: 'string',
            description: 'ID of the related order',
            example: '64f1a2b3c4d5e6f7g8h9i0j4',
          },
          reviewerId: {
            type: 'string',
            description: 'ID of the user giving the review',
            example: '64f1a2b3c4d5e6f7g8h9i0j5',
          },
          revieweeId: {
            type: 'string',
            description: 'ID of the user being reviewed',
            example: '64f1a2b3c4d5e6f7g8h9i0j6',
          },
          reviewerType: {
            type: 'string',
            enum: ['BUYER', 'FARMER'],
            description: 'Type of reviewer',
            example: 'BUYER',
          },
          rating: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Rating from 1 to 5',
            example: 5,
          },
          comment: {
            type: 'string',
            description: 'Review comment',
            example: 'Excellent quality tomatoes, very fresh!',
          },
          isApproved: {
            type: 'boolean',
            description: 'Whether the review is approved by admin',
            example: true,
          },
          moderatedBy: {
            type: 'string',
            description: 'ID of the admin who moderated this review',
            example: '64f1a2b3c4d5e6f7g8h9i0j8',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Review creation timestamp',
          },
        },
      },
      Message: {
        type: 'object',
        required: ['senderId', 'receiverId', 'content'],
        properties: {
          _id: {
            type: 'string',
            description: 'Message ID',
            example: '64f1a2b3c4d5e6f7g8h9i0j9',
          },
          senderId: {
            type: 'string',
            description: 'ID of the message sender',
            example: '64f1a2b3c4d5e6f7g8h9i0j5',
          },
          receiverId: {
            type: 'string',
            description: 'ID of the message receiver',
            example: '64f1a2b3c4d5e6f7g8h9i0j6',
          },
          content: {
            type: 'string',
            description: 'Message content',
            example: 'Hello, I would like to know more about your tomatoes.',
          },
          isRead: {
            type: 'boolean',
            description: 'Whether the message has been read',
            example: false,
          },
          moderationFlag: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            description: 'Moderation status',
            example: 'APPROVED',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Message creation timestamp',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          message: {
            type: 'string',
            description: 'Response message',
            example: 'Operation completed successfully',
          },
          errors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ValidationError',
            },
            description: 'Array of validation errors',
          },
        },
      },
      ValidationError: {
        type: 'object',
        required: ['field', 'message'],
        properties: {
          field: {
            type: 'string',
            description: 'Field that failed validation',
            example: 'email',
          },
          message: {
            type: 'string',
            description: 'Validation error message',
            example: 'Email is required',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Products',
      description: 'Product management endpoints',
    },
    {
      name: 'Orders',
      description: 'Order management endpoints',
    },
    {
      name: 'Reviews',
      description: 'Review and rating endpoints',
    },
    {
      name: 'Messages',
      description: 'Messaging system endpoints',
    },
    {
      name: 'Content',
      description: 'Content management endpoints (Gallery, Mayor, News)',
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints',
    },
  ],
};

const options: Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;