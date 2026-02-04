# 🏗️ System Architecture

[![Architecture](https://img.shields.io/badge/Architecture-Microservices%20Ready-blue)](https://microservices.io/)
[![Design Patterns](https://img.shields.io/badge/Design%20Patterns-MVC%20%7C%20Repository-green)](https://refactoring.guru/design-patterns)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Scalability](https://img.shields.io/badge/Scalability-Horizontal-orange)](https://en.wikipedia.org/wiki/Scalability)
[![Security](https://img.shields.io/badge/Security-OWASP-red?logo=owasp&logoColor=white)](https://owasp.org/)

Comprehensive architecture documentation for the Farmer Marketplace Platform, covering system design, technology stack, data flow, and scalability considerations.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability & Performance](#scalability--performance)
- [Monitoring & Observability](#monitoring--observability)

## 🌐 System Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │  Mobile Browser │    │   Admin Panel   │
│   (React SPA)   │    │   (PWA Ready)   │    │  (React Admin)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Load Balancer        │
                    │        (Nginx)            │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway           │
                    │   (Express.js + Auth)     │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│  Product API    │    │   Order API     │    │   User API      │
│   (Node.js)     │    │   (Node.js)     │    │   (Node.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Database Layer       │
                    │      (MongoDB)            │
                    └───────────────────────────┘
```

### Core Components

**Frontend Layer:**
- React 19 with TypeScript
- Vite build system
- Tailwind CSS for styling
- i18next for internationalization
- Redux Toolkit for state management
- PWA capabilities for mobile

**Backend Layer:**
- Node.js 18+ with Express.js
- TypeScript for type safety
- JWT-based authentication
- RESTful API design
- Swagger/OpenAPI documentation

**Database Layer:**
- MongoDB with Mongoose ODM
- Multilingual schema support
- Optimized indexes
- Backup and replication

**Infrastructure Layer:**
- Docker containerization
- Nginx reverse proxy
- Let's Encrypt SSL
- GitHub Actions CI/CD

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| [React](https://react.dev/) | 19.2.3 | UI Framework | [React Docs](https://react.dev/learn) |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Type Safety | [TS Handbook](https://www.typescriptlang.org/docs/) |
| [Vite](https://vitejs.dev/) | 6.4.1 | Build Tool | [Vite Guide](https://vitejs.dev/guide/) |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.0 | Styling | [Tailwind Docs](https://tailwindcss.com/docs) |
| [React Router](https://reactrouter.com/) | 7.11.0 | Routing | [Router Docs](https://reactrouter.com/en/main) |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.11.2 | State Management | [RTK Docs](https://redux-toolkit.js.org/introduction/getting-started) |
| [i18next](https://www.i18next.com/) | 25.7.4 | Internationalization | [i18next Docs](https://www.i18next.com/overview/getting-started) |
| [Axios](https://axios-http.com/) | 1.13.2 | HTTP Client | [Axios Docs](https://axios-http.com/docs/intro) |
| [Lucide React](https://lucide.dev/) | 0.562.0 | Icons | [Lucide Icons](https://lucide.dev/icons/) |

### Backend Technologies

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| [Node.js](https://nodejs.org/) | 18+ | Runtime | [Node.js Docs](https://nodejs.org/en/docs/) |
| [Express.js](https://expressjs.com/) | 4.18.2 | Web Framework | [Express Guide](https://expressjs.com/en/guide/routing.html) |
| [TypeScript](https://www.typescriptlang.org/) | 5.1.6 | Type Safety | [TS Handbook](https://www.typescriptlang.org/docs/) |
| [MongoDB](https://www.mongodb.com/) | 7.0 | Database | [MongoDB Manual](https://docs.mongodb.com/manual/) |
| [Mongoose](https://mongoosejs.com/) | 7.5.0 | ODM | [Mongoose Docs](https://mongoosejs.com/docs/guide.html) |
| [JWT](https://jwt.io/) | 9.0.2 | Authentication | [JWT Introduction](https://jwt.io/introduction) |
| [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 5.1.1 | Password Hashing | [Bcrypt Docs](https://github.com/kelektiv/node.bcrypt.js#readme) |
| [Helmet](https://helmetjs.github.io/) | 7.0.0 | Security Headers | [Helmet Docs](https://helmetjs.github.io/) |
| [Swagger](https://swagger.io/) | 6.2.8 | API Documentation | [Swagger Docs](https://swagger.io/docs/) |

### DevOps & Infrastructure

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| [Docker](https://www.docker.com/) | Containerization | [Docker Docs](https://docs.docker.com/) |
| [Docker Compose](https://docs.docker.com/compose/) | Multi-container Apps | [Compose Docs](https://docs.docker.com/compose/) |
| [Nginx](https://nginx.org/) | Reverse Proxy | [Nginx Docs](https://nginx.org/en/docs/) |
| [Let's Encrypt](https://letsencrypt.org/) | SSL Certificates | [Let's Encrypt Docs](https://letsencrypt.org/docs/) |
| [GitHub Actions](https://github.com/features/actions) | CI/CD Pipeline | [Actions Docs](https://docs.github.com/en/actions) |
| [AWS EC2](https://aws.amazon.com/ec2/) | Cloud Hosting | [EC2 User Guide](https://docs.aws.amazon.com/ec2/) |

## 🏛️ Architecture Patterns

### Frontend Architecture

**Component Architecture:**
```
src/
├── components/           # Reusable UI components
│   ├── UI/              # Basic UI components (Button, Modal, etc.)
│   ├── Layout/          # Layout components (Header, Footer, etc.)
│   ├── Forms/           # Form components
│   └── Business/        # Business logic components
├── pages/               # Page components (route handlers)
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── services/            # API service layer
├── store/               # Redux store and slices
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── i18n/                # Internationalization
```

**State Management Pattern:**
- **Local State**: React useState/useReducer for component-specific state
- **Global State**: Redux Toolkit for application-wide state
- **Server State**: React Query for server data caching
- **Form State**: React Hook Form for form management

**Component Design Patterns:**
- **Container/Presentational**: Separate logic from presentation
- **Compound Components**: Complex components with multiple parts
- **Render Props**: Share logic between components
- **Custom Hooks**: Reusable stateful logic

### Backend Architecture

**Layered Architecture:**
```
src/
├── controllers/         # Request handlers (HTTP layer)
├── services/           # Business logic layer
├── models/             # Data models (Database layer)
├── middleware/         # Express middleware
├── routes/             # Route definitions
├── validators/         # Input validation
├── utils/              # Utility functions
├── config/             # Configuration
└── types/              # TypeScript types
```

**Design Patterns:**
- **MVC Pattern**: Model-View-Controller separation
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Middleware Pattern**: Request/response processing
- **Factory Pattern**: Object creation
- **Observer Pattern**: Event handling

### API Design Patterns

**RESTful API Design:**
- Resource-based URLs
- HTTP methods for operations
- Consistent response format
- Proper status codes
- Pagination and filtering

**Response Format:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🗄️ Data Architecture

### Database Design

**MongoDB Collections:**

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  role: Enum['BUYER', 'FARMER', 'ADMIN'],
  profile: {
    name: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  preferences: {
    language: Enum['en', 'ne'],
    notifications: {
      email: Boolean,
      sms: Boolean
    }
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Products Collection
{
  _id: ObjectId,
  name: {
    en: String,
    ne: String
  },
  description: {
    en: String,
    ne: String
  },
  price: Number,
  unit: String,
  category: {
    en: String,
    ne: String
  },
  images: [String],
  stock: Number,
  farmerId: ObjectId,
  isOrganic: Boolean,
  harvestDate: Date,
  expiryDate: Date,
  tags: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Orders Collection
{
  _id: ObjectId,
  orderNumber: String,
  buyerId: ObjectId,
  farmerId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: Number,
    priceAtTime: Number,
    subtotal: Number
  }],
  status: Enum['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'],
  totalAmount: Number,
  deliveryFee: Number,
  grandTotal: Number,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  deliveryDate: Date,
  notes: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Multilingual Data Schema

**Multilingual Field Pattern:**
```javascript
const multilingualFieldSchema = {
  en: {
    type: String,
    required: true,
    trim: true
  },
  ne: {
    type: String,
    trim: true
  },
  _lastUpdated: {
    type: Date,
    default: Date.now
  }
};
```

**Usage Example:**
```javascript
const productSchema = new Schema({
  name: multilingualFieldSchema,
  description: multilingualFieldSchema,
  category: multilingualFieldSchema
});
```

### Data Relationships

**Relationship Types:**
- **One-to-Many**: User → Products, User → Orders
- **Many-to-Many**: Products ↔ Categories (via tags)
- **One-to-One**: User → Profile
- **Referenced**: Orders → Products (via productId)

**Indexing Strategy:**
```javascript
// Performance indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });
db.products.createIndex({ farmerId: 1, isActive: 1 });
db.products.createIndex({ category: 1, isActive: 1 });
db.orders.createIndex({ buyerId: 1, createdAt: -1 });
db.orders.createIndex({ farmerId: 1, status: 1 });

// Text search indexes
db.products.createIndex({
  "name.en": "text",
  "description.en": "text",
  "name.ne": "text",
  "description.ne": "text"
});
```

## 🔒 Security Architecture

### Authentication & Authorization

**JWT Token Flow:**
```
1. User Login → Credentials Validation
2. Generate JWT Token (HS256)
3. Return Token to Client
4. Client Stores Token (localStorage/httpOnly cookie)
5. Include Token in API Requests (Authorization header)
6. Server Validates Token on Protected Routes
7. Extract User Info from Token Payload
```

**Role-Based Access Control (RBAC):**
```javascript
const permissions = {
  BUYER: [
    'products:read',
    'orders:create',
    'orders:read:own',
    'reviews:create',
    'messages:create'
  ],
  FARMER: [
    'products:create',
    'products:update:own',
    'products:delete:own',
    'orders:read:own',
    'orders:update:own',
    'messages:read',
    'messages:create'
  ],
  ADMIN: [
    '*' // All permissions
  ]
};
```

### Security Measures

**Input Validation:**
- Express-validator for request validation
- Mongoose schema validation
- XSS protection with DOMPurify
- SQL injection prevention (NoSQL injection)

**Security Headers:**
```javascript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

**Rate Limiting:**
```javascript
// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP'
});

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // login attempts per window
  skipSuccessfulRequests: true
});
```

## 🚀 Deployment Architecture

### Container Architecture

**Multi-Stage Docker Build:**
```dockerfile
# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Production Deployment

**AWS EC2 Deployment:**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  backend:
    build:
      context: ./backend
      target: production
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  frontend:
    build:
      context: ./frontend
      target: production
    restart: always
    ports:
      - "3000:80"
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
```

### Load Balancing

**Nginx Configuration:**
```nginx
upstream backend {
    least_conn;
    server backend_1:5000 max_fails=3 fail_timeout=30s;
    server backend_2:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## ⚡ Scalability & Performance

### Horizontal Scaling

**Backend Scaling:**
- Stateless application design
- Load balancer distribution
- Database connection pooling
- Session management with JWT

**Database Scaling:**
- MongoDB replica sets
- Read replicas for read-heavy operations
- Sharding for large datasets
- Connection pooling

### Performance Optimization

**Frontend Optimization:**
```javascript
// Code splitting
const ProductPage = lazy(() => import('./pages/ProductPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));

// Bundle optimization
const rollupOptions = {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      router: ['react-router-dom'],
      ui: ['@headlessui/react', 'lucide-react']
    }
  }
};

// Image optimization
const optimizedImages = {
  formats: ['webp', 'avif', 'jpeg'],
  sizes: [320, 640, 960, 1280, 1920],
  quality: 80
};
```

**Backend Optimization:**
```javascript
// Database query optimization
const getProducts = async (filters) => {
  return Product.find(filters)
    .select('name price category images farmer')
    .populate('farmer', 'name rating location')
    .lean() // Return plain objects
    .limit(20)
    .sort({ createdAt: -1 });
};

// Response caching
const cache = new Map();
const getCachedData = (key, ttl = 3600) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl * 1000) {
    return cached.data;
  }
  return null;
};
```

### Caching Strategy

**Multi-Level Caching:**
```
Browser Cache (Static Assets)
    ↓
CDN Cache (Images, CSS, JS)
    ↓
Application Cache (API Responses)
    ↓
Database Query Cache
    ↓
Database (MongoDB)
```

## 📊 Monitoring & Observability

### Application Monitoring

**Health Checks:**
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseHealth(),
    dependencies: await checkDependencies()
  };
  
  res.json(health);
});
```

**Logging Strategy:**
```javascript
// Structured logging with Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Performance Metrics

**Key Performance Indicators (KPIs):**
- Response time (95th percentile < 500ms)
- Throughput (requests per second)
- Error rate (< 1%)
- Database query time
- Memory usage
- CPU utilization

**Monitoring Tools:**
- Application Performance Monitoring (APM)
- Database monitoring
- Infrastructure monitoring
- Log aggregation
- Error tracking

### Alerting

**Alert Conditions:**
```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: High Response Time
    condition: response_time_p95 > 1000ms
    duration: 10m
    severity: warning
    
  - name: Database Connection Issues
    condition: db_connection_errors > 0
    duration: 1m
    severity: critical
    
  - name: High Memory Usage
    condition: memory_usage > 80%
    duration: 15m
    severity: warning
```

## 🔮 Future Architecture Considerations

### Microservices Migration

**Service Decomposition:**
- User Service (Authentication, Profiles)
- Product Service (Catalog, Inventory)
- Order Service (Order Management)
- Payment Service (Payment Processing)
- Notification Service (Email, SMS)
- Analytics Service (Reporting, Metrics)

### Event-Driven Architecture

**Event Sourcing:**
- Order events (created, updated, completed)
- User events (registered, profile updated)
- Product events (created, stock updated)
- Payment events (processed, failed)

### API Gateway

**Gateway Features:**
- Request routing
- Authentication/authorization
- Rate limiting
- Request/response transformation
- Monitoring and analytics

---

This architecture documentation provides a comprehensive overview of the Farmer Marketplace Platform's technical design and implementation. The architecture is designed to be scalable, maintainable, and secure while providing excellent performance for users in Nepal and beyond.

For implementation details, refer to the [Deployment Guide](./DEPLOYMENT.md) and [Configuration Guide](./CONFIGURATION.md).