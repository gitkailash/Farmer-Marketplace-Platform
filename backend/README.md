# Farmer Marketplace Backend

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

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   └── environment.ts # Environment validation
├── middleware/      # Express middleware
│   ├── index.ts     # Middleware setup
│   └── errorHandler.ts # Error handling
├── test/           # Test configuration
│   └── setup.ts    # Jest setup
├── app.ts          # Express application
└── server.ts       # Server startup
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

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT_SECRET
4. Configure CORS_ORIGIN for your frontend domain
5. Set up proper logging and monitoring
6. Use process manager (PM2, Docker, etc.)

## Contributing

1. Follow TypeScript strict mode requirements
2. Write tests for new functionality
3. Use ESLint configuration
4. Follow existing code patterns
5. Update documentation as needed