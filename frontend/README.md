# Farmer Marketplace Frontend

[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.0+-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![i18next](https://img.shields.io/badge/i18next-23+-26A69A?logo=i18next&logoColor=white)](https://www.i18next.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-Deployable-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](../docs/DEPLOYMENT.md)

Modern React frontend for the Farmer Marketplace Platform with comprehensive multilingual support (English/Nepali) and responsive design.

## ✨ Features

- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety and developer experience
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Redux Toolkit**: Predictable state management
- **React Router**: Client-side routing with lazy loading
- **i18next**: Comprehensive internationalization (English/Nepali)
- **Responsive Design**: Mobile-first approach
- **PWA Ready**: Service worker and offline support
- **Testing**: Vitest with React Testing Library
- **Performance**: Code splitting and lazy loading

## 🚀 Prerequisites

- Node.js 18+
- npm or yarn

## 📦 Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_NODE_ENV=development
   ```

## 🛠️ Development

### Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3001`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Testing
```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

## 🌍 Internationalization

### Translation Management
```bash
# Extract translation keys
npm run i18n:extract

# Validate translations
npm run i18n:validate

# Generate translation report
npm run i18n:report

# Check translation completeness
npm run i18n:check
```

### Translation Deployment
```bash
# Optimize and deploy translations
npm run translations:deploy

# Deploy to specific CDN providers
npm run translations:deploy:aws
npm run translations:deploy:cloudflare
npm run translations:deploy:azure
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── UI/             # Base UI components
│   │   ├── Layout/         # Layout components
│   │   ├── Cart/           # Shopping cart components
│   │   ├── Reviews/        # Review system components
│   │   ├── Messaging/      # Messaging components
│   │   └── admin/          # Admin panel components
│   ├── pages/              # Page components
│   │   ├── admin/          # Admin pages
│   │   └── farmer/         # Farmer dashboard pages
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── store/              # Redux store and slices
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── i18n/               # Internationalization
│   │   └── locales/        # Translation files
│   │       ├── en/         # English translations
│   │       └── ne/         # Nepali translations
│   ├── config/             # Configuration files
│   └── test/               # Test utilities and mocks
├── public/                 # Static assets
├── dist/                   # Production build output
├── node_modules/           # Dependencies
├── .env.example            # Environment template
├── Dockerfile              # Docker configuration
├── nginx.conf              # Nginx configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies & scripts
```

## 🎨 UI Components

### Base Components
- **Button**: Customizable button with variants
- **Form**: Form components with validation
- **Modal**: Accessible modal dialogs
- **Toast**: Notification system
- **LoadingSpinner**: Loading indicators
- **ErrorBoundary**: Error handling

### Feature Components
- **LanguageSwitcher**: Language selection
- **MultilingualInput**: Multilingual form inputs
- **NotificationCenter**: Real-time notifications
- **LazyImage**: Optimized image loading
- **OfflineFallback**: Offline mode handling

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |
| `VITE_NODE_ENV` | Environment mode | development |
| `VITE_APP_NAME` | Application name | Farmer Marketplace |
| `VITE_DEFAULT_LANGUAGE` | Default language | en |
| `VITE_SUPPORTED_LANGUAGES` | Supported languages | en,ne |

## 🐳 Docker Support

### Development with Docker
```bash
# Build and run with docker-compose
docker-compose up --build

# Run only frontend service
docker-compose up frontend
```

### Production Docker Build
```bash
# Build production image
docker build -t farmer-marketplace-frontend .

# Run production container
docker run -p 3000:80 farmer-marketplace-frontend
```

## 🚀 Production Deployment

### AWS S3 + CloudFront Deployment
```bash
# Build for production
npm run build

# Deploy to S3 (requires AWS CLI)
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### EC2 with Nginx Deployment
```bash
# Build production bundle
npm run build

# Copy to server
scp -r dist/ user@server:/var/www/farmer-marketplace/

# Restart nginx
sudo systemctl restart nginx
```

For detailed deployment instructions, see [Deployment Guide](../docs/DEPLOYMENT.md).

## 🧪 Testing

### Test Structure
```
src/test/
├── integration/        # Integration tests
├── mocks/             # Mock data and handlers
├── setup.ts           # Test setup configuration
└── __tests__/         # Component tests
```

### Testing Best Practices
- Write tests for critical user flows
- Mock external dependencies
- Test multilingual functionality
- Include accessibility tests
- Test responsive behavior

## 📊 Performance Optimization

- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Dynamic imports for non-critical components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Service worker for offline functionality
- **Compression**: Gzip compression in production

## 🔒 Security Features

- **Content Security Policy**: XSS protection
- **HTTPS Enforcement**: Secure communication
- **Input Sanitization**: XSS prevention
- **Authentication**: JWT token management
- **Route Protection**: Private route guards
- **Error Boundaries**: Graceful error handling

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔍 Troubleshooting

### Common Issues

**Build Fails with TypeScript Errors**
```bash
# Check TypeScript configuration
npm run type-check

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Development Server Won't Start**
```bash
# Check if port is in use
lsof -i :3001

# Use different port
npm run dev -- --port 3002
```

**Translation Keys Missing**
```bash
# Extract and validate translations
npm run i18n:extract
npm run i18n:validate
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Vite debug mode
npm run dev -- --debug
```

## 📚 Related Documentation

- [API Documentation](../docs/API.md) - Backend API reference
- [Deployment Guide](../docs/DEPLOYMENT.md) - Production deployment
- [User Guide](../docs/USER_GUIDE.md) - End-user documentation
- [Architecture Overview](../docs/ARCHITECTURE.md) - System architecture
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines

## 🤝 Contributing

1. Follow React and TypeScript best practices
2. Write tests for new components
3. Ensure accessibility compliance
4. Test multilingual functionality
5. Update documentation as needed

For detailed contribution guidelines, see [Contributing Guide](../CONTRIBUTING.md).