# ⚙️ Configuration Guide

[![Environment](https://img.shields.io/badge/Environment-Variables-4CAF50)](https://12factor.net/config)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Configuration-47A248?logo=mongodb&logoColor=white)](https://docs.mongodb.com/manual/reference/configuration-options/)
[![Nginx](https://img.shields.io/badge/Nginx-Configuration-009639?logo=nginx&logoColor=white)](https://nginx.org/en/docs/)
[![SSL/TLS](https://img.shields.io/badge/SSL%2FTLS-Configuration-003A70?logo=letsencrypt&logoColor=white)](https://letsencrypt.org/docs/)
[![Security](https://img.shields.io/badge/Security-Hardened-red)](https://owasp.org/)
[![Performance](https://img.shields.io/badge/Performance-Optimized-orange)](https://web.dev/performance/)
[![Monitoring](https://img.shields.io/badge/Monitoring-Enabled-blue)](https://prometheus.io/)

Comprehensive configuration guide for the Farmer Marketplace Platform covering environment variables, database settings, security configurations, and deployment options.

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Security Settings](#security-settings)
- [Frontend Configuration](#frontend-configuration)
- [Docker Configuration](#docker-configuration)
- [Nginx Configuration](#nginx-configuration)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Tuning](#performance-tuning)

## 🌍 Environment Variables

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# ===========================================
# NODE.JS CONFIGURATION
# ===========================================
NODE_ENV=production
PORT=5000

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# MongoDB connection string
MONGODB_URI=mongodb://username:password@localhost:27017/farmer-marketplace?authSource=admin

# Test database (for running tests)
MONGODB_TEST_URI=mongodb://username:password@localhost:27017/farmer-marketplace-test?authSource=admin

# Database connection options
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5
DB_MAX_IDLE_TIME_MS=30000
DB_SERVER_SELECTION_TIMEOUT_MS=5000

# ===========================================
# JWT AUTHENTICATION
# ===========================================
# JWT secret key (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long

# JWT token expiration
JWT_EXPIRES_IN=7d

# JWT algorithm (HS256, HS384, HS512)
JWT_ALGORITHM=HS256

# ===========================================
# PASSWORD SECURITY
# ===========================================
# Bcrypt rounds (10-15 recommended, higher = more secure but slower)
BCRYPT_ROUNDS=12

# ===========================================
# CORS CONFIGURATION
# ===========================================
# Allowed origins (comma-separated for multiple)
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# CORS credentials
CORS_CREDENTIALS=true

# ===========================================
# RATE LIMITING
# ===========================================
# Rate limit window in milliseconds (15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Maximum requests per window
RATE_LIMIT_MAX_REQUESTS=100

# Rate limit for authentication endpoints
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# ===========================================
# SECURITY HEADERS
# ===========================================
# Content Security Policy
CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'

# HSTS max age (1 year in seconds)
HSTS_MAX_AGE=31536000

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Log format (json, simple)
LOG_FORMAT=json

# Log file path (optional)
LOG_FILE_PATH=/var/log/farmer-marketplace/app.log

# ===========================================
# CACHING CONFIGURATION
# ===========================================
# Enable response caching
ENABLE_RESPONSE_CACHE=true

# Cache TTL in seconds (1 hour)
CACHE_TTL=3600

# Redis URL (if using Redis for caching)
REDIS_URL=redis://localhost:6379

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
# Maximum file size in bytes (10MB)
MAX_FILE_SIZE=10485760

# Allowed file types (comma-separated)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Upload directory
UPLOAD_DIR=uploads

# CDN URL (optional)
CDN_URL=https://cdn.your-domain.com

# ===========================================
# EMAIL CONFIGURATION
# ===========================================
# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email from address
EMAIL_FROM=noreply@your-domain.com

# ===========================================
# NOTIFICATION CONFIGURATION
# ===========================================
# Enable email notifications
ENABLE_EMAIL_NOTIFICATIONS=true

# Enable SMS notifications (if integrated)
ENABLE_SMS_NOTIFICATIONS=false

# SMS provider settings
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your-twilio-sid
SMS_AUTH_TOKEN=your-twilio-token
SMS_FROM_NUMBER=+1234567890

# ===========================================
# ANALYTICS & MONITORING
# ===========================================
# Enable analytics
ENABLE_ANALYTICS=true

# Google Analytics ID (optional)
GA_TRACKING_ID=GA-XXXXXXXXX

# Sentry DSN for error tracking (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Health check endpoint
HEALTH_CHECK_ENDPOINT=/health

# ===========================================
# API DOCUMENTATION
# ===========================================
# Enable Swagger UI in production
ENABLE_SWAGGER_UI=false

# API documentation title
API_DOCS_TITLE=Farmer Marketplace API

# API documentation version
API_DOCS_VERSION=1.0.0

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================
# Enable debug mode
DEBUG=false

# Enable request logging
ENABLE_REQUEST_LOGGING=true

# Enable SQL query logging
ENABLE_QUERY_LOGGING=false
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
# ===========================================
# VITE CONFIGURATION
# ===========================================
# API base URL
VITE_API_URL=https://api.your-domain.com

# Environment
VITE_NODE_ENV=production

# ===========================================
# APPLICATION SETTINGS
# ===========================================
# Application name
VITE_APP_NAME=Farmer Marketplace

# Application version
VITE_APP_VERSION=1.0.0

# Default language
VITE_DEFAULT_LANGUAGE=en

# Supported languages (comma-separated)
VITE_SUPPORTED_LANGUAGES=en,ne

# ===========================================
# FEATURE FLAGS
# ===========================================
# Enable PWA features
VITE_ENABLE_PWA=true

# Enable offline support
VITE_ENABLE_OFFLINE=true

# Enable push notifications
VITE_ENABLE_PUSH_NOTIFICATIONS=true

# Enable analytics
VITE_ENABLE_ANALYTICS=true

# ===========================================
# EXTERNAL SERVICES
# ===========================================
# Google Analytics ID
VITE_GA_TRACKING_ID=GA-XXXXXXXXX

# Google Maps API key (if using maps)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase configuration (if using Firebase)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# ===========================================
# CDN CONFIGURATION
# ===========================================
# CDN URL for static assets
VITE_CDN_URL=https://cdn.your-domain.com

# Image optimization service
VITE_IMAGE_SERVICE_URL=https://images.your-domain.com

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================
# Enable debug mode
VITE_DEBUG=false

# Enable mock API (for development)
VITE_ENABLE_MOCK_API=false

# API request timeout (milliseconds)
VITE_API_TIMEOUT=30000
```

## 🗄️ Database Configuration

### MongoDB Configuration

**Connection String Format:**
```
mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]
```

**Production MongoDB Configuration:**
```javascript
// MongoDB configuration options
const mongoOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // Replica set settings
  replicaSet: 'rs0',
  readPreference: 'primary',
  
  // Authentication
  authSource: 'admin',
  authMechanism: 'SCRAM-SHA-256',
  
  // SSL/TLS
  ssl: true,
  sslValidate: true,
  
  // Compression
  compressors: ['snappy', 'zlib'],
  
  // Write concern
  w: 'majority',
  wtimeout: 5000,
  j: true
};
```

**Database Indexes:**
```javascript
// Create indexes for optimal performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });
db.products.createIndex({ "name.en": "text", "description.en": "text" });
db.products.createIndex({ category: 1, isActive: 1 });
db.products.createIndex({ farmerId: 1, createdAt: -1 });
db.orders.createIndex({ buyerId: 1, createdAt: -1 });
db.orders.createIndex({ farmerId: 1, status: 1 });
db.reviews.createIndex({ farmerId: 1, status: 1 });
db.messages.createIndex({ recipientId: 1, isRead: 1 });
```

**Backup Configuration:**
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="farmer-marketplace-$DATE.gz"

mongodump --host localhost:27017 \
  --username admin \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db farmer-marketplace \
  --gzip \
  --archive=$BACKUP_DIR/$BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

## 🔒 Security Settings

### JWT Configuration

**JWT Security Best Practices:**
```javascript
// JWT configuration
const jwtConfig = {
  // Use strong secret (minimum 32 characters)
  secret: process.env.JWT_SECRET,
  
  // Algorithm selection
  algorithm: 'HS256', // or RS256 for asymmetric
  
  // Token expiration
  expiresIn: '7d',
  
  // Issuer and audience
  issuer: 'farmer-marketplace',
  audience: 'farmer-marketplace-users',
  
  // Additional claims
  claims: {
    iat: true, // Issued at
    exp: true, // Expiration
    nbf: true, // Not before
    jti: true  // JWT ID
  }
};
```

### Password Security

**Bcrypt Configuration:**
```javascript
// Password hashing configuration
const bcryptConfig = {
  // Salt rounds (10-15 recommended)
  rounds: 12,
  
  // Password requirements
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  
  // Password history (prevent reuse)
  historySize: 5
};
```

### Rate Limiting Configuration

**Express Rate Limit:**
```javascript
// Rate limiting configuration
const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Authentication rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts per window
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },
  
  // Registration rate limit
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // registrations per hour
    skipSuccessfulRequests: false
  }
};
```

### Security Headers

**Helmet Configuration:**
```javascript
// Security headers configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
};
```

## 🎨 Frontend Configuration

### Vite Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.your-domain\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', 'lucide-react'],
          i18n: ['i18next', 'react-i18next']
        }
      }
    }
  },
  
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
});
```

### Tailwind Configuration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        secondary: {
          50: '#fefce8',
          100: '#fef3c7',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207'
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        nepali: ['Noto Sans Devanagari', 'system-ui', 'sans-serif']
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite'
      }
    },
  },
  
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ],
}
```

### i18n Configuration

**i18n/index.ts:**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ne'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false
    },
    
    resources: {
      en: {
        common: () => import('./locales/en/common.json'),
        auth: () => import('./locales/en/auth.json'),
        products: () => import('./locales/en/products.json'),
        // ... other namespaces
      },
      ne: {
        common: () => import('./locales/ne/common.json'),
        auth: () => import('./locales/ne/auth.json'),
        products: () => import('./locales/ne/products.json'),
        // ... other namespaces
      }
    },
    
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
    }
  });

export default i18n;
```

## 🐳 Docker Configuration

### Development Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: farmer-marketplace-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-password}
      MONGO_INITDB_DATABASE: ${MONGO_DB_NAME:-farmer-marketplace}
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - farmer-marketplace-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: farmer-marketplace-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 5000
      MONGODB_URI: mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-password}@mongodb:27017/${MONGO_DB_NAME:-farmer-marketplace}?authSource=admin
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - farmer-marketplace-network
    command: npm run dev

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: farmer-marketplace-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:5000
      VITE_NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - farmer-marketplace-network
    command: npm run dev

volumes:
  mongodb_data:
    driver: local

networks:
  farmer-marketplace-network:
    driver: bridge
```

### Production Docker Compose

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  # Production MongoDB with replica set
  mongodb:
    image: mongo:7.0
    container_name: farmer-marketplace-db-prod
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DB_NAME}
    volumes:
      - mongodb_prod_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
      - ./backups:/backups
    networks:
      - farmer-marketplace-prod-network
    command: mongod --auth --bind_ip_all --replSet rs0
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  # Production Backend with multiple replicas
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DB_NAME}?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - farmer-marketplace-prod-network
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s

  # Production Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      VITE_API_URL: ${VITE_API_URL}
      VITE_NODE_ENV: production
    ports:
      - "3000:80"
    networks:
      - farmer-marketplace-prod-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
        reservations:
          memory: 128M
          cpus: '0.1'

volumes:
  mongodb_prod_data:
    driver: local

networks:
  farmer-marketplace-prod-network:
    driver: bridge
```

### Backend Dockerfile

**backend/Dockerfile:**
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

**frontend/Dockerfile:**
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Development stage
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built application
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /usr/share/nginx/html
RUN chown -R nodejs:nodejs /var/cache/nginx
RUN chown -R nodejs:nodejs /var/log/nginx
RUN chown -R nodejs:nodejs /etc/nginx/conf.d

USER nodejs

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 Nginx Configuration

### Production Nginx Configuration

**nginx/nginx.conf:**
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Upstream backend servers
    upstream backend {
        least_conn;
        server backend:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Frontend server
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # Root directory
        root /usr/share/nginx/html;
        index index.html;

        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                access_log off;
            }
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # API server
    server {
        listen 80;
        server_name api.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.your-domain.com;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

        # API routes
        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints with stricter rate limiting
        location ~* ^/api/auth/(login|register) {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check (no rate limiting)
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

## 🔐 SSL/TLS Configuration

### Let's Encrypt Setup

**Automated SSL Certificate Management:**
```bash
#!/bin/bash
# ssl-setup.sh

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx \
  -d your-domain.com \
  -d www.your-domain.com \
  -d api.your-domain.com \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email \
  --redirect

# Test automatic renewal
sudo certbot renew --dry-run

# Add renewal to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### SSL Security Configuration

**Strong SSL Configuration:**
```nginx
# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

# Security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 📊 Monitoring & Logging

### Application Logging

**Winston Logger Configuration:**
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  
  defaultMeta: {
    service: 'farmer-marketplace',
    version: process.env.APP_VERSION || '1.0.0'
  },
  
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

module.exports = logger;
```

### Health Monitoring

**Health Check Configuration:**
```javascript
// health.js
const healthCheck = {
  // Database health
  database: async () => {
    try {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
  
  // Memory usage
  memory: () => {
    const usage = process.memoryUsage();
    return {
      status: usage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
    };
  },
  
  // Uptime
  uptime: () => ({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
};
```

## ⚡ Performance Tuning

### Node.js Performance

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'farmer-marketplace-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Performance settings
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    
    // Logging
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // Monitoring
    monitoring: false,
    pmx: false
  }]
};
```

### Database Performance

**MongoDB Performance Tuning:**
```javascript
// Database optimization settings
const mongooseOptions = {
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  
  // Buffer settings
  bufferMaxEntries: 0,
  bufferCommands: false,
  
  // Read preferences
  readPreference: 'primary',
  readConcern: { level: 'majority' },
  
  // Write concerns
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000
  }
};
```

### Caching Configuration

**Redis Caching:**
```javascript
// cache.js
const redis = require('redis');

const cacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  
  // Connection settings
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  
  // Cache TTL settings
  defaultTTL: 3600, // 1 hour
  shortTTL: 300,    // 5 minutes
  longTTL: 86400    // 24 hours
};

const client = redis.createClient(cacheConfig);
```

---

This configuration guide provides comprehensive settings for all aspects of the Farmer Marketplace Platform. Adjust the values according to your specific requirements and environment constraints.

For additional configuration options, refer to the official documentation:
- [Node.js Configuration](https://nodejs.org/api/cli.html)
- [MongoDB Configuration](https://docs.mongodb.com/manual/reference/configuration-options/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Docker Configuration](https://docs.docker.com/compose/compose-file/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)