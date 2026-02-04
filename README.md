# 🌾 Farmer Marketplace Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](docs/DEPLOYMENT.md)
[![Multilingual](https://img.shields.io/badge/Languages-English%20%7C%20Nepali-blue)](docs/USER_GUIDE.md#multilingual-support)
[![API](https://img.shields.io/badge/API-RESTful-orange)](docs/API.md)

A modern, multilingual web application connecting farmers directly with buyers in Nepal. Built with React, Node.js, and MongoDB, featuring comprehensive multilingual support (English/Nepali) and production-ready deployment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Docker & Docker Compose (recommended)

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd farmer-marketplace-platform

# Start with Docker (recommended)
docker-compose up -d

# Or start manually
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs/ui

## 📋 Features

### 🔐 Authentication & User Management
- Multi-role system (Buyer, Farmer, Admin)
- JWT-based authentication
- Secure password hashing
- Profile management

### 🛒 Product & Order Management
- Product catalog with categories and search
- Shopping cart functionality
- Order tracking and management
- Inventory management for farmers

### ⭐ Review System
- Bidirectional reviews (buyers ↔ farmers)
- Star ratings and comments
- Review editing and approval workflow
- Farmer reputation system

### 💬 Messaging System
- Direct messaging between users
- Conversation history
- Real-time message notifications

### 🌐 Multilingual Support
- Full English and Nepali translations
- Dynamic language switching
- Translation management system
- CDN-optimized translation delivery

### 📱 Content Management
- News ticker with multilingual support
- Mayor message announcements
- Gallery management
- Home page content management

### 🛡️ Security & Performance
- Rate limiting and security headers
- Input validation and sanitization
- Response caching
- Database optimization
- Health monitoring

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Internationalization**: i18next
- **Testing**: Vitest + React Testing Library

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Validation**: Express-validator + Zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with property-based testing

### Database (MongoDB)
- **Collections**: Users, Products, Orders, Reviews, Messages, Content
- **Features**: Multilingual schema support, indexing, aggregation
- **Backup**: Automated backup scripts

### Deployment
- **Development**: Docker Compose with hot reload
- **Production**: Multi-container setup with Nginx load balancer
- **Monitoring**: Health checks and logging
- **Scaling**: Horizontal scaling support

## 📁 Project Structure

```
farmer-marketplace-platform/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database schemas
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── validators/      # Input validation
│   │   └── scripts/         # Database migrations & utilities
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   ├── store/           # Redux store
│   │   ├── i18n/            # Translations
│   │   └── utils/           # Utility functions
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Documentation
├── scripts/                 # Deployment & utility scripts
├── nginx/                   # Nginx configuration
├── docker-compose.yml       # Development setup
├── docker-compose.prod.yml  # Production setup
└── README.md
```

## 🚀 Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### AWS EC2 Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed AWS deployment instructions.

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm run test:watch         # Watch mode
```

### Frontend Testing
```bash
cd frontend
npm test                   # Run all tests
npm run test:coverage     # Run with coverage
npm run test:ui           # Visual test runner
```

## 🌐 Internationalization

The platform supports English and Nepali languages with:
- 8 translation namespaces (common, auth, products, admin, buyer, farmer, reviews, home)
- Dynamic language switching
- Translation management API
- CDN optimization for fast loading

### Managing Translations
```bash
# Import translations to database
cd backend && node import-json-translations.js

# Export translations from database
cd backend && node production-translation-import.js

# Validate translations
cd frontend && npm run i18n:validate
```

## 📊 Monitoring & Analytics

### Health Checks
- Backend: `GET /health`
- Database connectivity monitoring
- Service availability checks

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking and reporting

### Performance
- Response caching
- Database query optimization
- CDN for static assets

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@localhost:27017/farmer-marketplace
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-domain.com
```

**Frontend (.env)**
```env
VITE_API_URL=https://api.your-domain.com
VITE_NODE_ENV=production
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for complete configuration guide.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **API Reference**: http://localhost:5000/api/docs/ui
- **Issues**: Create an issue on GitHub
- **Email**: support@farmermarketplace.com

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Multi-vendor marketplace
- [ ] AI-powered recommendations
- [ ] Blockchain supply chain tracking

---

**Built with ❤️ for farmers and buyers in Nepal**