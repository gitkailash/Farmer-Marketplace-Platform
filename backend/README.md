# Farmer Marketplace Backend

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-Deployable-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](../docs/DEPLOYMENT.md)

Backend API for the Farmer Marketplace Platform - a production-ready MVP web application that connects farmers directly with buyers.

## Features

- **TypeScript**: Full type safety and better developer experience
- **Express.js**: RESTful API with comprehensive middleware pipeline
- **MongoDB**: Document database with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication
- **Environment Validation**: Zod-based configuration validation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Testing**: Jest with property-based testing support
- **Error Handling**: Centralized error handling with proper logging

## Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Set a secure JWT_SECRET (minimum 32 characters)
   - Configure MongoDB connection strings
   - Adjust other settings as needed

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | Required |
| `MONGODB_TEST_URI` | Test database connection | Optional |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | 7d |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Base
- `GET /api` - API information and version

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product (farmers only)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (owner only)
- `DELETE /api/products/:id` - Delete product (owner only)

### Orders
- `GET /api/orders` - List user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review (owner only)
- `DELETE /api/reviews/:id` - Delete review (owner only)

### Messages
- `GET /api/messages` - List user messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message thread

### Content Management
- `GET /api/news` - List news items
- `POST /api/news` - Create news (admin only)
- `GET /api/mayor` - Get mayor messages
- `POST /api/mayor` - Create mayor message (admin only)
- `GET /api/gallery` - List gallery items
- `POST /api/gallery` - Create gallery item (admin only)

### Translations
- `GET /api/translations` - Get translations for language
- `POST /api/translations` - Create/update translations (admin only)

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

For detailed API documentation with request/response schemas, see [API Documentation](../docs/API.md).

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # MongoDB connection setup
│   │   ├── environment.ts   # Environment validation with Zod
│   │   └── swagger.ts       # API documentation setup
│   ├── controllers/         # Route handlers
│   │   ├── authController.ts
│   │   ├── productController.ts
│   │   ├── orderController.ts
│   │   ├── reviewController.ts
│   │   ├── messageController.ts
│   │   ├── newsController.ts
│   │   ├── mayorController.ts
│   │   ├── galleryController.ts
│   │   ├── translationController.ts
│   │   └── adminController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validation.ts    # Input validation
│   │   ├── security.ts      # Security headers & rate limiting
│   │   ├── errorHandler.ts  # Centralized error handling
│   │   └── index.ts         # Middleware setup
│   ├── models/              # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Order.ts
│   │   ├── Review.ts
│   │   ├── Message.ts
│   │   ├── News.ts
│   │   ├── Mayor.ts
│   │   ├── Gallery.ts
│   │   ├── TranslationKey.ts
│   │   └── types/           # TypeScript type definitions
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic services
│   │   ├── TranslationService.ts
│   │   ├── ContentLocalizer.ts
│   │   └── NotificationTemplateService.ts
│   ├── validators/          # Input validation schemas
│   │   ├── authValidators.ts
│   │   ├── productValidators.ts
│   │   ├── orderValidators.ts
│   │   └── translationValidators.ts
│   ├── utils/               # Utility functions
│   │   └── jwt.ts           # JWT token utilities
│   ├── test/                # Test configuration
│   │   └── setup.ts         # Jest setup
│   ├── app.ts               # Express application setup
│   └── server.ts            # Server startup
├── scripts/                 # Utility scripts
│   ├── create-admin.ts      # Admin user creation
│   └── migrations/          # Database migrations
├── dist/                    # Compiled JavaScript (production)
├── node_modules/            # Dependencies
├── .env.example             # Environment template
├── Dockerfile               # Docker configuration
├── jest.config.js           # Jest testing configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies & scripts
```

## Testing

The project uses Jest for testing with support for:
- Unit tests for individual components
- Integration tests for API endpoints
- Property-based testing with fast-check
- Database testing with test isolation

Run tests with MongoDB available:
```bash
npm test
```

Run tests without MongoDB:
```bash
SKIP_DB_TESTS=true npm test
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Express-validator integration
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure authentication
- **Error Handling**: No information leakage

## Docker Support

### Development with Docker
```bash
# Build and run with docker-compose
docker-compose up --build

# Run only backend service
docker-compose up backend
```

### Production Docker Build
```bash
# Build production image
docker build -t farmer-marketplace-backend .

# Run production container
docker run -p 5000:5000 --env-file .env farmer-marketplace-backend
```

## Production Deployment

### AWS EC2 Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI (AWS DocumentDB recommended)
3. Set secure JWT_SECRET (use AWS Secrets Manager)
4. Configure CORS_ORIGIN for your frontend domain
5. Set up proper logging and monitoring (CloudWatch)
6. Use process manager (PM2, Docker, or AWS ECS)
7. Configure SSL/TLS certificates
8. Set up load balancer (AWS ALB)

### Environment Setup
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

For detailed deployment instructions, see [Deployment Guide](../docs/DEPLOYMENT.md).

## Contributing

1. Follow TypeScript strict mode requirements
2. Write tests for new functionality
3. Use ESLint configuration
4. Follow existing code patterns
5. Update documentation as needed

For detailed contribution guidelines, see [Contributing Guide](../CONTRIBUTING.md).

## Monitoring & Logging

### Development Logging
- Console logging with different levels (error, warn, info, debug)
- Request/response logging middleware
- Database query logging

### Production Monitoring
- AWS CloudWatch integration
- Error tracking and alerting
- Performance metrics collection
- Health check endpoints for load balancers

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MongoDB connection string
echo $MONGODB_URI

# Test MongoDB connectivity
mongosh $MONGODB_URI --eval "db.runCommand('ping')"
```

**JWT Token Issues**
```bash
# Verify JWT_SECRET is set and secure (min 32 characters)
echo $JWT_SECRET | wc -c
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Enable specific debug namespaces
DEBUG=app:* npm run dev
```

## Performance Optimization

- **Database Indexing**: Optimized indexes for common queries
- **Caching**: Redis integration for session and data caching
- **Compression**: Gzip compression for API responses
- **Rate Limiting**: Request throttling to prevent abuse
- **Connection Pooling**: MongoDB connection optimization

## Security Considerations

- **Input Validation**: All inputs validated with express-validator
- **SQL Injection Prevention**: Mongoose ODM provides protection
- **XSS Protection**: Helmet middleware with security headers
- **CSRF Protection**: SameSite cookie configuration
- **Rate Limiting**: Express-rate-limit implementation
- **Password Security**: bcrypt with configurable rounds
- **JWT Security**: Secure token generation and validation

## Related Documentation

- [API Documentation](../docs/API.md) - Detailed API reference
- [Deployment Guide](../docs/DEPLOYMENT.md) - Production deployment instructions
- [Architecture Overview](../docs/ARCHITECTURE.md) - System architecture
- [Configuration Guide](../docs/CONFIGURATION.md) - Environment setup
- [User Guide](../docs/USER_GUIDE.md) - End-user documentation